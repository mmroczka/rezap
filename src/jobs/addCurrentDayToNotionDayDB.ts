import { Logger } from '../utils/Logger'
import { NotionAPI } from '../APIs/notion-api.js'
import * as dayjs from 'dayjs'
import customParseFormat from 'dayjs/plugin/customParseFormat'
dayjs.extend(customParseFormat)
const jobName: string = '[[Add Current Day To Notion Day DB]]'

const main = async () => {
  const notionAPI = new NotionAPI(jobName)
  const existingNotionPage = await notionAPI.findNotionDayPageForToday()
  if (!existingNotionPage) {
    console.log('Page not found. Creating page now.')
    const newNotionPage = notionAPI.convertCurrentDateToNotionDayPage()
    notionAPI.addPageInDatabase(newNotionPage)
  } else {
    console.log('found page: refraining from making another page')
  }
}

main()
