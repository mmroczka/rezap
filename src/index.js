import * as dotenv from 'dotenv'
import axios from 'axios'
import { NotionAPI } from './notion-api.js'
dotenv.config()

console.log(`your env value is: + ${process.env.RESCUE_TIME_TOKEN || ' '}`)

const RESCUE_TIME_BASE_URL = 'https://www.rescuetime.com/anapi'
const RS_HIGHLIGHTS = '/highlights_feed'
const notionAPI = new NotionAPI()

const getRescueTimeHighlights = async () => {
  try {
    const resp = await axios.get(RESCUE_TIME_BASE_URL + RS_HIGHLIGHTS, {
      params: {
        key: process?.env.RESCUE_TIME_TOKEN,
      },
    })
    if (resp.status === 200) {
      return resp.data
    }
  } catch (err) {
    console.log(err)
  }
}

console.log(
  await notionAPI.retrieveDatabase(notionAPI.NOTION_RESCUE_TIME_DB_ID)
)

// const highlights = await getRescueTimeHighlights()
// console.log(highlights)

// notionAPI.createPageInDatabase()
