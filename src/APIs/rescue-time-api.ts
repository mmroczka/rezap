import axios from 'axios'
import logger from 'simple-node-logger'
import * as dotenv from 'dotenv'
dotenv.config()

class RescueTimeAPIError extends Error {}

export class RescueTimeAPI {
  protected logger = logger.createSimpleLogger('logs/rescue-time-api.log')
  protected RESCUE_TIME_BASE_URL = 'https://www.rescuetime.com/anapi'
  protected RESCUE_TIME_HIGHLIGHTS_URL = '/highlights_feed'

  constructor(public jobName: string = 'No Job Name') {
    this.logger.log('info', `${jobName}: starting Notion logger`)
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
