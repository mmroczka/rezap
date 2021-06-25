import { Schema, model } from 'mongoose'

export const calendarEventSchema = new Schema({
  id: String,
  status: String,
  htmlLink: String,
  created: String,
  updated: String,
  summary: String,
  start: {
    dateTime: String,
  },
  end: {
    dateTime: String,
  },
  sequence: Number,
  reminders: {
    useDefaults: Boolean
  },
})

const CalendarEvent = model('CalendarEvent', calendarEventSchema)

export { CalendarEvent }
