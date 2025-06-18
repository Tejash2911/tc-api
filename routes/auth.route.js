import express from 'express'
import { forgotPassword, login, logout, register, resetPassword } from '../controllers/auth.controller.js'

const router = express.Router()

//Register
router.post('/register', register)

//login
router.post('/login', login)

//logout
router.post('/logout', logout)

//forgot password
router.post('/forgot-pass', forgotPassword)

//reset password
router.post('/resetpassword/:resetToken', resetPassword)

export default router
