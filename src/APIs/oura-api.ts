import axios from 'axios'
import logger from 'simple-node-logger'
import * as dotenv from 'dotenv'
dotenv.config()

class OuraAPIError extends Error {}

export class OuraAPI {
  protected logger = logger.createSimpleLogger('logs/oura-api.log')
  protected OURA_BASE_URL = 'https://api.ouraring.com/v1'
  protected OURA_SLEEP_URL = '/sleep'

  constructor(public jobName: string = 'No Job Name') {
    this.logger.log('info', `${jobName}: starting Oura logger`)
  }

  async getWeeklyOuraStats() {
    try {
      const resp = await axios.get(
        this.OURA_BASE_URL + this.OURA_SLEEP_URL,
        {
          params: {
            access_token: process?.env?.OURA_API_TOKEN,
          },
        }
      )
      if (resp.status !== 200) {
        throw new OuraAPIError('error fetching Oura data')
      }
      return resp.data.sleep
    } catch (err) {
      this.logger.log('error', 'OuraAPI [getCurrentDaysOuraStats]' + err)
      return []
    }
  }
}

export default OuraAPI 
