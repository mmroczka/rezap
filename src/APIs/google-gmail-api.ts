import * as dotenv from 'dotenv'
import { Logger } from '../utils/Logger'
import { google } from 'googleapis'
// import { RezapCalendarTask } from '../Models/rezapItem'
import * as dayjs from 'dayjs'
dotenv.config()

const nodemailer = require('nodemailer')

  // process.env.GMAIL_REFRESH_TOKEN
const oAuth2Client = new google.auth.OAuth2(
  process.env.GMAIL_CLIENT_ID,
  process.env.GMAIL_CLIENT_SECRET,
  process.env.GMAIL_REDIRECT_URI,
)
oAuth2Client.setCredentials({
  refresh_token: process.env.GMAIL_REFRESH_TOKEN,
})
google.options({
  auth: oAuth2Client,
})

class GoogleGmailAPIError extends Error {}

export class GoogleGmailAPI {
  protected logger
  protected google = google

  constructor(public jobName: string = 'No Job Name') {
    this.logger = new Logger(
      './src/logs/google-calendar-api.log',
      '[GOOGLE CAL API]',
      jobName
    )
  }

  async getDedicatedCoachingEmails(){
      try{
        let dedicatedCoachingEmails = []
        const gmail = google.gmail({ version: 'v1'})
        const messages = await gmail.users.messages.list({userId: "me", maxResults: 10})
        if (!messages || !messages?.data || !messages?.data?.messages) return []

        for (const message of messages?.data?.messages) {
          const response = await gmail.users.messages.get({userId: "me", id: message.id})
          if (!response?.data?.payload?.headers) return []
          for (const header of response?.data?.payload?.headers){
              if (header.name == 'From' && header.value?.includes('dedicatedcoaching')) {
                  dedicatedCoachingEmails.push(message.id)
              }
          }
        }
        return dedicatedCoachingEmails
      } catch(e){
          this.logger.log(`error: ${e}`)
      }
  }  
}