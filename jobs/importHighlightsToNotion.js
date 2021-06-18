import * as dotenv from 'dotenv'
import { NotionAPI } from '../APIs/notion-api.js'
import { RescueTimeAPI } from '../APIs/rescue-time-api.js'
import logger from 'simple-node-logger'
dotenv.config()

const notionAPI = new NotionAPI()
const rescueTimeAPI = new RescueTimeAPI()
const job_logger = logger.createSimpleLogger(
  'logs/importHighlightsToNotion.log'
)

job_logger.log('info', 'Starting rescuetime highlights request')
const highlights = await rescueTimeAPI.getRescueTimeHighlights()
for (const highlight of highlights) {
  const oldHighlight = await notionAPI.findHighlightById(highlight.id)
  if (oldHighlight === undefined) {
    job_logger.log('info', 'highlight is new!')
    const page = notionAPI.convertRescueTimeHighlightToNotionPage(highlight)
    await notionAPI.createPageInDatabase(page)
  } else {
    job_logger.log('info', 'highlight already exists!')
  }
}
