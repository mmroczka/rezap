import { Schema, model } from 'mongoose'

export const todosSchema = new Schema({
  description: String,
  complete: Boolean,
})

// module.exports.Todos = model('Todos', todosSchema)

const Todos = model('Todos', todosSchema)

export { Todos }
