import * as path from 'path'
// import Bree from 'bree'
import { google } from 'googleapis'
import * as dayjs from 'dayjs'
import { Schema, model, connect, connection } from 'mongoose'
import { RezapCalendarTask } from './Models/rezapItem'
// dotenv.config()

import { GoogleCalendarAPI } from './APIs/google-calendar-api.js'
import { NotionAPI } from './APIs/notion-api.js'
import { CalendarEvent } from './Models/calendarEvent'

const main = async () => {

  const notionAPI = new NotionAPI('main_test')
  const calendarAPI = new GoogleCalendarAPI('main_test')
  const events = await calendarAPI.getNextTwoWeeksOfFilteredEvents()

  for (const event of events) {
    const calendarEvent = await CalendarEvent.find({ googleCalID: { $eq: event.id } })
    if (calendarEvent) {
      // it's already in the DB
      console.log('found the event! in the DB so no update needed!')
    } else {
      // it isn't in the DB, so add it
      // convert event to Notion Page format
      const convertedEvent = notionAPI.convertCalendarEventToNotionPage(event)
      // post page to notion and catch the returned object with ID (we'll need that later)
      const notionTask = await notionAPI.addPageInDatabase(convertedEvent)

      // using event and notion page, create hybrid DB model interleaving properties from both
      const eventAsModel = calendarAPI.convertEventToModel(event, notionTask)

      // eventAsModel.save(function (err: any, event: any) {
      //   if (err) return console.error(err)
      //   console.log(
      //     event?.summary + ' saved newly found CalendarEvent to collection.'
      //   )
      // })
      // console.log('event not found in the filteredEvents')
    }
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
