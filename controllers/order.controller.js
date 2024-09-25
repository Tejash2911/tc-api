import mongoose from 'mongoose'
import { createOrderTemplate } from '../helpers/orderConfirmation.js'
import sendEmail from '../helpers/sendEmail.js'
import ConfirmOrder from '../models/ConfirmOrder.model.js'
import Order from '../models/order.model.js'

export const createOrder = async (req, res) => {
  const newOrder = new Order(req.body)

  try {
    const savedOrder = await newOrder.save()
    res.status(200).json(savedOrder)
  } catch (err) {
    res.status(500).json(err)
  }
}

export const updateOrder = async (req, res) => {
  try {
    const updatedOrder = await Order.findByIdAndUpdate(
      req.params.id,
      {
        $set: req.body
      },
      { new: true }
    )
    res.status(200).json(updatedOrder)
  } catch (err) {
    res.status(500).json(err)
  }
}

export const deleteOrder = async (req, res) => {
  try {
    await Order.findByIdAndDelete(req.params.id)
    res.status(200).json('Order has been deleted...')
  } catch (err) {
    res.status(500).json(err)
  }
}

export const getUserOrders = async (req, res) => {
  try {
    const orders = await ConfirmOrder.find({ userID: req.user.id }).sort({ createdAt: -1 })
    res.status(200).json(orders)
  } catch (err) {
    res.status(500).json(err)
  }
}

export const getAllOrders = async (req, res) => {
  const { page = 1, limit = 10 } = req.query
  const startIndex = (page - 1) * limit
  const FieldsIWant = { createdAt: 1, userInfo: 1, price: 1, orderStatus: 1 }
  let query = ConfirmOrder.find({}, FieldsIWant)
  const filters = []

  const qSort = req.query.sort
  const qStatus = req.query.status
  const qSearch = req.query.search

  if (qSearch && !isNaN(Number(qSearch))) filters.push({ 'userInfo.address.mobile': { $eq: Number(qSearch) } })
  if (qStatus) filters.push({ orderStatus: qStatus })

  if (filters.length) query = query.find({ $and: filters })

  if (qSort === 'price-asc') query.sort({ price: 1 })
  else if (qSort === 'price-desc') query.sort({ price: -1 })
  else if (qSort === 'oldest') query.sort({ createdAt: 1 })
  else if (qSort === 'newest') query.sort({ createdAt: -1 })

  try {
    const orders = await query.skip(startIndex).limit(limit).exec()
    if (orders.length < 1) return res.status(404).json({ message: 'No Products Found' })
    res.status(200).json(orders)
  } catch (err) {
    console.log(err)
    res.status(500).json({ message: 'internal server error' })
  }
}

export const changeOrderStatus = async (req, res) => {
  const { status } = req.body
  const { id } = req.params

  if (!mongoose.isValidObjectId(id)) return res.status(402).json({ message: 'order id is not valid' })
  if (!status) return res.status(402).json({ message: 'status is requires' })

  try {
    const order = await ConfirmOrder.findByIdAndUpdate(id, { orderStatus: status }, { new: true })
    const emailHTML = createOrderTemplate(order)

    sendEmail({
      to: order.userInfo.email,
      subject: 'Order Confirmation',
      emailHtml: emailHTML,
      emailText: emailHTML
    })

    res.status(200).json({ message: `order status is successfully updated to ${status}` })
  } catch (err) {
    console.log(err)
    res.status(500).json({ message: 'internal server error' })
  }
}

export const getOrderInfo = async (req, res) => {
  const id = req.params.id
  if (!id) return res.status(401).json({ message: 'ID required' })

  if (!mongoose.isValidObjectId(id)) return res.status(401).json({ message: 'ID is not valid' })

  try {
    const order = await ConfirmOrder.findById(id)
    res.status(200).json(order)
  } catch (error) {
    console.log(error)
    res.status(500).json({ message: 'internal server error' })
  }
}
