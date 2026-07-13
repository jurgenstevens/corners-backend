import 'dotenv/config.js'
import express from 'express'
import logger from 'morgan'
import cors from 'cors'
import formData from 'express-form-data'

import './config/database.js'

import { router as profilesRouter } from './routes/profiles.js'
import { router as authRouter } from './routes/auth.js'
import productsRouter from './routes/products.js'
import connectionsRouter from './routes/connections.js'
import businessesRouter from './routes/businesses.js'
import notificationsRouter from './routes/notifications.js'
import patronsRouter from './routes/patrons.js'
import distributorsRouter from './routes/distributors.js'
import ordersRouter from './routes/orders.js'
import adminRouter from './routes/admin.js'
import bugReportsRouter from './routes/bugReports.js'
import messagesRouter from './routes/messages.js'
import uploadsRouter from './routes/uploads.js'
import { decodeUserFromToken, checkNotBanned } from './middleware/auth.js'
import { startCleanupJobs } from './jobs/cleanupRejectedProducts.js'

const app = express()
app.disable('x-powered-by')

app.use(cors())
app.use(logger('dev'))
app.use(express.json())
app.use('/api/uploads', uploadsRouter)
app.use(formData.parse())

app.use('/api/auth', authRouter)
app.use('/api/admin', adminRouter)
app.use('/api/profiles', decodeUserFromToken, checkNotBanned, profilesRouter)
app.use('/api/products', decodeUserFromToken, checkNotBanned, productsRouter)
app.use('/api/connections', decodeUserFromToken, checkNotBanned, connectionsRouter)
app.use('/api/businesses', decodeUserFromToken, checkNotBanned, businessesRouter)
app.use('/api/notifications', decodeUserFromToken, checkNotBanned, notificationsRouter)
app.use('/api/patrons', decodeUserFromToken, checkNotBanned, patronsRouter)
app.use('/api/distributors', decodeUserFromToken, checkNotBanned, distributorsRouter)
app.use('/api/orders', decodeUserFromToken, checkNotBanned, ordersRouter)
app.use('/api/bug-reports', decodeUserFromToken, checkNotBanned, bugReportsRouter)
app.use('/api/messages', messagesRouter)

startCleanupJobs()

app.use(function (req, res, next) {
  res.status(404).json({ err: 'Not found' })
})

app.use(function (err, req, res, next) {
  res.status(err.status || 500).json({ err: err.message })
})

export { app }