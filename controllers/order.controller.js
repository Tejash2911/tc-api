import mongoose from 'mongoose'
import { createOrderTemplate } from '../helpers/orderConfirmation.js'
import sendEmail from '../helpers/sendEmail.js'
import Order from '../models/order.model.js'
import ConfirmOrder from '../models/confirmOrder.model.js'
import { messages } from '../utils/constants.js'

export const createOrder = async (req, res) => {
  const newOrder = new Order(req.body)

  try {
    const savedOrder = await newOrder.save()
    return res.status(200).json({ message: messages.ORDER_CREATED, data: savedOrder })
  } catch (error) {
    console.log(error)
    return res.status(500).json({ message: messages.INTERNAL_ERROR })
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
    return res.status(200).json({ message: messages.ORDER_UPDATED, data: updatedOrder })
  } catch (error) {
    console.log(error)
    return res.status(500).json({ message: messages.INTERNAL_ERROR })
  }
}

export const deleteOrder = async (req, res) => {
  try {
    await Order.findByIdAndDelete(req.params.id)
    return res.status(200).json({ message: messages.ORDER_DELETED })
  } catch (error) {
    console.log(error)
    return res.status(500).json({ message: messages.INTERNAL_ERROR })
  }
}

export const getUserOrders = async (req, res) => {
  try {
    const orders = await ConfirmOrder.find({ userID: req.user.id }).sort({ createdAt: -1 })
    return res.status(200).json(orders)
  } catch (error) {
    console.log(error)
    return res.status(500).json({ message: messages.INTERNAL_ERROR })
  }
}

export const getAllOrders = async (req, res) => {
  const { offset = 1, limit = 10 } = req.query
  const startIndex = (offset - 1) * limit
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

    const totalCount = await ConfirmOrder.countDocuments(filters.length ? { $and: filters } : {})

    return res.status(200).json({
      data: orders,
      totalCount
    })
  } catch (error) {
    console.log(error)
    return res.status(500).json({ message: messages.INTERNAL_ERROR })
  }
}

export const changeOrderStatus = async (req, res) => {
  const { status } = req.body
  const { id } = req.params

  if (!mongoose.isValidObjectId(id)) {
    return res.status(402).json({ message: messages.NOT_FOUND })
  }
  if (!status) {
    return res.status(402).json({ message: messages.VALIDATION_ERROR })
  }

  try {
    const order = await ConfirmOrder.findByIdAndUpdate(id, { orderStatus: status }, { new: true })
    const emailHTML = createOrderTemplate(order)

    sendEmail({
      to: order.userInfo.email,
      subject: 'Order Confirmation',
      emailHtml: emailHTML,
      emailText: emailHTML
    })

    return res.status(200).json({ message: messages.ORDER_STATUS_UPDATED })
  } catch (error) {
    console.log(error)
    return res.status(500).json({ message: messages.INTERNAL_ERROR })
  }
}

export const getOrderInfo = async (req, res) => {
  try {
    const order = await ConfirmOrder.findById(req.params.id)
    return res.status(200).json(order)
  } catch (error) {
    console.log(error)
    return res.status(500).json({ message: messages.INTERNAL_ERROR })
  }
}
