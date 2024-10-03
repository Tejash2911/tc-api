import express from 'express'
import { getUserAddress, saveUserAddress, updateUserAddress } from '../controllers/address.controller.js'
import { verifyToken } from '../middlewares/tokenVerify.js'

const router = express.Router()

//get user address
router.get('/', verifyToken, getUserAddress)

router.post('/', verifyToken, saveUserAddress)

router.patch('/', verifyToken, updateUserAddress)

export default router
