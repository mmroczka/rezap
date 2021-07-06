import { Client } from '@notionhq/client'
import logger from 'simple-node-logger'
import constants from '../constants.config'
import { connect, connection, model } from 'mongoose'
import { NotionTask } from '../Models/notionTask'

class NotionAPIError extends Error {}

export class NotionAPI {
  protected notion;

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
