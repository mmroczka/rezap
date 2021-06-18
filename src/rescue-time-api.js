class RescueTimeAPIError extends Error {}

export class RescueTimeAPI {
  constructor() {}

  async convertRescueTimeHighlightToNotionPage(databaseId, highlight) {
    const parent = {
      database_id: databaseId,
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
    }

    const page = {
      parent: parent,
      properties: properties,
    }

    return page
    // const response = await notion.pages.create(page)
  }
}

// function getHighlightsFromNotion() {
//   throw new NotionAPIError('not implemented')
// }

// ;(async () => {})(createPageInDatabase(NOTION_RESCUE_TIME_DB_ID))

export default RescueTimeAPI
