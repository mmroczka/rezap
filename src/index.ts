import Bree from 'bree'
import * as dayjs from 'dayjs'
import customParseFormat from 'dayjs/plugin/customParseFormat'
dayjs.extend(customParseFormat)

import * as dotenv from 'dotenv'
import { GoogleGmailAPI } from './APIs/google-gmail-api'
import { TwilioAPI } from './APIs/twilio-api.js'
import { Logger } from './utils/Logger'
import { RezapEmail } from './Models/rezapEmail'
import { connect, connection } from 'mongoose'
dotenv.config()
const jobName: string = '[[Text Me When I Get An Important Email]]'

const bree = new Bree({
  logger: console,
  root: false,
  jobs: [
    {
      path: './dist/jobs/textMeWhenIGetAnImportantEmail.js',
      name: 'textMeWhenIGetAnImportantEmail',
	  cron: '*/1 07-22 * * *'
    },
    {
      path: './dist/jobs/addCurrentDayToNotionDayDB.js',
      name: 'addCurrentDayToNotionDayDB',
      interval: '1h',
    },
    {
      path: './dist/jobs/syncGoogleCalendarAndNotionScheduledTasks.js',
      name: 'syncGoogleCalendarAndNotionScheduledTasks',
      interval: '3m',
    },
    {
      path: './dist/jobs/importOuraSleepDataIntoNotion.js',
      name: 'importOuraSleepDataIntoNotion',
      interval: '1h',
    },
  ],
})

bree.start()
