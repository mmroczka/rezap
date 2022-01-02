import { GoogleCalendarAPI } from '../APIs/google-calendar-api.js'
import { Logger } from '../utils/Logger'
import { NotionAPI } from '../APIs/notion-api.js'
import { RezapCalendarTask } from '../Models/rezapItem'
import { connect, connection } from 'mongoose'
import * as dayjs from 'dayjs'
import customParseFormat from 'dayjs/plugin/customParseFormat'
dayjs.extend(customParseFormat)
const jobName: string = '[[Sync GCal & Notion Tasks]]'

const setupDB = async () => {
  let db = connection
  db.on('error', console.error.bind(console, 'CONNECTION ERROR'))
  await connect('mongodb://localhost:27017/test', {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  const rezap = db.collection('rezapcalendartasks')
  return {
    rezap,
    close() {
      return db.close()
    },
  }
}

export enum ChangeTypes {
  NAME = 'NAME',
  START = 'START_TIME',
  END = 'END_TIME',
}

const main = async () => {
  const notionAPI = new NotionAPI(jobName)
  const calendarAPI = new GoogleCalendarAPI(jobName)
  const mongoDB = await setupDB()
  const logger = new Logger('./src/logs/main.log', 'syncGoogleCalendarAndNotionScheduledTasks', jobName)

  try {
    const events = await calendarAPI.getNextTwoWeeksOfFilteredEvents()

    // Check Google Calendar for new items and sync them
    logger.log('\n\ninfo: === Syncing New Google Calendar Tasks ===')
    for (const event of events) {
      logger.log(`info: Checking DB for event: ${event.summary}`)
      const calendarEvent = await RezapCalendarTask.findOne({
        googleCalID: event.id,
      })
      if (calendarEvent) {
        // it's already in the DB so we've synced this item at least once already
        logger.log(
          `info: \tEvent Found (${event.summary}) in the DB so no update needed!`
        )
      } else {
        // it isn't in the DB, so add it
        logger.log(
          `info: \tEvent *NOT* Found (${event.summary}) in the DB -> attempting to add`
        )
        const convertedEvent = notionAPI.convertCalendarEventToNotionPage(event)
        // post page to notion and catch the returned object with ID (we'll need that later)
        const notionTask = await notionAPI.addPageInDatabase(convertedEvent)
        // using event and notion page, create hybrid DB model interleaving properties from both
        const eventAsModel = calendarAPI.convertEventToModel(event, notionTask)
        await mongoDB.rezap.insertOne(eventAsModel)
      }
    }

    // Check Notion for new tasks and sync them
    logger.log('\n\ninfo: === Syncing New Notion Tasks ===')
    const tasks = await notionAPI?.findAllNotionScheduledEvents()
    if (!tasks) throw Error('notion tasks should never come back undefined')
    for (const task of tasks) {
      const currentTaskName =
        task?.properties['Action Item']?.title[0]?.plain_text
      logger.log(`info: Checking DB for task: ${currentTaskName}`)
      const existingNotionTask = await RezapCalendarTask.findOne({
        notionPageID: task.id,
      })

      if (existingNotionTask) {
        // it's already in the DB so we've synced this item at least once already
        logger.log(
          `info: \tTask Found (${currentTaskName}) in the DB so no update needed!`
        )
      } else {
        // it isn't in the DB, so add it
        logger.log(
          `info: \tTask *NOT* Found (${currentTaskName}) in the DB -> attempting to add`
        )
        const convertedTask = calendarAPI.convertNotionTaskToCalendarEvent(task)
        // post converted task to Google Calendar and catch the returned object with ID (we'll need that later)
        const calendarTask = await calendarAPI.addTaskToGoogleCalendar(
          convertedTask
        )
        // using event and notion page, create hybrid DB model interleaving properties from both
        const eventAsModel = calendarAPI.convertEventToModel(calendarTask, task)
        await mongoDB.rezap.insertOne(eventAsModel)
      }
    }

    // Reconcile out of sync events from Notion and Google Calendar
    logger.log(
      '\n\ninfo: === Reconciling Events from Google Calendar & Notion ==='
    )
    const twoWeeksAgo = dayjs
      .default()
      .subtract(14, 'days')
      .startOf('day')
      .format()
    const threeWeeksFromNow = dayjs
      .default()
      .add(21, 'days')
      .endOf('day')
      .format()
    const existingDBItems = await RezapCalendarTask.find({
      'start.startTime': {
        $gte: twoWeeksAgo,
        $lt: threeWeeksFromNow,
      },
      done: false,
    })
    let gCalIds: any[] = []
    let notionIds: any[] = []
    existingDBItems.forEach((item: any) => {
      gCalIds.push(item.googleCalID)
      notionIds.push(item.notionPageID)
      // logger.log(item)
    })
    const matchingGoogleCalendarEvents =
      await calendarAPI.getAllMatchingEventsById(gCalIds)

    const matchingNotionPages = await notionAPI.getAllMatchingPagesById(
      notionIds
    )
    for (const dbItem of existingDBItems) {
      const existingNotionPage = matchingNotionPages?.find(
        (page) => page?.id === dbItem?.notionPageID
      )
      const existingGoogleCalendarEvent = matchingGoogleCalendarEvents?.find(
        (event) => event?.id === dbItem?.googleCalID
      )
      // if we find both the GCal event and the Notion Page...
      if (existingGoogleCalendarEvent && existingNotionPage) {
        const gCalEvent = {
          id: existingGoogleCalendarEvent?.id,
          name: existingGoogleCalendarEvent?.summary,
          updatedTime: dayjs
            .default(existingGoogleCalendarEvent?.updated)
            .format('YYYY-MM-DDTHH:mm:ss.000ZZ'),
          startTime: dayjs
            .default(existingGoogleCalendarEvent?.start?.dateTime)
            .format('YYYY-MM-DDTHH:mm:ss.000ZZ'),
          endTime: dayjs
            .default(existingGoogleCalendarEvent?.end?.dateTime)
            .format('YYYY-MM-DDTHH:mm:ss.000ZZ'),
        }
        const notionTask = {
          id: existingNotionPage?.id,
          name: existingNotionPage?.properties['Action Item']?.title[0]
            ?.plain_text,
          updatedTime: dayjs.default(existingNotionPage?.last_edited_time),
          startTime: dayjs
            .default(existingNotionPage?.properties['Do Date']?.date?.start)
            .format(),
          endTime: dayjs
            .default(existingNotionPage?.properties['Do Date']?.date?.end)
            .format(),
        }
        logger.log(
          `Comparing existing ${gCalEvent.name} (GCal) and ${notionTask.name} (Notion)`
        )
        // if name doesn't match
        let databasePatch: any = {}
        logger.log(
          'Checking name, start, and end date to make sure they are in sync'
        )
        if (
          gCalEvent.name !== notionTask.name ||
          !dayjs.default(gCalEvent.startTime).isSame(notionTask.startTime) ||
          !dayjs.default(gCalEvent.endTime).isSame(notionTask.endTime)
        ) {
          logger.log(
            `NOTION DATA
            ${JSON.stringify(
              notionTask,
              null,
              2
            )}\n GCAL DATA\n ${JSON.stringify(gCalEvent, null, 2)}`
          )
          logger.log('SYNC DIFFERENCE DETECTED!')
          logger.log(
            `info: Are start times different? ${
              !dayjs.default(gCalEvent.startTime).isSame(notionTask.startTime)
                ? 'Yes'
                : 'No'
            }`
          )
          logger.log(
            `info: Are end times different? ${
              !dayjs.default(gCalEvent.endTime).isSame(notionTask.endTime)
                ? 'Yes'
                : 'No'
            }`
          )
          if (notionTask.updatedTime.isAfter(gCalEvent.updatedTime)) {
            // notionTask is more recent, so we have to catch calendar up
            calendarAPI.patchCalendarProperties(gCalEvent.id, notionTask)
            databasePatch['taskName'] = notionTask.name
          } else {
            // calendar is more recent, so we have to catch notion up
            notionAPI.patchNotionProperties(notionTask.id, gCalEvent)
            databasePatch['taskName'] = gCalEvent.name
          }
          logger.log(`updating DB item (${dbItem._id}) to...${databasePatch}`)
          logger.log('current DB item: ', dbItem)
          const updatedItem = await mongoDB.rezap.findOneAndUpdate(
            { _id: dbItem._id },
            { $set: databasePatch },
            {
              upsert: true,
            }
          )
          logger.log('updated DB item: ', updatedItem)
        }
      } else {
        // we didn't find either the GCal or Notion Page
        // if both are missing, delete from DB
        logger.log('COULD NOT FIND EXISTING NOTION OR DB TASK...')
        if (!existingGoogleCalendarEvent && !existingNotionPage) {
          logger.log(
            "Couldn't find GCal OR Notion Page, so deleting it from DB"
          )
          await mongoDB.rezap.deleteOne({ _id: dbItem._id })
        } else {
          // since it was synced previously...
          //  if GCal event is missing, it means we deleted it from our calendar
          if (existingNotionPage) {
            //    since the task is still in Notion...
            //    if it still has a priority of Scheduled and it has a do date with start/end times plus a name...
            if (
              existingNotionPage &&
              !!existingNotionPage?.properties['Action Item']?.title[0]
                ?.plain_text &&
              !!existingNotionPage?.properties['Do Date']?.date?.start &&
              existingNotionPage?.properties['Priority']?.select['name'] ===
                'Scheduled 🗓' &&
              existingNotionPage?.properties['Done'] === false
            ) {
              //  add it back to calendar, must have been deleted by mistake
              // logger.log(
              //   'exsting Notion page suffices, so build event and save to DB...'
              // )
              // const convertedTask =
              //   calendarAPI.convertNotionTaskToCalendarEvent(existingNotionPage)
              // const calendarTask = await calendarAPI.addTaskToGoogleCalendar(
              //   convertedTask
              // )
              // const eventAsModel = calendarAPI.convertEventToModel(
              //   calendarTask,
              //   existingNotionPage
              // )
              // logger.log('event as model writing to DB')
              // logger.log(eventAsModel)
              // await mongoDB.rezap.deleteOne({ _id: dbItem._id })
              // await mongoDB.rezap.insertOne(eventAsModel)
            }
          } else {
            // notion event is missing. be safe and don't remove calendar event (even though it's still present)
            // definitely still delete it from the DB though to free up space and not have it stuck in limbo
            // logger.log(
            //   "Notion event is missing. Don't delete if from the calendar to be safe, but delete from local DB"
            // )
            // await mongoDB.rezap.deleteOne({ _id: dbItem._id })
          }
        }
      }
    }

    /*
        Edge cases to especially consider
        - SYNC: In NOTION, I should sync events I've made, but I shouldn't be able to edit them (Teals meeting or Google Team Matching)
        - CALENDAR SIDE: events that I didn't create should sync 3 weeks out, but ones I DID create should sync only 1 week out
        - CALENDAR SIDE: should I sync multi-day events? Not sure if this makes sense or not. :/
        - NOTION SIDE: if event has start date but no times associated with it, give don't default to 30 min
      */
  } catch (e) {
    logger.log(`error: Error in main app -> ${e}`)
  } finally {
    mongoDB.close()
    logger.log('info: Closing DB connection')
  }
}

main()
