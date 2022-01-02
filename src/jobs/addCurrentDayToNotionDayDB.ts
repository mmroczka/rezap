import { Logger } from '../utils/Logger'
import { NotionAPI } from '../APIs/notion-api.js'
import * as dayjs from 'dayjs'
import localizedFormat from 'dayjs/plugin/localizedFormat'
dayjs.extend(localizedFormat)
const jobName: string = '[[Add Current Day To Notion Day DB]]'

const main = async () => {
  const notionAPI = new NotionAPI(jobName)
  const date = dayjs.default(dayjs.default().format('LL')).toISOString()
  console.log(date)
  const existingNotionPage = await notionAPI.findDayPageByDate(date)
  if (!existingNotionPage) {
    console.log('Page not found. Creating page now.')
    // const newNotionPage = notionAPI.convertCurrentDateToNotionDayPage()
    // notionAPI.addPageInDatabase(newNotionPage)
  } else {
    console.log('found page: refraining from making another page')
  }
}

main()
