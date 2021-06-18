import axios from 'axios'
import logger from 'simple-node-logger'
import * as dotenv from 'dotenv'
dotenv.config()

class RescueTimeAPIError extends Error {}

export class RescueTimeAPI {
  constructor() {
    this.RESCUE_TIME_BASE_URL = 'https://www.rescuetime.com/anapi'
    this.RESCUE_TIME_HIGHLIGHTS_URL = '/highlights_feed'
    this.logger = logger.createSimpleLogger('logs/rescue-time-api.log')
    this.logger.log('info', 'starting rescue time logger')
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
      this.logger.log('error', 'RescueTimeAPI [getRescueTimeHighlights]' + err)
      return []
    }
  }
}

export default RescueTimeAPI
