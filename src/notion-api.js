import { Client } from '@notionhq/client'
import * as dotenv from 'dotenv'
dotenv.config()

class NotionAPIError extends Error {}

export class NotionAPI {
  constructor() {
    this.client = new Client({ auth: process.env.NOTION_KEY })
    this.NOTION_RESCUE_TIME_DB_ID =
      process.env.NOTION_RESCUE_TIME_HIGHLIGHTS_DB_ID
    console.log('client is ', this.client)
    console.log('DB ID is ', this.NOTION_RESCUE_TIME_DB_ID)
  }

  async retrieveDatabase(databaseId) {
    const response = await this.client.databases.retrieve({
      database_id: databaseId,
    })
    return response.data
  }

  // async createNotionHighlightFromRescueTimeHighlight(highlight) {}

  async createPageInDatabase(databaseId, pageProperties, children) {
    const parent = {
      database_id: databaseId,
    }

    const properties = {
      Description: {
        title: [
          {
            text: {
              content: 'RescueTime Highlights',
            },
          },
        ],
      },
    }

    const page = {
      parent: parent,
      properties: properties,
    }

    const response = await this.client.pages.create(page)
    console.log(response)
  }
}

// function getHighlightsFromNotion() {
//   throw new NotionAPIError('not implemented')
// }

// ;(async () => {})(createPageInDatabase(NOTION_RESCUE_TIME_DB_ID))

export default NotionAPI
