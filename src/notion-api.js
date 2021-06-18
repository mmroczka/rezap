import { Client } from '@notionhq/client'
import logger from 'simple-node-logger'
import * as dotenv from 'dotenv'
dotenv.config()

class NotionAPIError extends Error {}

export class NotionAPI {
  constructor() {
    this.client = new Client({ auth: process.env.NOTION_KEY })
    this.NOTION_RESCUE_TIME_DB_ID =
      process.env.NOTION_RESCUE_TIME_HIGHLIGHTS_DB_ID
    this.logger = logger.createSimpleLogger('logs/notion-api.log')
    this.logger.log('info', 'starting logger')
  }

  async retrieveDatabase(databaseId) {
    try {
      const response = await this.client.databases.retrieve({
        database_id: databaseId,
      })
    } catch (e) {
      this.logger.log('error', e)
      throw new NotionAPIError()
    }
    return response
  }

  // async createNotionHighlightFromRescueTimeHighlight(highlight) {}
  createNotionPageWithHighlight(highlight) {
    const parent = {
      database_id: this.NOTION_RESCUE_TIME_DB_ID,
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
    return page
  }

  async createPageInDatabase(page) {
    const response = await this.client.pages.create(page)
    console.log(response)
  }
}

// function getHighlightsFromNotion() {
//   throw new NotionAPIError('not implemented')
// }

// ;(async () => {})(createPageInDatabase(NOTION_RESCUE_TIME_DB_ID))

export default NotionAPI
