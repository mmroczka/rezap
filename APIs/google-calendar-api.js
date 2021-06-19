import * as dotenv from 'dotenv'
import google_log from 'simple-node-logger'
import { google } from 'googleapis'
import logger from 'simple-node-logger'
import dayjs from 'dayjs'
dotenv.config()

const oAuth2Client = new google.auth.OAuth2(
  process.env.GCAL_CLIENT_ID,
  process.env.GCAL_CLIENT_SECRET,
  process.env.GCAL_REDIRECT_URI
)
oAuth2Client.setCredentials({
  refresh_token: process.env.GCAL_REFRESH_TOKEN,
})
google.options({
  auth: oAuth2Client,
})

class GoogleCalendarAPIError extends Error {}

export class GoogleCalendarAPI {
  constructor(args) {
    this.jobName = args.jobName
    this.logger = logger.createSimpleLogger('logs/google-calendar-api.log')
    this.logger.log('info', `${args.jobName}: starting Google Calendar logger`)
  }

  shouldWeSyncEvent(event) {
    if (event.summary.startsWith('.')) {
      return false
    } else {
      return true
    }
  }

  async getTodaysFilteredCalendarEvents() {
    // Filters out events that start with a dot on the calendar -> ".downtime blocker"
    try {
      // get the access token
      const accessToken = await oAuth2Client.getAccessToken()

      const calendar = google.calendar({ version: 'v3', oAuth2Client })
      const dayStart = dayjs().startOf('day').toISOString()
      const dayEnd = dayjs().endOf('day').toISOString()
      const response = await calendar.events.list({
        calendarId: 'primary',
        timeMin: dayStart,
        timeMax: dayEnd,
        maxResults: 15, // if I have more than 15 events that I need to get then something is wrong :/
        singleEvents: true,
        orderBy: 'startTime',
      })
      const events = response.data.items
      let filteredEvents = events.filter((e) => this.shouldWeSyncEvent(e))
      return filteredEvents
    } catch (error) {
      this.logger.log(
        'error',
        `${this.jobName} GoogleCalendarAPI [getTodaysCalendarEvents] error: ` +
          error
      )
      return []
    }
  }
}

export default GoogleCalendarAPI
