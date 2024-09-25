import express from 'express'
import { verifyToken } from '../middlewares/tokenVerify.js'
import { checkout, getKey, paymentVerify } from '../controllers/payment.controller.js'

const router = express.Router()

router.post('/checkout', verifyToken, checkout)

router.post('/paymentVerify', paymentVerify)

router.get('/getKey', getKey)

export default router
