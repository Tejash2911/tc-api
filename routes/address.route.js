import express from 'express'
import { getUserAddress, saveUserAddress } from '../controllers/address.controller.js'
import { verifyToken } from '../middlewares/tokenVerify.js'

const router = express.Router()

//get user address
router.get('/', verifyToken, getUserAddress)

router.post('/', verifyToken, saveUserAddress)

export default router
