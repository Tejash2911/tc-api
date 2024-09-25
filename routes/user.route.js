import express from 'express'
import { verifyAdminWithToken, verifyUserWithToken } from '../middlewares/tokenVerify.js'
import { deleteUser, getAllUsersInfo, getUserInfo, getUserStats, updateUser } from '../controllers/user.controller.js'

const router = express.Router()

//UPDATE req: login
router.put('/:id', verifyUserWithToken, updateUser)

//delete user req:login
router.delete('/:id', verifyUserWithToken, deleteUser)

//get specific user info, req:admin login
router.get('/:id', verifyAdminWithToken, getUserInfo)

//get all user info, req:admin login
router.get('/', verifyAdminWithToken, getAllUsersInfo)

//GET USER STATS
router.get('/stats', verifyAdminWithToken, getUserStats)

export default router
