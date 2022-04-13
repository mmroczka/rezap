import * as dotenv from 'dotenv'
import { Logger } from '../utils/Logger'
import { google } from 'googleapis'
import { RezapCalendarTask } from '../Models/rezapItem'
import * as dayjs from 'dayjs'
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
  protected logger
  protected google = google

  constructor(public jobName: string = 'No Job Name') {
    this.logger = new Logger(
      './src/logs/google-calendar-api.log',
      '[GOOGLE CAL API]',
      jobName
    )
  }

  shouldWeSyncEvent(event: any) {
    if (event.summary.startsWith('.')) {
      return false
    } else {
      return true
    }
  }

  convertNotionTaskToCalendarEvent(task: any) {
    const taskName = task?.properties['Action Item']?.title[0]?.plain_text // title doesn't exist
    const taskStartTime = task.properties['Do Date']?.date?.start
    const taskEndTime = task.properties['Do Date']?.date?.end


    let calendarStartTime;
    let calendarEndTime;
	if (!taskStartTime) {
		// if there is no start time set then there is no end time either (can't do that in notion)
		// so default the task to 9am for 30 minutes in length (notice it says 8 in the hour section because it defaults from 0-23)
		calendarStartTime = dayjs.default().hour(8).minute(0)
		calendarEndTime = calendarStartTime.hour(8).add(30, 'minute')
	} else{
		calendarStartTime = dayjs.default(taskStartTime)
		// default endTime to 30 minutes after start time if end time is not provided
		if (taskEndTime) {
		  calendarEndTime = dayjs.default(taskEndTime)
		} else {
			calendarEndTime = dayjs.default(taskStartTime).add(30, 'minute')
		}
	}

    if (!taskName) {
      throw Error('Error: Notion Page is missing Action Item or a Start Time!')
    }

    return {
      summary: taskName,
      start: {
        dateTime: calendarStartTime,
      },
      end: {
        dateTime: calendarEndTime,
      },
    }
  }

  async addTaskToGoogleCalendar(task: any) {
    try {
      this.logger.log(
        `adding task to google calendar: ${JSON.stringify(task, null, 2)}`
      )
      const calendar = google.calendar({ version: 'v3' })
      const response = await calendar.events.insert({
        calendarId: 'primary',
        resource: task,
      })
      if (!response) {
        return null
      }
      return response.data
    } catch (e) {
      this.logger.log(`error: ${e}`)
    }
  }

  convertEventToModel(calendarTask: any, notionTask: any) {
    return new RezapCalendarTask({
      taskName: calendarTask.summary,
      googleCalID: calendarTask.id,
      notionPageID: notionTask.id,
      lastRezapUpdate: dayjs.default().format(),
      priority:
        notionTask?.properties['Priority']?.select['name'] ?? 'Scheduled 🗓',
      status: notionTask?.properties['Status']?.select['name'] ?? 'Active',
      done: notionTask?.properties['Done']?.checkbox ?? false,
      url: calendarTask.htmlLink,
      start: {
        startTime: calendarTask.start.dateTime,
        endTime: calendarTask.end.dateTime,
      },
    })
  }

  async getAllMatchingEventsById(gCalIds: any[]) {
    try {
      const calendar = google.calendar({ version: 'v3' })
      const twoWeeksAgo = dayjs
        .default()
        .subtract(14, 'days')
        .startOf('day')
        .toISOString()
      const threeWeeksFromNow = dayjs
        .default()
        .add(21, 'days')
        .endOf('day')
        .toISOString()
      const response = await calendar.events.list({
        calendarId: 'primary',
        timeMin: twoWeeksAgo,
        timeMax: threeWeeksFromNow,
        maxResults: 200,
        singleEvents: true,
        orderBy: 'startTime',
      })
      const events = response.data.items
      let filteredEvents: any[] = []
      if (events) {
        filteredEvents = events.filter((e) => e?.id && gCalIds.includes(e.id))
      }
      return filteredEvents
    } catch (error) {
      this.logger.log(
        `error: ${
          this.jobName
        } GoogleCalendarAPI [getAllMatchingEventsById] error: ${JSON.stringify(
          error,
          null,
          2
        )}`
      )
      return []
    }
  }

  async getNextTwoWeeksOfFilteredEvents() {
    try {
      const calendar = google.calendar({ version: 'v3' })
      const twoWeeksAgo = dayjs
        .default()
        .subtract(14, 'days')
        .startOf('day')
        .toISOString()
      const fourteenDaysFromNow = dayjs
        .default()
        .add(14, 'days')
        .endOf('day')
        .toISOString()
      const response = await calendar.events.list({
        calendarId: 'primary',
        timeMin: twoWeeksAgo,
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
      }
      // const eventModelList = this.convertEventsToModels(events)
      return filteredEvents
    } catch (error) {
      this.logger.log(
        `error: ${
          this.jobName
        } GoogleCalendarAPI [getTodaysCalendarEvents] error: ${JSON.stringify(
          error,
          null,
          2
        )}`
      )
      return []
    }
  }

  async patchCalendarProperties(id: string, changes: any) {
    try {
      let patch: any = {
        calendarId: 'primary',
        eventId: id,
        resource: {
          summary: changes.name,
          start: {
            dateTime: changes.startTime,
          },
          end: {
            dateTime: changes.endTime,
          },
        },
      }

      this.logger.log(
        `\tinfo: updating calendar changes with the following patch:\n ${JSON.stringify(
          changes,
          null,
          2
        )} `
      )
      const calendar = google.calendar({ version: 'v3' })
      const response = await calendar.events.update(patch)
      return response.data
    } catch (error) {
      this.logger.log(
        `error: ${
          this.jobName
        } GoogleCalendarAPI [patchCalendarProperties] error: ${JSON.stringify(
          error,
          null,
          2
        )}`
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
      return filteredEvents
    } catch (error) {
      this.logger.log(
        `error: ${this.jobName} GoogleCalendarAPI [getTodaysCalendarEvents] error: ` +
          JSON.stringify(error, null, 2)
      )
      return []
    }
  }
}

export default GoogleCalendarAPI
