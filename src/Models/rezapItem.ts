import { Schema, model } from 'mongoose'

export const rezapSchema = new Schema({
  taskName: {
    type: String,
    required: true,
  },
  googleCalID: {
    type: String,
    required: true,
    unique: true,
  },
  notionPageID: {
    type: String,
    required: true,
    unique: true,
  },
  lastRezapUpdate: {
    type: Date,
    required: true,
  },
  priority: {
    type: String,
    required: true,
  },
  status: {
    type: String,
    required: true,
  },
  done: {
    type: Boolean,
    required: true,
  },
  url: {
    type: String,
    required: true,
  },
  start: {
    startTime: {
      type: Date,
      required: true,
    },
    endTime: Date,
  },
  end: {
    startTime: Date,
    endTime: Date,
  },
})

const RezapCalendarTask = model('RezapCalendarTask', rezapSchema)

export { RezapCalendarTask }
