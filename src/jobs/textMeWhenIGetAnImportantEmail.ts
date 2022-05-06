import * as dotenv from 'dotenv'
import { GoogleGmailAPI } from './../APIs/google-gmail-api'
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
    let dedicatedCoachingEmailList =
      await gmailAPI.getDedicatedCoachingEmails()
    
    // if we don't have any then return
    if (!dedicatedCoachingEmailList) {
      console.log('no new coaching emails found')
      return
    }

    // if there are dedicated coaching emails in the inbox, loop through them
    if (dedicatedCoachingEmailList?.length > 0) {
      for (let i =0; i< dedicatedCoachingEmailList.length; i++) {
        let threadId = dedicatedCoachingEmailList[i][0]
        let filteredCandidates = filterCandidates(dedicatedCoachingEmailList[i][1])
        // if the email already exists in our DB we've already seen it and sent a text
        // const curEmailSeen = await RezapEmail.findOne({
        //   emailID: threadId,
        // })
        // if (curEmailSeen) {
        //   console.log('====== message already seen, ignoring ======', threadId)
        //   continue
        // }

        // if we made it this far, it's a new email and we need to add it to mongodb...
        console.log(`Adding message ${threadId} to mongoDB`)
        // await mongoDB.rezap.insertOne(new RezapEmail({ emailID: threadId }))

        // ... and alert me
        if (filteredCandidates.length === 0) continue
        let uniqueText = generateUniqueEmail(filteredCandidates)
        console.log('Sending text message\n', uniqueText)
        twilioAPI.sendTextMessage(uniqueText, '+18722278274')
        // twilioAPI.sendTextMessage('NEW DEDICATED COACHING SESSION AVAILABLE!!', '+18722278274')
        // twilioAPI.callMe()
      }
    } else {
      console.log('No new emails')
    }
  } catch (e) {
    console.log(e)
  } /*finally {
    mongoDB.close()
  }*/
  console.log('done running textMeWhenIGetAnImportantEmail')
}


const filterCandidates = (candidates:any) => {
  let viableCandidates = candidates.filter(function(c:any) { return c.name !== ""; })
  viableCandidates = viableCandidates.filter(function(c:any) { return ((['junior', 'l3', 'l4', 'intermediate', 'mid'].some(el => c.level.includes(el)))); })
  viableCandidates = viableCandidates.filter(function(c:any) { return (c.niche === "" || (["data", "android", "mobile", "system design", "systems design", "distributed"].every(el => !c.niche.includes(el)))); })
  return viableCandidates
}

const generateUniqueEmail = (candidates: any) => {
  let intros = ["Glad I saw this!", "Nice.", "Sweet.", "Ok.", "Uhhhmmm...", "Alright", "Exciting!", "Love it."]
  let candidateList = ""
  if (candidates.length > 2) {
    for (let i = 0; i < candidates.length-1; i++) {
      candidateList += candidates[i].name + ", "
    }
    candidateList += "and/or " + candidates[candidates.length-1].name
  } else if (candidates.length === 2) {
    candidateList = candidates[0].name + " and/or " + candidates[1].name
  } else if (candidates.length === 1) {
    candidateList = candidates[0].name
  }
  return `${intros[Math.floor(Math.random()*intros.length)]} I can take ${candidateList}`
}

main()
