import { Schema, model } from 'mongoose'

export const rezapSchema = new Schema({
  taskName: String,
  googleCalID: String,
  notionPageID: String,
  lastRezapUpdate: Date,
  priority: String,
  done: Boolean,
  doDate: {
    startTime: Date,
    endTime: Date,
  },
  dueDate: {
    startTime: Date,
    endTime: Date,
  },
  status: String,
  url: String,
})

const RezapCalendarTask = model('RezapCalendarTask', rezapSchema)

export { RezapCalendarTask }
