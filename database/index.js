import mongoose from 'mongoose'
import { config } from '../config/config.js'

const connectToDB = async () => {
  const connectionUrl = config.databaseUrl
  try {
    mongoose.connection.on('connected', () => {
      console.log('db Connected Successfully!')
    })
    mongoose.connection.on('error', err => {
      console.log('Error in connecting to database', err)
    })
    await mongoose.connect(connectionUrl)
  } catch (error) {
    console.log('Error in connecting to database:', error)
    process.exit(1)
  }
}

export default connectToDB
