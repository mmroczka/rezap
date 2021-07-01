import * as dotenv from 'dotenv'
import google_log from 'simple-node-logger'
import { google } from 'googleapis'
// import logger from 'simple-node-logger'
import * as dayjs from 'dayjs'
import { CalendarEvent, calendarEventSchema } from '../Models/calendarEvent'
import { connect, connection, model } from 'mongoose'
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
  // protected logger
  protected google = google

  constructor(public jobName: string = 'No Job Name') {
    // console.log(this)
    // const logger = logger.createSimpleLogger('logs/google-calendar-api.log')
    console.log('info', `${jobName}: starting Google Calendar logger`)
  }

  shouldWeSyncEvent(event: any) {
    if (event.summary.startsWith('.')) {
      return false
    } else {
      return true
    }
  }

  convertEventsToModels(events: any) {
    connect('mongodb://mongodb:27017/test', { useNewUrlParser: true })
    console.log('======== TEST ========')
    const db = connection
    db.on('error', console.error.bind(console, 'CONNECTION ERROR'))

    let eventList: any = []
    db.once('open', function () {
      console.log('Connection Successful!')

      for (const e of events) {
        // a document instance
        const event = new CalendarEvent({
          id: e.id,
          status: e.status,
          htmlLink: e.htmlLink,
          created: e.created,
          updated: e.updated,
          summary: e.summary,
          start: {
            dateTime: e.start.dateTime,
          },
          end: {
            dateTime: e.end.dateTime,
          },
          sequence: e.sequence,
          reminders: {
            useDefaults: e.reminders.useDefaults,
          },
        })

        // save model to database
        event.save((err: any, event: any) => {
          if (err) return console.error(err)
          console.log(event.summary + ' saved to bookstore collection.')
          console.log(event)
        })
        eventList.push(event)
      }
    })
    return eventList
  }

  async getTodaysFilteredCalendarEvents() {
    // Filters out events that start with a dot on the calendar -> ".downtime blocker"
    try {
      // get the access token
      const accessToken = await oAuth2Client.getAccessToken()

      // const calendar = google.calendar({ version: 'v3', oAuth2Client })
      const calendar = google.calendar({ version: 'v3' })
      const dayStart = dayjs.default().startOf('day').toISOString()
      const dayEnd = dayjs.default().endOf('day').toISOString()
      const response = await calendar.events.list({
        calendarId: 'primary',
        timeMin: dayStart,
        timeMax: dayEnd,
        maxResults: 15, // if I have more than 15 events that I need to get then something is wrong :/
        singleEvents: true,
        orderBy: 'startTime',
      })
      const events = response.data.items
      let filteredEvents: any[] = []
      if (events) {
        filteredEvents = events.filter((e) => this.shouldWeSyncEvent(e))
      }
      const eventModelList = this.convertEventsToModels(events)
      return eventModelList
    } catch (error) {
      console.log(
        `${this.jobName} GoogleCalendarAPI [getTodaysCalendarEvents] error: ` +
          error
      )
      return []
    }
  }
}

export default GoogleCalendarAPI
