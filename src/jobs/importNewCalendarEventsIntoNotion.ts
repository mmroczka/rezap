import * as dotenv from 'dotenv'
import * as path from 'path'
import Bree from 'bree'
import { google } from 'googleapis'
dotenv.config()
const jobName: string = '[[Import New Calendar Events Into Notion]]'

import { GoogleCalendarAPI } from '../APIs/google-calendar-api.js'
import { NotionAPI } from '../APIs/notion-api.js'

const main = async () => {
  const calendarAPI = new GoogleCalendarAPI(jobName)
  const notionAPI = new NotionAPI(jobName)
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
      await notionAPI.addPageInDatabase(page)
    } else {
      console.log('found the event in Notion!')
      // job_logger.log('info', 'highlight already exists!')
      console.log(existingNotionTask)
    }
  }
}

main()
