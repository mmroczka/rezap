interface IGoogleCalendarEvent {
  kind: string
  etag: string
  id: string
  status: string
  htmlLink: string
  created: string
  updated: string
  summary: string
  description: string
  location: string
  creator: IPerson
  organizer: IPerson
  start: {
    dateTime: string
  }
  end: {
    dateTime: string
  }
  iCalUID: string
  sequence: number
  reminders: {
    useDefault: boolean
  }
  eventType: string
}

interface IPerson {
  self: boolean
  email?: string
}
