import { Schema, model } from 'mongoose'

export const rezapEmail = new Schema({
  emailID: {
    type: String,
    required: true,
    unique: true,
  },
})

const RezapEmail = model('RezapEmail', rezapEmail)

export { RezapEmail }
