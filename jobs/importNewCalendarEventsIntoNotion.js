import * as dotenv from 'dotenv'
import main_log from 'simple-node-logger'
import * as path from 'path'
import Bree from 'bree'
import { google } from 'googleapis'
import dayjs from 'dayjs'
dotenv.config()
const options = { jobName: '[[Import New Calendar Events Into Notion]]' }

import { GoogleCalendarAPI } from '../APIs/google-calendar-api.js'
import { NotionAPI } from '../APIs/notion-api.js'

const calendarAPI = new GoogleCalendarAPI(options)
const notionAPI = new NotionAPI(options)
const events = await calendarAPI.getTodaysFilteredCalendarEvents()

for (const event of events) {
  console.log(event.summary)
  const existingNotionTask = await notionAPI.findGoogleCalendarEventByURL(
    event.htmlLink
  )

  if (existingNotionTask === undefined) {
    // job_logger.log('info', 'highlight is new!')
    console.log('event not found in Notion! this one is new!')
    const page = notionAPI.convertCalendarEventToNotionPage(event)
    // console.log(page)
    await notionAPI.createPageInDatabase(page)
  } else {
    console.log('found the event in Notion!')
    // job_logger.log('info', 'highlight already exists!')
    console.log(existingNotionTask)
  }
}
