import axios from 'axios'
import { Logger } from '../utils/Logger'
import * as dotenv from 'dotenv'
dotenv.config()

class OuraAPIError extends Error {}

export class OuraAPI {
  protected logger
  protected OURA_BASE_URL = 'https://api.ouraring.com/v1'
  protected OURA_SLEEP_URL = '/sleep'

  constructor(public jobName: string = 'No Job Name') {
    this.logger = new Logger(
      './src/logs/oura-api.log',
      '[OURA API]',
      jobName
    )
    this.logger.log(`Starting OuraAPI instance`)
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
      this.logger.log('OuraAPI [getCurrentDaysOuraStats]' + err)
      return []
    }
  }
}

export default OuraAPI
