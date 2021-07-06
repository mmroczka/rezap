import * as path from 'path'
// import Bree from 'bree'
import { google } from 'googleapis'
import { connect, connection } from 'mongoose'
import { RezapCalendarTask } from './Models/rezapItem'
import { GoogleCalendarAPI } from './APIs/google-calendar-api.js'
import { NotionAPI } from './APIs/notion-api.js'

const setupDB = async () => {
  let db = connection
  db.on('error', console.error.bind(console, 'CONNECTION ERROR'))
  console.log('MongoDB connected? ', connection.readyState === 1)
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

const main = async () => {
  const notionAPI = new NotionAPI('main_test')
  const calendarAPI = new GoogleCalendarAPI('main_test')
  const mongoDB = await setupDB()
  try {
    const events = await calendarAPI.getNextTwoWeeksOfFilteredEvents()
    // const e = await CalendarEvent.create(events[1])
    for (const event of events.slice(0, 2)) {
      console.log(`checking DB for ID: ${event.id} -> ${event.summary}`)
      const calendarEvent = await RezapCalendarTask.findOne({
        googleCalID: event.id,
      })
      if (calendarEvent) {
        // it's already in the DB
        console.log('found the event! in the DB so no update needed!')
      } else {
        // it isn't in the DB, so add it
        // convert event to Notion Page format
        console.log('NOT FOUND')
        const convertedEvent = notionAPI.convertCalendarEventToNotionPage(event)
        // post page to notion and catch the returned object with ID (we'll need that later)
        const notionTask = await notionAPI.addPageInDatabase(convertedEvent)

        // using event and notion page, create hybrid DB model interleaving properties from both
        const eventAsModel = calendarAPI.convertEventToModel(event, notionTask)

        await mongoDB.rezap.insertOne(eventAsModel)

        // const result eventAsModel.save(function (err: any, event: any) {
        //   if (err) return console.error(err)
        //   console.log(
        //     'saved newly found calendar event to RezapCalendarTask DB.'
        //   )
        //   mongoDB.close()
        // })
      }
    }
  } catch (e) {
    console.log('error', 'Error in main app -> ', e)
  } finally {
    mongoDB.close()
    console.log('info', 'Closing DB connection')
  }
}

main()

// for (const event of events) {
//   console.log(event.summary)
//   const existingNotionTask = await notionAPI.findGoogleCalendarEventByURL(
//     event.htmlLink
//   )

//   if (existingNotionTask === undefined) {
//     // Existing Google Calendar Event does not exist as a Task in Notion -> add it to Notion
//     // job_logger.log('info', 'highlight is new!')
//     console.log('event not found in Notion! this one is new!')
//     const page = notionAPI.convertCalendarEventToNotionPage(event)
//     // console.log(page)
//     await notionAPI.createPageInDatabase(page)
//   } else {
//     /*
//     Features
//     * if Notion task exists with the same name -> match them together (not implemented)
//     *
//     */
//     // Existing Google Calendar Event matched a Notion Task
//     // update Google Calendar with the
//     console.log('found the event in Notion!')
//     console.log(existingNotionTask)
//     // job_logger.log('info', 'highlight already exists!')
//   }
// }

/**
 *
 *
 *
 *
 *
 *
 *
 *
 *
 *
 *
 */
//  import Graceful from 'node-graceful';
//  Graceful.captureExceptions = true;

//  Graceful.on('exit', async () => {
//    await server.close();
//  });
// console.log('starting index.js')
// const bree = new Bree({
//   logger: console,
//   jobs: [
//     // runs `./jobs/importHighlightsToNotion.js` on start and then every 1 minutes
//     {
//       name: 'importHighlightsToNotion',
//       interval: '1m',
//     },
//   ],
// })

// console.log('starting bree')
// bree.start()
