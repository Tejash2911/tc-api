import mongoose from 'mongoose'
import Product from '../models/product.model.js'
import Order from '../models/order.model.js'
import Cart from '../models/cart.model.js'
import User from '../models/user.model.js'
import Razorpay from 'razorpay'
import crypto from 'crypto'
import sendEmail from '../helpers/sendEmail.js'
import { createOrderTemplate } from '../helpers/orderConfirmation.js'
import { config } from '../config/config.js'
import ConfirmOrder from '../models/confirmOrder.model.js'
import { messages } from '../utils/constants.js'

const instance = new Razorpay({
  key_id: config.razorPayKeyId,
  key_secret: config.razorPayKeySecret
})

export const checkout = async (req, res) => {
  let price = undefined
  let cart = undefined
  const mergedProducts = []

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

  const [nCart] = cart //removing array brackets

  if (!nCart) {
    return res.status(404).json({ message: messages.NOT_FOUND })
  }

  nCart.products.forEach(product => {
    //merging user cart product with db product info like price n all which are dynamic
    const productInfo = nCart.productInfo.find(info => `${info._id}` === `${product.productID}`) //converted to string because when i was checking === it was checking the reference on the memory not value bcz its an Objectid is an reference type
    mergedProducts.push({ ...product, ...productInfo })
  })

  //calculating total price
  price = await mergedProducts.reduce((total, item) => {
    return total + item.price * item.quantity
  }, 0)

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
      type: 'cart',
      products: mergedProducts,
      price: Number(price.toFixed(2)),
      userInfo: {
        address: req.body.userInfo.address,
        name: req.body.userInfo.name,
        email: req.body.userInfo.email,
        number: req.body.userInfo.number
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
    return res.status(500).json({ message: messages.INTERNAL_ERROR })
  }
}

export const paymentVerify = async (req, res) => {
  const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body
  const body = razorpay_order_id + '|' + razorpay_payment_id

  const expectedSignature = crypto.createHmac('sha256', config.razorPayKeySecret).update(body.toString()).digest('hex')
  if (expectedSignature === razorpay_signature) {
    try {
      const dbOrder = await Order.findOneAndDelete({ 'order.id': razorpay_order_id })
      if (!dbOrder) {
        return res.status(404).json({ message: messages.NOT_FOUND })
      }
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
        const idObject = new mongoose.Types.ObjectId(dbOrder.products[0].productID) //converting in ObjectID
        await User.updateOne({ _id: dbOrder.userID }, { $addToSet: { purchasedProducts: idObject } })

        await Product.findByIdAndUpdate(dbOrder.products[0].productID, {
          $inc: { purchasedCount: dbOrder.products[0].quantity, quantity: -dbOrder.products[0].quantity }
        })
      }
    } catch (error) {
      console.log(error)
      return res.status(500).json({ message: messages.INTERNAL_ERROR })
    }
    return res.redirect(`${config.frontendUrl}/paymentSuccess?reference=${razorpay_payment_id}`)
  } else {
    return res.status(500).json({ message: messages.INTERNAL_ERROR })
  }
}

export const getKey = async (req, res) => {
  return res.status(200).json({ key: config.razorPayKeyId })
}
