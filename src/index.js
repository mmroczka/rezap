import * as dotenv from 'dotenv'
import main_log from 'simple-node-logger'
import * as path from 'path'
import Bree from 'bree'
import { google } from 'googleapis'
import dayjs from 'dayjs'
import { mongoose } from 'mongoose'
dotenv.config()
const options = { jobName: '[[Import New Calendar Events Into Notion]]' }

import { GoogleCalendarAPI } from '../APIs/google-calendar-api.js'
import { NotionAPI } from '../APIs/notion-api.js'

const calendarAPI = new GoogleCalendarAPI(options)
const notionAPI = new NotionAPI(options)
// const events = await calendarAPI.getTodaysFilteredCalendarEvents()

mongoose.connect('mongodb://mongodb:27017/test', { useNewUrlParser: true })

const db = mongoose.connection
db.on('error'.console.error.bind(console, 'CONNECTION ERROR'))
db.once('open', function () {
  // we're connected!
  console.log('Connected!')
})

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
