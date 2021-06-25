import { Schema, model } from 'mongoose'

export const taskSchema = new Schema({
  'Action Item': String,
  Priority: String,
  Done: Boolean,
  'Do Date': Date,
  'Due Date': Date,
  Status: String,
  Project: String,
  URL: String,
  'Can Do Early?': String,
})

const Task = model('Task', taskSchema)

export { Task }
