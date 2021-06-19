import * as dotenv from 'dotenv'
import main_log from 'simple-node-logger'
import dayjs from 'dayjs'
dotenv.config()
const JOB_NAME = 'importNewCalendarEventsIntoNotion'

import { GoogleCalendarAPI } from '../APIs/google-calendar-api.js'

const calendar = new GoogleCalendarAPI(JOB_NAME)

const events = await calendar.getTodaysCalendarEvents()

// for (let i = 0; i < events.length; i++)
