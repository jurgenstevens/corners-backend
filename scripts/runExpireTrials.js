import 'dotenv/config.js'
import mongoose from 'mongoose'
import { expireTrials } from '../jobs/expireTrials.js'

await mongoose.connect(process.env.DATABASE_URL)
await expireTrials()
await mongoose.disconnect()
