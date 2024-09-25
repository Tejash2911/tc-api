import express from 'express'
import { verifyAdminWithToken, verifyToken } from '../middlewares/tokenVerify.js'
import {
  addToCart,
  deleteFromCart,
  getAllCart,
  getCartSize,
  getUserCart,
  updateCartQty
} from '../controllers/cart.controller.js'

const router = express.Router()

//add new product to cart req: login
router.post('/', verifyToken, addToCart)

//get cart size
router.get('/size', verifyToken, getCartSize)

//update products Quantity in cart
router.put('/update-quantity/:productNumber/:newQuantity', verifyToken, updateCartQty)

//delete from cart
router.delete('/:id', verifyToken, deleteFromCart)

//get user cart
router.get('/info/:userId', verifyToken, getUserCart)

//GET ALL carts
router.get('/all', verifyAdminWithToken, getAllCart)

export default router
