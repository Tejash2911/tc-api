import express from 'express'
import {
  getOrderPriceForStats,
  getOrdersForStats,
  getPopularSizeColor,
  getSales,
  getTopCategories,
  getTopProducts
} from '../controllers/analytics.controller.js'

const router = express.Router()

// get top products for chart
router.get('/top-products', getTopProducts)

// Sales statistics route
router.get('/sales', getSales)

// get popular size and color for chart
router.get('/popular-size-color', getPopularSizeColor)

// get orders for stats
router.get('/order', getOrdersForStats)

// get order price for stats
router.get('/order-price', getOrderPriceForStats)

// get top categories for chart
router.get('/top-cat', getTopCategories)

export default router
