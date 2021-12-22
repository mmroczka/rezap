import * as dotenv from 'dotenv'
import { NotionAPI } from '../APIs/notion-api.js'
import { OuraAPI } from '../APIs/oura-api.js'
import logger from 'simple-node-logger'
dotenv.config()
const jobName: string = '[[Import Oura Sleep Data Into Notion]]'

const main = async () => {
  const ouraAPI = new OuraAPI(jobName)
  const notionAPI = new NotionAPI(jobName)
  
  const job_logger = logger.createSimpleLogger(
    'logs/importOuraSleepDataIntoNotion.log'
    )
    
  const weeklySleepStats = await ouraAPI.getWeeklyOuraStats()
  job_logger.log('info', 'Starting oura sleep data request')

  for (const sleepStat of weeklySleepStats) {
    job_logger.log('info', "Logging sleep data from Oura for day " + sleepStat.summary_date)
    const notionPageForDay = await notionAPI.findDayPageByDate(sleepStat.summary_date)
    if (notionPageForDay !== undefined){
      // we found the page in notion so update it with the sleep stats
      job_logger.log('info', 'Page found in Notion. Initiating sleep data updates')
      notionAPI.updateDaysSleepStats(notionPageForDay.id, sleepStat)
    }
  }

}

main()
