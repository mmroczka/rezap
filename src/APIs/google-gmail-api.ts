import * as dotenv from 'dotenv'
import { Logger } from '../utils/Logger'
import { google } from 'googleapis'
import * as Base64 from 'js-base64'
// import { RezapCalendarTask } from '../Models/rezapItem'
import * as dayjs from 'dayjs'
dotenv.config()

const oAuth2Client = new google.auth.OAuth2(
	process.env.GMAIL_CLIENT_ID,
	process.env.GMAIL_CLIENT_SECRET,
	process.env.GMAIL_REDIRECT_URI,
)
oAuth2Client.setCredentials({
	refresh_token: process.env.GMAIL_REFRESH_TOKEN,
})
google.options({
	auth: oAuth2Client,
})

class GoogleGmailAPIError extends Error {}

export class GoogleGmailAPI {
	protected logger
	protected google = google

	constructor(public jobName: string = 'No Job Name') {
		this.logger = new Logger(
			'./src/logs/google-gmail-api.log',
			'[GOOGLE GMAIL API]',
			jobName
		)
	}

	async getDedicatedCoachingEmails(){
		try{
			let dedicatedCoachingEmails = []
			const gmail = google.gmail({ version: 'v1'})
			const messages = await gmail.users.messages.list({userId: "me", maxResults: 4, q:"subject:(Dedicated Coaching claim"})
			if (!messages || !messages?.data || !messages?.data?.messages){
				console.log("data never came back from gmail api")
				this.logger.log('data never came back from gmail api')
				return []
			}

      let ids = new Set()

			for (const message of messages?.data?.messages) {
				const response = await gmail.users.messages.get({userId: "me", id: message.id, format: "full"})
        const threadId = response?.data?.threadId
				if (!response?.data?.payload?.headers || !response?.data?.payload?.parts) return []
					// Displaying Message Body as a Plain Text
					const joinedOpportunities = getJoinedOpportunities(response?.data?.payload?.parts)
          const opportunities = separateOpportunities(joinedOpportunities)
          const candidates = extractCandidates(opportunities)
          if (ids.has(threadId) && threadId) {
            addCandidatesToThread(threadId, dedicatedCoachingEmails, candidates)
          } else if (candidates.length > 0){
            console.log('adding to dedicatedCoachingEmails')
            dedicatedCoachingEmails.push([threadId, candidates])
          }
			}
			return dedicatedCoachingEmails
		} catch(e){
			this.logger.log(`error: ${e}`)
		}
	}
}

const addCandidatesToThread = (id: string, dedicatedCoachingEmails: any, newCandidates: any) => {
  for (let [threadId, candidates] of dedicatedCoachingEmails) {
    if (id === threadId) {
      candidates.concat(newCandidates)
    }
  }
}

const getJoinedOpportunities = (parts:any) => {
	let emailLines = []
	let emailLinesSanitized = []
	for (const part of parts) {
		if (part?.mimeType === "text/plain"){
			let email = decodeBase64(part?.body?.data || "").split("\n")
			for (const line of email){
				if (!line.includes('>')){
					emailLines.push(line) }
			}
			for (let i = 0; i < emailLines.length; i++) {
				let newLine = emailLines[i].replace(/\r/g, '')
				if (newLine !== '' && !newLine.includes("Thanks") && !newLine.includes("Hi everyone") && !newLine.includes("2022 at") && !newLine.includes("Here is what ")){
					emailLinesSanitized.push(newLine)
				}
			}
		}
	}
	return emailLinesSanitized.join(' ')
}

const matchTillNext = (joined: string, found1: string, found2: string) => {
  // find found1 start
  let found1_start = joined.indexOf(found1)
  // find where found2 starts in regex
  let found1_end = joined.indexOf(found2)
  if (found1_start && found1_end){
    return [found1_start, found1_end]  
  } else if (found1_start && !found1_end){
    return [found1_start, -1]
  } else if (!found1_start && found1_end){
    return [-1, found1_end]
  }
  return [-1,-1]
}

const separateOpportunities = (joined: string) => {
  let candidates = []
  
  const regex =/([A-Z|a-z]+ [A-Z|a-z]+ \([0-9]+ sessions\).*?Within)/g
  const found = joined.match(regex);
  if (!found) return []
  while (found.length > 1){
    let [start, end] = matchTillNext(joined, found[0], found[1])
    if (start !== -1 && end !== -1){
      candidates.push(joined.slice(start, end))
    }
    found.shift()
    joined = joined.slice(end-1)
  }
  
  // get last candidate from regex
  let found1_start = joined.indexOf(found[0])
  candidates.push(joined.slice(found1_start))
  return candidates
}

const extractCandidates = (candidateStrings: string[]) => {
  let candidates = []
  for (let candidateString of candidateStrings){
    let candidate = { name: "", numSessions: "", level: "", niche: "", availability: "" }
    candidate.name = getName(candidateString) || ""
    candidate.numSessions = getSessions(candidateString) || ""
    candidate.level = getLevel(candidateString)?.toLowerCase() || ""
    candidate.niche = getNiche(candidateString)?.toLowerCase() || ""
    candidate.availability = getAvailability(candidateString)?.toLowerCase() || ""
    candidates.push(candidate)
  }
  return candidates
}

const getName = (str: string) => {
  const regex = /([A-Z|a-z]+ [A-Z|a-z]+)(?= \([0-9]+ sessions\))/g
	const found = str.match(regex)
	if (found) {
    return found[0]
  }
  return null
}

const getSessions = (str: string) => {
  if (str.indexOf('(') === -1 || str.indexOf(')') === -1){
    return null
  }
  return str.slice(str.indexOf('(')+1, str.indexOf(')'))
}

const getLevel = (str: string) => {
  if (str.indexOf(')') === -1 || str.indexOf('Focus') === -1){
    return null
  }
  return str.slice(str.indexOf(')')+1, str.indexOf('Focus')).trim().replace(".", "")
}

const getNiche = (str: string) => {
  if (str.indexOf('Niche') === -1 || str.indexOf('Within') === -1){
    return null
  }
  if (str.indexOf('Availability') === -1){
    return str.slice(str.indexOf('Niche')+6, str.indexOf('Within')).trim().replace(".", "")
  }
  return str.slice(str.indexOf('Niche')+6, str.indexOf('Availability')).trim().replace(".", "")
}

const getAvailability = (str: string) => {
  if (str.indexOf('Within') === -1){
    return null
  }
  return str.slice(str.indexOf('Within')+6).trim()
}

function decodeBase64(str: string) {
	str = str.replace(/_/g, '/').replace(/-/g, '+')
	return Base64.atob(str)
}
