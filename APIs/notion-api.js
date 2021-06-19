import { Client } from '@notionhq/client'
import logger from 'simple-node-logger'
import * as dotenv from 'dotenv'
dotenv.config()

class NotionAPIError extends Error {}
const NOTION_RESCUE_TIME_DB_ID = process.env.NOTION_RESCUE_TIME_HIGHLIGHTS_DB_ID
const NOTION_TASKS_DB_ID = process.env.NOTION_TASKS_DB_ID

export class NotionAPI {
  constructor(args) {
    this.notion = new Client({ auth: process.env.NOTION_KEY })
    this.logger = logger.createSimpleLogger('logs/notion-api.log')
    this.logger.log('info', `${args.jobName}: starting Notion logger`)
  }

  async retrieveDatabase(databaseId) {
    try {
      const response = await this.notion.databases.retrieve({
        database_id: databaseId,
      })
      if (!response) {
        throw new NotionAPIError('issue retrieving database from Notion')
      }
      return response
    } catch (e) {
      this.logger.log('error', 'NotionAPI [retrieveDatabase] ' + e)
    }
  }

  async findGoogleCalendarEventByURL(url) {
    try {
      const queryFilterSelectFilterTypeBased = {
        property: 'URL',
        text: {
          contains: url,
        },
      }
      const matchingSelectResults = await this.notion.databases.query({
        database_id: NOTION_TASKS_DB_ID,
        filter: queryFilterSelectFilterTypeBased,
      })
      return matchingSelectResults.results[0] || undefined
    } catch (error) {}
    this.logger.log('error', `[findGoogleCalendarEventByURL]: ${err}`)
  }

  async findHighlightById(highlightId) {
    try {
      const queryFilterSelectFilterTypeBased = {
        property: 'Rescue Time ID',
        number: {
          equals: highlightId,
        },
      }
      const matchingSelectResults = await this.notion.databases.query({
        database_id: NOTION_RESCUE_TIME_DB_ID,
        filter: queryFilterSelectFilterTypeBased,
      })
      return matchingSelectResults.results[0] || undefined
    } catch (err) {
      this.logger.log('error', `[findHighlightById]: ${err}`)
    }
  }

  convertRescueTimeHighlightToNotionPage(highlight) {
    const parent = {
      database_id: NOTION_RESCUE_TIME_DB_ID,
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
    this.logger.log('info', 'successfully converted highlight to Notion page')
    return page
  }

  convertCalendarEventToNotionPage(event) {
    const startTime = event.start.dateTime
    const endTime = event.end.dateTime
    const parent = {
      database_id: NOTION_TASKS_DB_ID,
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
    this.logger.log('info', 'successfully converted highlight to Notion page')
    return page
  }

  async createPageInDatabase(page) {
    try {
      this.logger.log('info', 'creating page in notion...')
      const response = await this.notion.pages.create(page)
      this.logger.log('info', 'created page in notion successfully')
      if (!response) {
        throw new NotionAPIError(
          'issue with creating page in the Notion database'
        )
      }
    } catch (e) {
      this.logger.log(
        'error',
        'NotionAPI [createPageInDatabase] error attempting to add to notion database this page: ' +
          page
      )
    }
  }
}

export default NotionAPI
