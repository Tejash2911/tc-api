import express from 'express'
import { forgotPassword, login, register, resetPassword } from '../controllers/auth.controller.js'

const router = express.Router()

//Register
router.post('/register', register)

//login
router.post('/login', login)

//forgot password
router.post('/forgot-pass', forgotPassword)

//reset password
router.post('/resetpassword/:resetToken', resetPassword)

export default router
