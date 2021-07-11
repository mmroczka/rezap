import axios from 'axios'
import { Logger } from '../utils/Logger'
import * as dotenv from 'dotenv'
dotenv.config()

class RescueTimeAPIError extends Error {}

export class RescueTimeAPI {
  protected logger
  protected RESCUE_TIME_BASE_URL = 'https://www.rescuetime.com/anapi'
  protected RESCUE_TIME_HIGHLIGHTS_URL = '/highlights_feed'

  constructor(public jobName: string = 'No Job Name') {
    this.logger = new Logger(
      './src/logs/notion-api.log',
      '[NOTION API]',
      jobName
    )
    this.logger.log(`info: ${jobName}: starting Rescue Time logger`)
  }

  async getRescueTimeHighlights() {
    try {
      const resp = await axios.get(
        this.RESCUE_TIME_BASE_URL + this.RESCUE_TIME_HIGHLIGHTS_URL,
        {
          params: {
            key: process?.env?.RESCUE_TIME_TOKEN,
          },
        }
      )
      if (resp.status !== 200) {
        throw new RescueTimeAPIError('error fetching highlights')
      }
      return resp.data
    } catch (err) {
      this.logger.log(
        `error: RescueTimeAPI [getRescueTimeHighlights] ${JSON.stringify(
          err,
          null,
          2
        )}`
      )
      return []
    }
  }
}

export default RescueTimeAPI
