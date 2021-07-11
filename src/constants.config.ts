import * as dotenv from 'dotenv'
dotenv.config()

export default {
  RESCUE_TIME_TOKEN: process.env.RESCUE_TIME_TOKEN ?? '',
  NOTION_KEY: process.env.NOTION_KEY ?? '',
  NOTION_RESCUE_TIME_HIGHLIGHTS_DB_ID:
    process.env.NOTION_RESCUE_TIME_HIGHLIGHTS_DB_ID ?? '',
  NOTION_TASKS_DB_ID: process.env.NOTION_TASKS_DB_ID ?? '',
  NOTION_DAY_DB_ID: process.env.NOTION_DAY_DB_ID ?? '',
  GCAL_CLIENT_ID: process.env.GCAL_CLIENT_ID ?? '',
  GCAL_CLIENT_SECRET: process.env.GCAL_CLIENT_SECRET ?? '',
  GCAL_REDIRECT_URI: process.env.GCAL_REDIRECT_URI ?? '',
  GCAL_REFRESH_TOKEN: process.env.GCAL_REFRESH_TOKEN ?? '',
  OURA_PERSONAL_ACCESS_TOKEN: process.env.OURA_PERSONAL_ACCESS_TOKEN ?? '',
}
