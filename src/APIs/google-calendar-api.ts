import { rezapSchema } from './../Models/rezapItem';
import * as dotenv from 'dotenv'
import google_log from 'simple-node-logger'
import { google } from 'googleapis'
// import logger from 'simple-node-logger'
import * as dayjs from 'dayjs'
import { CalendarEvent, calendarEventSchema } from '../Models/calendarEvent'
import { RezapCalendarTask } from '../Models/rezapItem'
import { connect, connection, model, Mongoose } from 'mongoose'
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

  convertEventToModel(event: any, notionTask: any) {
    console.log('received event: ', event)
    console.log('received task: ', notionTask)
    return new RezapCalendarTask({
      taskName: event.summary,
      googleCalID: event.id,
      notionTaskID: notionTask.id,
      lastRezapUpdate: new Date().toISOString(),
      status: notionTask.status,
      htmlLink: event.htmlLink,
      created: event.created,
      updated: event.updated,
      start: {
        dateTime: event.start.dateTime,
      },
      end: {
        dateTime: event.end.dateTime,
      },
      sequence: event.sequence,
      reminders: {
        useDefaults: event.reminders.useDefaults,
      },
    })
  }

  // convertEventsToModels(events: any) {
  //   connect('mongodb://mongodb:27017/test', { useNewUrlParser: true })
  //   console.log('======== TEST ========')
  //   const db = connection
  //   db.on('error', console.error.bind(console, 'CONNECTION ERROR'))

  //   let eventList: any = []
  //   db.once('open', function () {
  //     console.log('Connection Successful!')

  //     for (const e of events) {
  //       // a document instance
  //       // save model to database
  //       event.save((err: any, event: any) => {
  //         if (err) return console.error(err)
  //         console.log(event.summary + ' saved to bookstore collection.')
  //         console.log(event)
  //       })
  //       eventList.push(event)
  //     }
  //   })
  //   return eventList
  // }

  async getNextTwoWeeksOfFilteredEvents() {
    try {
      const calendar = google.calendar({ version: 'v3' })
      const dayStart = dayjs.default().startOf('day').toISOString()
      const fourteenDaysFromNow = dayjs
        .default()
        .add(14, 'days')
        .endOf('day')
        .toISOString()
      const response = await calendar.events.list({
        calendarId: 'primary',
        timeMin: dayStart,
        timeMax: fourteenDaysFromNow,
        maxResults: 200,
        singleEvents: true,
        orderBy: 'startTime',
      })
      const events = response.data.items
      let filteredEvents: any[] = []
      if (events) {
        filteredEvents = events.filter(
          (e) => e?.summary && !e.summary.startsWith('.')
        )
        // filteredEvents = filteredEvents?.map((event) =>
        //   this.convertEventToModel(event)
        // )
      }
      // const eventModelList = this.convertEventsToModels(events)
      return filteredEvents
    } catch (error) {
      console.log(
        `${this.jobName} GoogleCalendarAPI [getTodaysCalendarEvents] error: ` +
          error
      )
      return []
    }
  }

  async getEventChangesFromNow() {
    try {
      // const calendar = google.calendar({ version: 'v3', oAuth2Client })
      connect('mongodb://mongodb:27017/test', {
        useNewUrlParser: true,
        useUnifiedTopology: true,
      })
      console.log('Connected to Database!')
      const db = connection
      db.on('error', console.error.bind(console, 'CONNECTION ERROR'))
      const calendar = google.calendar({ version: 'v3' })
      const dayStart = dayjs.default().startOf('day').toISOString()
      const twentyDaysFromNow = dayjs
        .default()
        .add(20, 'days')
        .endOf('day')
        .toISOString()
      const response = await calendar.events.list({
        calendarId: 'primary',
        timeMin: dayStart,
        timeMax: twentyDaysFromNow,
        maxResults: 2,
        singleEvents: true,
        orderBy: 'startTime',
      })
      const events = response.data.items
      let filteredEvents: any[] = []
      if (events) {
        filteredEvents = events.filter(
          (e) => e?.summary && !e.summary.startsWith('.')
        )
        filteredEvents = filteredEvents?.map((event) =>
          this.convertEventToModel(event)
        )

        db.once('open', async function () {
          console.log('Connection Successful!')
        })

        const dbEvents: IGoogleCalendarEvent[] = await CalendarEvent.find()
        console.log('DB EVENTS', dbEvents)
        for (const event of filteredEvents) {
          // it's already in the DB
          const calendarEvent = dbEvents.find(
            (e) => e.id === '42aqqflvvs7gtkhltqimir91k4'
          )
          console.log('calendarEvent found? ', calendarEvent)
          if (calendarEvent) {
            // is the converted object different from the new object?
            console.log('found the event!')
          } else {
            // it isn't in the DB, so add it
            const eventAsModel = this.convertEventToModel(event)
            eventAsModel.save(function (err: any, event: any) {
              if (err) return console.error(err)
              console.log(
                event?.summary +
                  ' saved newly found CalendarEvent to collection.'
              )
            })
            console.log('event not found in the filteredEvents')
          }
        }
      }
      // const eventModelList = this.convertEventsToModels(events)
      return filteredEvents
    } catch (error) {
      console.log(
        `${this.jobName} GoogleCalendarAPI [getTodaysCalendarEvents] error: ` +
          error
      )
      return []
    }
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
      // const eventModelList = this.convertEventToModel(events)
      // return eventModelList
      return filteredEvents
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
