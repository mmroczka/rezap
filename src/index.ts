import Bree from 'bree'
import * as dayjs from 'dayjs'
import customParseFormat from 'dayjs/plugin/customParseFormat'
dayjs.extend(customParseFormat)

const bree = new Bree({
  logger: console,
  root: false,
  jobs: [
    {
      path: './dist/jobs/textMeWhenIGetAnImportantEmail.js',
      name: 'textMeWhenIGetAnImportantEmail',
      interval: '5m',
    },
    {
      path: './dist/jobs/addCurrentDayToNotionDayDB.js',
      name: 'addCurrentDayToNotionDayDB',
      interval: '1h',
    },
    // runs syncGoogleCalendarAndNotionScheduledTasks on start and then every 1 minute
    {
      path: './dist/jobs/syncGoogleCalendarAndNotionScheduledTasks.js',
      name: 'syncGoogleCalendarAndNotionScheduledTasks',
      interval: '3m',
    },
    // runs importOuraSleepDataIntoNotion every hour
    {
      path: './dist/jobs/importOuraSleepDataIntoNotion.js',
      name: 'importOuraSleepDataIntoNotion',
      interval: '1h',
    },
  ],
})

bree.start()
