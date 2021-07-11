import { Client } from '@notionhq/client'
import { Logger } from '../utils/Logger'
import constants from '../constants.config'
import { connect, connection, model } from 'mongoose'
import * as dayjs from 'dayjs'

class NotionAPIError extends Error {}

export class NotionAPI {
  protected notion
  protected logger

  constructor(public jobName: string = 'No Job Name') {
    this.logger = new Logger(
      './src/logs/notion-api.log',
      '[NOTION API]',
      jobName
    )
    this.notion = new Client({ auth: constants.NOTION_KEY })
    this.logger.log(`starting Notion logger`)
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
      this.logger.log('NotionAPI [retrieveDatabase] ' + e)
    }
  }

  convertTasksToModels(notionTasks: any) {
    connect('mongodb://mongodb:27017/test', { useNewUrlParser: true })
    const db = connection
    db.on('error', console.error.bind(console, 'CONNECTION ERROR'))

    let taskList: any = []
    // db.once('open', function () {
    //   this.logger.log('Connection Successful!')

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
    //       this.logger.log(event.summary + ' saved to bookstore collection.')
    //       this.logger.log(event)
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
      this.logger.log(`error: [findNotionScheduledEvents]: ${error}`)
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
      this.logger.log(`error: [findGoogleCalendarEventByURL]: ${error}`)
    }
  }

  async getAllMatchingPagesById(notionIds: any[]) {
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
      let filteredPagesById: any[] = []
      if (matchingSelectResults) {
        filteredPagesById = matchingSelectResults?.results?.filter(
          (page) => page?.id && notionIds?.includes(page.id)
        )
      }
      return filteredPagesById
    } catch (err) {
      this.logger.log(`error: [getAllMatchingPagesById]: ${err}`)
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
      this.logger.log(`error: [findHighlightById]: ${err}`)
    }
  }

  async findNotionDayPageForToday() {
    try {
      const queryFilterSelectFilterTypeBased = {
        property: 'Date',
        date: {
          equals: dayjs.default().toISOString(),
        },
      }
      const matchingSelectResults = await this.notion.databases.query({
        database_id: constants.NOTION_DAY_DB_ID,
        filter: queryFilterSelectFilterTypeBased,
      })
      return matchingSelectResults?.results[0] || undefined
    } catch (err) {
      this.logger.log(`error: [findNotionDayPageForToday]: ${err}`)
    }
  }

  convertCurrentDateToNotionDayPage() {
    const parent = {
      database_id: constants.NOTION_DAY_DB_ID,
    }
    const properties = {
      'Current Day': {
        title: [
          {
            text: {
              content: dayjs.default().format('MMMM D, YYYY'),
            },
          },
        ],
      },
      Date: {
        date: {
          start: dayjs.default().toISOString(),
        },
      },
    }
    const page = {
      parent: parent,
      properties: properties,
    }
    this.logger.log('info: successfully converted current date to Notion page')
    return page
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
    this.logger.log('info: successfully converted highlight to Notion page')
    return page
  }

  convertCalendarEventToNotionPage(event: any, isRealData = false) {
    const startTime = dayjs.default(event.start.dateTime).format()
    const endTime = dayjs.default(event.end.dateTime).format()
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
    this.logger.log(
      'info: successfully converted calendar event to Notion page'
    )
    return page
  }

  async addPageInDatabase(page: any) {
    try {
      this.logger.log('info: creating page in notion...')
      const response = await this.notion.pages.create(page)
      this.logger.log('info: created page in notion successfully')
      if (!response) {
        throw new NotionAPIError(
          'issue with creating page in the Notion database'
        )
      }
      return response
    } catch (e) {
      this.logger.log(
        `error: NotionAPI [addPageInDatabase] error attempting to add to notion database this page: ${JSON.stringify(
          page,
          null,
          2
        )}`
      )
    }
  }

  async patchNotionProperties(id: string, changes: any) {
    try {
      this.logger.log(
        `info: updating notion page with... ${JSON.stringify(changes, null, 2)}`
      )

      let patch: any = {
        'Action Item': {
          title: [
            {
              text: {
                content: changes.name,
              },
            },
          ],
        },
        'Do Date': {
          date: {
            start: changes.startTime,
            end: changes.endTime,
          },
        },
      }
      this.logger.log('info: updating notion with patch ----')
      this.logger.log(JSON.stringify(patch, null, 2))
      const response = await this.notion.pages.update({
        page_id: id,
        properties: patch,
      })
      this.logger.log('info: updated page in notion successfully')
      if (!response) {
        throw new NotionAPIError(
          'error: issue with updating page in the Notion database'
        )
      }
      return response
    } catch (e) {
      this.logger.log(
        'error: NotionAPI [patchPageName] error attempting to add to notion database this page'
      )
    }
  }
}

export type IPatchNotionPageParams = {
  'Action Item'?: {
    title: [
      {
        plain_text: string
      }
    ]
  }
  'Do Date'?: {
    type: string
    date: {
      start: string
      end?: string
    }
  }
}

export default NotionAPI
