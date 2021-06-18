import * as dotenv from 'dotenv'
import main_log from 'simple-node-logger'
import * as path from 'path'
import Bree from 'bree'
import { google } from 'googleapis'
dotenv.config()

const oAuth2Client = new google.auth.OAuth2(
  process.env.GCAL_CLIENT_ID,
  process.env.GCAL_CLIENT_SECRET,
  process.env.GCAL_REDIRECT_URI
)
oAuth2Client.setCredentials({ refresh_token: process.env.GCAL_REFRESH_TOKEN })

async function testCredentials() {
  try {
    // get the access token
    const accessToken = await oAuth2Client.getAccessToken()

    // use it
    /*
      auth: {
        type: 'OAuth2',
        user: 'michael.mroczka@gmail.com',
        clientId: process.env.GCAL_CLIENT_ID,
        clientSecret: process.env.GCAL_CLIENT_SECRET,
        refreshToken: process.env.GCAL_REFRESH_TOKEN,
        accessToken: accessToken
      }
    */
  } catch (error) {
    return error
  }
}

/**
 *
 *
 *
 *
 *
 *
 *
 *
 *
 *
 *
 *
 */
// console.log('starting index.js')
// const bree = new Bree({
//   logger: console,
//   jobs: [
//     // runs `./jobs/importHighlightsToNotion.js` on start and then every 1 minutes
//     {
//       name: 'importHighlightsToNotion',
//       interval: '1m',
//     },
//   ],
// })

// console.log('starting bree')
// bree.start()
