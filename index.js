import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import compression from 'compression'
import { config } from './config/config.js'
import connectToDB from './database/index.js'

// Route imports
import addressRoute from './routes/address.route.js'
import announcementRoute from './routes/announcement.route.js'
import cartRoute from './routes/cart.route.js'
import userRoute from './routes/user.route.js'
import authRoute from './routes/auth.route.js'
import productRoute from './routes/product.route.js'
import orderRoute from './routes/order.route.js'
import reviewRoute from './routes/review.route.js'
import stripeRoute from './routes/stripe.route.js'
import analyticsRoute from './routes/analytics.route.js'
import paymentRoute from './routes/payment.route.js'

const app = express()

// Enhance security
app.use(helmet())

// Compress responses
app.use(compression())

// Enable CORS
app.use(cors())

// Parse JSON and URL-encoded bodies
app.use(express.json({ limit: '50mb' }))
app.use(express.urlencoded({ extended: true, limit: '50mb' }))

// Connect to the database
connectToDB().catch(err => {
  console.error('Failed to connect to database:', err)
  process.exit(1)
})

// API routes
const apiRouter = express.Router()

apiRouter.use('/auth', authRoute)
apiRouter.use('/user', userRoute)
apiRouter.use('/product', productRoute)
apiRouter.use('/cart', cartRoute)
apiRouter.use('/orders', orderRoute)
apiRouter.use('/checkout', stripeRoute)
apiRouter.use('/announcement', announcementRoute)
apiRouter.use('/buy', paymentRoute)
apiRouter.use('/review', reviewRoute)
apiRouter.use('/user/address', addressRoute)
apiRouter.use('/analytics', analyticsRoute)

// Apply API router to /api/v1 endpoint
app.use('/api/v1', apiRouter)

// Basic route to test if the server is running
app.get('/', (req, res) => {
  res.send('Server is running')
})

// 404 handler
app.use((req, res) => {
  res.status(404).json({ message: 'Not Found' })
})

// Error handler
app.use((err, req, res, next) => {
  console.error(err.stack)
  res.status(500).json({ message: 'Internal Server Error' })
})

// Start the server
const appPort = config.port || 4000

const server = app.listen(appPort, () => {
  console.log(`Backend server is running on port ${appPort}`)
})

// Graceful shutdown
function gracefulShutdown() {
  console.log('Received kill signal, shutting down gracefully')
  server.close(() => {
    console.log('Closed out remaining connections')
    process.exit(0)
  })

  setTimeout(() => {
    console.error('Could not close connections in time, forcefully shutting down')
    process.exit(1)
  }, 10000)
}

process.on('SIGTERM', gracefulShutdown)
process.on('SIGINT', gracefulShutdown)

// Handle uncaught exceptions
process.on('uncaughtException', err => {
  console.error('Uncaught Exception:', err)
  gracefulShutdown()
})

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason)
  gracefulShutdown()
})
