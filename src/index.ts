import * as dotenv from 'dotenv'
// import main_log from 'simple-node-logger'
import * as path from 'path'
// import Bree from 'bree'
import { google } from 'googleapis'
import * as dayjs from 'dayjs'
import { Schema, model, connect, connection } from 'mongoose'
import { Todos } from './Models/todo'

dotenv.config()

import { GoogleCalendarAPI } from './APIs/google-calendar-api.js'
import { NotionAPI } from './APIs/notion-api.js'

// connect('mongodb://mongodb:27017/test', { useNewUrlParser: true })

const main = async () => {
  // const todos = await Todos.find()
  const calendarAPI = new GoogleCalendarAPI('main_test')
  const notionAPI = new NotionAPI('main_test')
  // const events = await calendarAPI.getTodaysFilteredCalendarEvents()
  const notionScheduledTasks = await notionAPI.findAllNotionScheduledEvents()
  // for (const event of events) {
  //   console.log(event.summary)
  //   console.log(event)
  // }
  if (notionScheduledTasks) {
    // for (const task of notionScheduledTasks) {
    console.log(JSON.stringify(notionScheduledTasks))
    // const actionItem = task.properties['Action Item']
    // console.log(actionItem?.title[0].plain_text)
    // }
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
