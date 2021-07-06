import { Schema, model } from 'mongoose'

export const calendarEventSchema = new Schema({
  id: {
    type: String,
    required: true,
    unique: true,
  },
  status: {
    type: String,
    required: true,
  },
  htmlLink: {
    type: String,
    required: true,
    unique: true,
  },
  created: {
    type: String,
    required: true,
  },
  updated: {
    type: String,
    required: true,
  },
  summary: {
    type: String,
    required: true,
  },
  start: {
    dateTime: {
      type: String,
      required: true,
    },
  },
  end: {
    dateTime: {
      type: String,
    },
  },
  sequence: {
    type: Number,
  },
})

const CalendarEvent = model('CalendarEvent', calendarEventSchema)

export { CalendarEvent }
