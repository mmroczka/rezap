import * as dotenv from 'dotenv'
import { NotionAPI } from '../APIs/notion-api.js'
import { RescueTimeAPI } from '../APIs/rescue-time-api.js'
import { Logger } from '../utils/Logger'
dotenv.config()
const jobName: string = '[[Import Highlights Into Notion]]'

const main = async () => {
  const notionAPI = new NotionAPI(jobName)
  const rescueTimeAPI = new RescueTimeAPI(jobName)
  // job_logger.log('info', 'Starting rescuetime highlights request')
  const highlights = await rescueTimeAPI.getRescueTimeHighlights()
  for (const highlight of highlights) {
    const oldHighlight = await notionAPI.findHighlightById(highlight.id)
    if (oldHighlight === undefined) {
      // job_logger.log('info: highlight is new!')
      const page = notionAPI.convertRescueTimeHighlightToNotionPage(highlight)
      await notionAPI.addPageInDatabase(page)
    } else {
      // job_logger.log('info: highlight already exists!')
    }
  }
}

main()
