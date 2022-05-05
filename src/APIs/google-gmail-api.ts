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
			const messages = await gmail.users.messages.list({userId: "me", maxResults: 2, q:"subject:(Dedicated Coaching claim"})
			if (!messages || !messages?.data || !messages?.data?.messages){
				console.log("data never came back from gmail api")
				this.logger.log('data never came back from gmail api')
				return []
			}

			for (const message of messages?.data?.messages) {
				const response = await gmail.users.messages.get({userId: "me", id: message.id, format: "full"})
				if (!response?.data?.payload?.headers || !response?.data?.payload?.parts) return []
					// Displaying Message Body as a Plain Text
					const opportunities = getOpportunities(response?.data?.payload?.parts)
					for (const opportunity of opportunities) {
						console.log("@@@@@@@@@@@@@@@\n ", opportunity)
					}
					// extractCandidates(emailDetails)
					for (const header of response?.data?.payload?.headers){
						if (header.name == "Subject" && header.value?.includes("Dedicated Coaching") && header.value?.includes("claim")){
							console.log(`Adding...${header.value}`)
							this.logger.log(`Adding...${header.value}`)
							dedicatedCoachingEmails.push(message.id)
						}
					}
			}
			return []
			return dedicatedCoachingEmails
		} catch(e){
			this.logger.log(`error: ${e}`)
		}
	}
}

const getOpportunities = (parts:any) => {
	let email = [];
	let emailLines = []
	let emailLinesSanitized = []
	let opportunities:any = []
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

	let joined = emailLinesSanitized.join(' ')
	const regex =/([A-Z|a-z]+ [A-Z|a-z]+ \([0-9]+ sessions\).*?Within)/g
	let start = regexIndexOf(joined, regex, 0)
	console.log('==== joined looks like ===', joined)
	console.log('==== END joined looks like ===')
	while (start < joined.length && regexIndexOf(joined, regex, start) !== -1){
		let nextCandidate = regexIndexOf(joined, regex, start+1)
		console.log("start = ", start, "\n")
		console.log("nextCandidate = ", nextCandidate, "\n")

		let cur = ""
		// there is another candidate after start point
		if (nextCandidate !== -1) {
			cur = joined.slice(start, nextCandidate)
			console.log("if cur = ", cur, "\n")
			opportunities.push(cur)
			console.log('+++++ \n', cur)
		} else{
			// this is the last candidate found
			cur = joined.slice(start)
			console.log("else cur= ", cur, "\n")
			opportunities.push(cur)
		}
		start = nextCandidate+1
		console.log("is there another match?\n", regexIndexOf(joined, regex, start) !== -1)
	}

	return opportunities
}

const newCandidate = (line: string) => {
	return line.match(/- [A-Z|a-z]+ [A-Z|a-z]+ \([0-9]+ sessions\)/g)
}

function regexIndexOf(string:string, regex: any, startpos: number) {
	var indexOf = string.substring(startpos || 0).search(regex)
	return (indexOf >= 0) ? (indexOf + (startpos || 0)) : indexOf
}

const extractCandidates = (opportunities: any) => {
	const candidates = []
	for (const line of opportunities) {
		console.log('---- analyzing line ----')
		console.log(line)
		const regex = /- [A-Z|a-z]+ [A-Z|a-z]+ \([0-9]+ sessions\)/g
		const found = line.match(regex)
		if (found) {
			let line = found[0]
			let candidate = { name: "", numSessions: 0, level: "", niche: "" }
			candidate.name = line.replace(/[^a-z]/gi, '')
			candidate.numSessions = line.slice(line.indexOf('(')+1, line.indexOf(')'))
			// if (line.indexOf('SWE L')){

			// }
			candidates.push(candidate)
	}

		console.log('---- END analyzing line ----')
		console.log(candidates)
	}
}

function decodeBase64(str:string) {
	str = str.replace(/_/g, '/').replace(/-/g, '+')
	return Base64.atob(str)
}
