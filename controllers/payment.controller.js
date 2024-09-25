import mongoose from 'mongoose'
import Product from '../models/product.model.js'
import Order from '../models/order.model.js'
import Cart from '../models/cart.model.js'
import User from '../models/user.model.js'
import ConfirmOrder from '../models/ConfirmOrder.model.js'
import Razorpay from 'razorpay'
import crypto from 'crypto'
import sendEmail from '../helpers/sendEmail.js'
import { createOrderTemplate } from '../helpers/orderConfirmation.js'
import { config } from '../config/config.js'

const instance = new Razorpay({
  key_id: config.razorPayKeyId,
  key_secret: config.razorPayKeySecret
})

export const checkout = async (req, res) => {
  let price = undefined
  let cart = undefined
  const mergedProducts = []

  if (req.body.type === 'product') {
    //if req is for single product
    const dbProduct = await Product.findById(req.body.product.productID, {
      price: 1,
      img: 1,
      title: 1,
      _id: 0,
      quantity: 1
    })

    if (!dbProduct) return res.status(404).json({ success: false, message: 'Sorry! Unable to find this product.' })
    if (dbProduct.quantity < 1)
      return res.status(404).json({ success: false, message: 'Sorry! This products is currently out of stock' })

    price = dbProduct.price * req.body.product.quantity
    req.finalProduct = { ...dbProduct._doc, ...req.body.product } //appending dbProduct info with user product info so that i can store the value in db
  } else if (req.body.type === 'cart') {
    //if req is for whole cart
    cart = await Cart.aggregate([
      { $match: { userID: req.user.id } },
      {
        $lookup: {
          from: 'products',
          localField: 'products.productID',
          foreignField: '_id',
          as: 'productInfo'
        }
      },
      {
        $project: {
          userID: 1,
          products: { productID: 1, size: 1, color: 1, quantity: 1 },
          productInfo: {
            productNo: 1,
            _id: 1,
            price: 1,
            title: 1,
            img: 1
          }
        }
      }
    ])

    const [cartt] = cart //removing array brackets

    if (!cartt) {
      return res.status(404).json({ message: 'no products found on your cart' })
    }

    cartt.products.forEach(product => {
      //merging user cart product with db product info like price n all which are dynamic
      const productInfo = cartt.productInfo.find(info => `${info._id}` === `${product.productID}`) //converted to string because when i was checking === it was checking the refrence on the memory not value bcz its an Objectid is an refrence ty[e]
      mergedProducts.push({ ...product, ...productInfo })
    })

    //calculating total price
    price = await mergedProducts.reduce((total, item) => {
      return total + item.price * item.quantity
    }, 0)
  }

  const options = {
    amount: Number((price * 100).toFixed(2)), // amount in the smallest currency unit && toFIxed: it will only allow two decimal values after .
    currency: 'INR',
    receipt: crypto.randomBytes(15).toString('hex')
  }
  try {
    const response = await instance.orders.create(options) //razor pay SDK call

    const dbOrder = await Order.create({
      // Saving to db
      userID: req.user.id,
      type: req.body.type, // is it cart payment or a single product payment
      products: req.finalProduct || mergedProducts,
      price: Number(price.toFixed(2)),
      userInfo: {
        address: req.body.userInfo.address,
        name: req.body.userInfo.name,
        email: req.body.userInfo.email
      },
      order: response
    })
    res.json({
      order: {
        id: response.id,
        amount: response.amount
      }
    })

    const emailTemplate = createOrderTemplate(dbOrder)
    sendEmail({
      to: dbOrder.userInfo.email,
      subject: 'Order Confirmation',
      emailHtml: emailTemplate
    })
  } catch (error) {
    console.log(error)
  }
}

export const paymentVerify = async (req, res) => {
  const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body
  const body = razorpay_order_id + '|' + razorpay_payment_id

  const crypto = require('crypto')
  const expectedSignature = crypto.createHmac('sha256', config.razorPayKeySecret).update(body.toString()).digest('hex')
  if (expectedSignature === razorpay_signature) {
    try {
      const dbOrder = await Order.findOneAndDelete({ 'order.id': razorpay_order_id })
      if (!dbOrder) return res.status(400).json({ error: 'session timeout' })
      const data = { ...dbOrder._doc, paymentStatus: true, paymentInfo: req.body }

      await ConfirmOrder.create(data)

      if (dbOrder.type === 'cart') {
        const updateProduct = dbOrder.products.map(product => ({
          updateOne: {
            filter: { _id: product.id },
            update: {
              $inc: { purchasedCount: product.quantity, quantity: -product.quantity }
            }
          }
        }))
        await Product.bulkWrite(updateProduct)

        await User.updateOne(
          { _id: dbOrder.userID },
          { $addToSet: { purchasedProducts: { $each: dbOrder.products.map(p => p._id) } } }
        ) // map used to get only id's of product which are available on order
        await Cart.deleteOne({ userID: dbOrder.userID })
      } else {
        const idObject = mongoose.Types.ObjectId(dbOrder.products[0].productID) //converting in ObjectID
        await User.updateOne({ _id: dbOrder.userID }, { $addToSet: { purchasedProducts: idObject } })

        await Product.findByIdAndUpdate(dbOrder.products[0].productID, {
          $inc: { purchasedCount: dbOrder.products[0].quantity, quantity: -dbOrder.products[0].quantity }
        })
      }
    } catch (error) {
      console.log(error)
      return res.status(400).json({ success: false, message: 'failed to process your information' })
    }
    return res.redirect(`${config.frontendUrl}/paymentsuccess?refrence=${razorpay_payment_id}`)
  } else {
    return res.status(400).json({ success: false, signatureIsValid: false })
  }
}

export const getKey = async (req, res) => {
  return res.status(200).json({ key: config.razorPayKeyId })
}
