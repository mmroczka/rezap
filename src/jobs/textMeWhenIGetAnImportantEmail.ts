import * as dotenv from 'dotenv'
import { GoogleGmailAPI } from './../APIs/google-gmail-api';
import { TwilioAPI } from '../APIs/twilio-api.js'
import { Logger } from '../utils/Logger'
import { RezapEmail } from '../Models/rezapEmail'
import { connect, connection } from 'mongoose'
dotenv.config()
const jobName: string = '[[Text Me When I Get An Important Email]]'

const setupDB = async () => {
  let db = connection
  db.on('error', console.error.bind(console, 'CONNECTION ERROR'))
  await connect('mongodb://localhost:27017/test', {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  const rezap = db.collection('rezapemails')
  return {
    rezap,
    close() {
      return db.close()
    },
  }
}

const main = async () => {
  const gmailAPI = new GoogleGmailAPI(jobName)
  const twilioAPI = new TwilioAPI(jobName)
  const mongoDB = await setupDB()

  console.log('======STARTING textMeWhenIGetAnImportantEmail job ======')

  try {
    // get all dedicated coaching emails in inbox
    const dedicatedCoachingEmailList = await gmailAPI.getDedicatedCoachingEmails()
    // if we don't have any then return
	if (!dedicatedCoachingEmailList) {
		console.log('no new coaching emails found')
		return
	}

    // if there are dedicated coaching emails in the inbox, loop through them
    if (dedicatedCoachingEmailList?.length > 0) {
      for (const messageId of dedicatedCoachingEmailList){
        // if the email already exists in our DB we've already seen it and sent a text
        const curEmailSeen = await RezapEmail.findOne({
          emailID: messageId,
        })
		if (curEmailSeen){
			console.log('====== message already seen, ignoring ======', messageId)
		    continue
		}

        // if we made it this far, it's a new email and we need to add it to mongodb...
        console.log(`Adding message ${messageId} to mongoDB`)
        // await mongoDB.rezap.insertOne(new RezapEmail({ emailID: messageId }))

        // ... and alert me via text
        console.log('Sending text message')
        // twilioAPI.sendTextMessage('NEW DEDICATED COACHING SESSION AVAILABLE!!', '+18722278274')
        // twilioAPI.callMe()
      }
    } else{
      console.log('No new emails')
    }
  } catch (e) {
	console.log(e)
  } finally {
    mongoDB.close()
  }
  console.log('done running textMeWhenIGetAnImportantEmail')
}

main()
