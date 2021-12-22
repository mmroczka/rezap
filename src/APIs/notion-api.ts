import { Client } from '@notionhq/client'
import logger from 'simple-node-logger'
import constants from '../constants.config'
import { connect, connection, model } from 'mongoose'
import * as dayjs from 'dayjs'
import { NotionTask } from '../Models/notionTask'

class NotionAPIError extends Error {}

export class NotionAPI {
  protected notion

  constructor(public jobName: string = 'No Job Name') {
    // console.log('my log', this.logger)
    // const logger = logger?.createSimpleLogger('logs/notion-api.log')
    this.notion = new Client({ auth: constants.NOTION_KEY })
    console.log('info', `${jobName}: starting Notion logger`)
  }

  async retrieveDatabase(databaseId: any) {
    try {
      const response = await this.notion.databases.retrieve({
        database_id: databaseId,
      })
      if (!response) {
        throw new NotionAPIError('issue retrieving database from Notion')
      }
      return response
    } catch (e) {
      console.log('error', 'NotionAPI [retrieveDatabase] ' + e)
    }
  }

  convertTasksToModels(notionTasks: any) {
    connect('mongodb://mongodb:27017/test', { useNewUrlParser: true })
    console.log('======== TEST ========')
    const db = connection
    db.on('error', console.error.bind(console, 'CONNECTION ERROR'))

    let taskList: any = []
    // db.once('open', function () {
    //   console.log('Connection Successful!')

    //   for (const e of notionTasks) {
    //     // a document instance
    //     const task = new CalendarEvent({
    //       id: e.id,
    //       status: e.status,
    //       htmlLink: e.htmlLink,
    //       created: e.created,
    //       updated: e.updated,
    //       summary: e.summary,
    //       start: {
    //         dateTime: e.start.dateTime,
    //       },
    //       end: {
    //         dateTime: e.end.dateTime,
    //       },
    //       sequence: e.sequence,
    //       reminders: {
    //         useDefaults: e.reminders.useDefaults,
    //       },
    //     })

    //     // save model to database
    //     task.save((err: any, event: any) => {
    //       if (err) return console.error(err)
    //       console.log(event.summary + ' saved to bookstore collection.')
    //       console.log(event)
    //     })
    //     eventList.push(event)
    //   }
    // })
    return taskList
  }

  async findAllNotionScheduledEvents() {
    try {
      const matchingSelectResults = await this.notion.databases.query({
        database_id: constants.NOTION_TASKS_DB_ID,
        filter: {
          and: [
            {
              property: 'Priority',
              select: {
                equals: 'Scheduled 🗓',
              },
            },
            {
              property: 'Done',
              checkbox: {
                equals: false,
              },
            },
          ],
        },
      })
      if (!matchingSelectResults) {
        return []
      }
      return matchingSelectResults?.results
    } catch (error) {
      console.log('error', `[findNotionScheduledEvents]: ${error}`)
    }
  }

  async findDayPageByDate(dateToFind: any) {
    try {
      const queryFilterSelectFilterTypeBased = {
        property: 'Date',
        date: {
          equals: dateToFind,
        },
      }
      const matchingSelectResults = await this.notion.databases.query({
        database_id: constants.NOTION_DAY_DB_ID,
        filter: queryFilterSelectFilterTypeBased,
      })
      return matchingSelectResults.results[0] || undefined
    } catch (error) {
      console.log('error', `[findDayPageByDate]: ${error}`)
    }
  }

  async updateDaysSleepStats(page_id: string, sleepStat: any) {
    try {
      const matchingSelectResults = await this.notion.pages.update({
        page_id: page_id,
        properties: {
          "Bedtime Start": {
            type: "date",
              "date": {
                "start": sleepStat.bedtime_start,
              },
            },
          "Bedtime End": {
            type: "date",
              "date": {
                "start": sleepStat.bedtime_end,
              },
            },
          // bedtime_end - bedtime_start (includes time *awake*)
          "Time In Bed": {
              type: "number",
              "number": sleepStat.duration,
            },
          // percentage of the night you were actually sleeping rather than awake 
          "Sleep Efficiency": {
              type: "number",
              "number": sleepStat.efficiency/100,
            },
          "REM Sleep": {
              type: "number",
              "number": sleepStat.rem,
            },
          "Light Sleep": {
              type: "number",
              "number": sleepStat.light,
            },
          "Deep Sleep": {
              type: "number",
              "number": sleepStat.deep,
            },
          // rem + light + deep sleep (excludes time *awake*)
          "Total Sleep": {
              type: "number",
              "number": sleepStat.total,
            },
          // Detected latency from bedtime_start to the beginning of the first five minutes of persistent sleep 
          "Sleep Onset Latency": {
              type: "number",
              "number": sleepStat.onset_latency,
            },
          // Represents sleep onset latency's (see sleep.onset_latency) contribution for sleep quality.
          // A latency of about 15 minutes gives best score. Latency longer than that many indicate problems
          // falling asleep, whereas a very short latency may be a sign of sleep debt.
          "Sleep Score Latency": {
              type: "number",
              "number": sleepStat.score_latency/100,
            },
          // Average HRV calculated with rMSSD method. -> https://cloud.ouraring.com/docs/sleep
          "Avg HRV": {
              type: "number",
              "number": sleepStat.rmssd,
            },
          "Consistent Bedtime": {
              type: "checkbox",
              "checkbox": this.isBedtimeConsistent(dayjs.default(sleepStat.summary_date), dayjs.default(sleepStat.bedtime_start)),
            },
          "Consistent Wake Time": {
              type: "checkbox",
              "checkbox": this.isWakeTimeConsistent(dayjs.default(sleepStat.bedtime_end)),
            },
          },
        }
      )
      // query({
      //   database_id: constants.NOTION_DAY_DB_ID,
      //   filter: queryFilterSelectFilterTypeBased,
      // })
      // return matchingSelectResults.results[0] || undefined
    } catch (error) {
      console.log('error', `[findDayPageByDate]: ${error}`)
    }
  }

