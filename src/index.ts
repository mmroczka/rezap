import { Logger } from './utils/Logger'
import * as path from 'path'
import * as fs from 'fs'
import Bree from 'bree'
import { connect, connection } from 'mongoose'
import { RezapCalendarTask } from './Models/rezapItem'
import { GoogleCalendarAPI } from './APIs/google-calendar-api.js'
import { NotionAPI } from './APIs/notion-api.js'
import { OuraAPI } from './APIs/oura-api.js'
import axios from 'axios'
import constantsConfig from './constants.config'
import * as dayjs from 'dayjs'
import customParseFormat from 'dayjs/plugin/customParseFormat'
dayjs.extend(customParseFormat)

// main()

const bree = new Bree({
  logger: console,
  root: false,
  jobs: [
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
