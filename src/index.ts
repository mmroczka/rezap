import { Logger } from './utils/Logger'
import * as path from 'path'
import * as fs from 'fs'
import Bree from 'bree'
import { connect, connection } from 'mongoose'
import { RezapCalendarTask } from './Models/rezapItem'
import { GoogleCalendarAPI } from './APIs/google-calendar-api.js'
import { NotionAPI } from './APIs/notion-api.js'
import axios from 'axios'
import constantsConfig from './constants.config'
import * as dayjs from 'dayjs'
import customParseFormat from 'dayjs/plugin/customParseFormat'
dayjs.extend(customParseFormat)

const main = async () => {
  const infoResults = await axios.get('https://api.ouraring.com/v1/userinfo', {
    params: { access_token: constantsConfig.OURA_PERSONAL_ACCESS_TOKEN },
  })
  const CONVERT_KG_TO_LBS = 2.2
  const weightInPounds = infoResults?.data?.weight * CONVERT_KG_TO_LBS
  console.log('current weight is: ' + weightInPounds)

  const lastNightsSleep = await axios.get('https://api.ouraring.com/v1/sleep', {
    params: {
      access_token: constantsConfig.OURA_PERSONAL_ACCESS_TOKEN,
      start: '2021-07-09',
      end: '2021-07-10',
    },
  })
  console.log(lastNightsSleep.data)
}

main()

// const bree = new Bree({
//   logger: console,
//   root: false,
//   jobs: [
//     // runs `importHighlightsToNotion.js` every 15 minutes from 8pm-12am
//     {
//       path: './dist/jobs/importHighlightsToNotion.js',
//       name: 'importHighlightsToNotion',
//       cron: '*/15 20-23 * * *',
//     },
//     // runs `` every day at midnight
//     {
//       path: './dist/jobs/addCurrentDayToNotionDayDB.js',
//       name: 'addCurrentDayToNotionDayDB',
//       interval: 'at 12:00 am',
//     },
//     // runs syncGoogleCalendarAndNotionScheduledTasks on start and then every 1 minute
//     {
//       path: './dist/jobs/syncGoogleCalendarAndNotionScheduledTasks.js',
//       name: 'syncGoogleCalendarAndNotionScheduledTasks',
//       interval: '1m',
//     },
//   ],
// })

// bree.start()