  isBedtimeConsistent(currentDay: any, bedtimeStart: any){
    // check bedtime start is on current day (you haven't gone to sleep past midnight)
    if (bedtimeStart.isSame(currentDay, "day")){
      // check if bedtime start is before 10:15 which is when I really need to have been sleeping
      if (bedtimeStart.hour() < 22 || (bedtimeStart.hour() === 22 && bedtimeStart.minute() <= 15)) {
        return true
      }
    }
    return false
  }

  isWakeTimeConsistent(bedtimeEnd: any){
    // check if bedtime end is before 6:15 which is when I should have woken up 
    if (bedtimeEnd.hour() < 6 || (bedtimeEnd.hour() === 6 && bedtimeEnd.minute() <= 15)) {
      return true
    }
    return false
  }

  async findGoogleCalendarEventByURL(url: any) {
    try {
      const queryFilterSelectFilterTypeBased = {
        property: 'URL',
        text: {
          contains: url,
        },
      }
      const matchingSelectResults = await this.notion.databases.query({
        database_id: constants.NOTION_TASKS_DB_ID,
        filter: queryFilterSelectFilterTypeBased,
      })
      return matchingSelectResults.results[0] || undefined
    } catch (error) {
      console.log('error', `[findGoogleCalendarEventByURL]: ${error}`)
    }
  }

  async findHighlightById(highlightId: any) {
    try {
      const queryFilterSelectFilterTypeBased = {
        property: 'Rescue Time ID',
        number: {
          equals: highlightId,
        },
      }
      const matchingSelectResults = await this.notion.databases.query({
        database_id: constants.NOTION_RESCUE_TIME_HIGHLIGHTS_DB_ID,
        filter: queryFilterSelectFilterTypeBased,
      })
      return matchingSelectResults.results[0] || undefined
    } catch (err) {
      console.log('error', `[findHighlightById]: ${err}`)
    }
  }

  convertRescueTimeHighlightToNotionPage(highlight: any) {
    const parent = {
      database_id: constants.NOTION_RESCUE_TIME_HIGHLIGHTS_DB_ID,
    }
    const properties = {
      Description: {
        title: [
          {
            text: {
              content: highlight.description,
            },
          },
        ],
      },
      'Rescue Time ID': {
        number: highlight.id,
      },
      Date: {
        date: {
          start: highlight.created_at,
        },
      },
    }
    const page = {
      parent: parent,
      properties: properties,
    }
    console.log('info', 'successfully converted highlight to Notion page')
    return page
  }

  convertCalendarEventToNotionPage(event: any) {
    const startTime = event.start.dateTime
    const endTime = event.end.dateTime
    const parent = {
      database_id: constants.NOTION_TASKS_DB_ID,
    }
    const properties = {
      'Action Item': {
        title: [
          {
            text: {
              content: event.summary,
            },
          },
        ],
      },
      Priority: {
        select: {
          name: 'Scheduled 🗓',
        },
      },
      Status: {
        select: {
          name: 'Active',
        },
      },
      'Do Date': {
        date: {
          start: startTime,
          end: endTime,
        },
      },
      URL: {
        url: event.htmlLink,
      },
    }
    const page = {
      parent: parent,
      properties: properties,
    }
    console.log('info', 'successfully converted highlight to Notion page')
    return page
  }

  async addPageInDatabase(page: any) {
    try {
      console.log('info', 'creating page in notion...')
      const response = await this.notion.pages.create(page)
      console.log('info', 'created page in notion successfully')
      if (!response) {
        throw new NotionAPIError(
          'issue with creating page in the Notion database'
        )
      }
    } catch (e) {
      console.log(
        'error',
        'NotionAPI [addPageInDatabase] error attempting to add to notion database this page: ' +
          page
      )
    }
  }
}

export default NotionAPI
