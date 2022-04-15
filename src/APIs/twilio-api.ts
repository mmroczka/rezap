import * as dotenv from 'dotenv'
import { Logger } from '../utils/Logger'
import constants from '../constants.config'
import { connect, connection, model } from 'mongoose'
import * as dayjs from 'dayjs'
dotenv.config()

// dashboard: https://console.twilio.com/

const twilio = require('twilio')(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);

class TwilioAPIError extends Error {}

export class TwilioAPI {
  protected twilio
  protected logger

  constructor(public jobName: string = 'No Job Name') {
    this.logger = new Logger(
      './src/logs/twilio-api.log',
      '[TWILIO API]',
      jobName
    )
    this.logger.log(`Starting Twilio logger`)
    this.twilio = twilio
  }


  async sendTextMessage(message: string, to: string) {
      try{
        const result = await twilio.messages
        .create({
            body: message,
            to: to,
            from: '+19124914714'
        })
        .then((message: any) => console.log(message.sid));
        return result
      } catch(e) {

      }
  }

  async callMe() {
      try{

		twilio.calls
		  .create({
			 url: 'http://demo.twilio.com/docs/voice.xml',
			 to: '+18722278274',
             from: '+19124914714'
		   })
		  .then((call: any) => console.log(call.sid));

      } catch(e) {

      }
  }


}
