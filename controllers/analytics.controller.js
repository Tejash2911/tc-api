import ConfirmOrder from '../models/confirmOrder.model.js'
import Product from '../models/product.model.js'

export const getTopProducts = async (req, res) => {
  const condition = req.query.for

  // i don't need much data if i am getting for charts that's why added conditionally project and add field
  const project =
    condition !== 'chart'
      ? { img: 1, title: 1, purchasedCount: 1, price: 1, _id: 0 }
      : { title: 1, purchasedCount: 1, _id: 0 }
  const addField = condition !== 'chart' ? { revenue: { $multiply: ['$price', '$purchasedCount'] } } : {}

  try {
    const products = await Product.aggregate([
      { $sort: { purchasedCount: -1 } },
      { $limit: 5 },
      { $project: project },
      { $addFields: addField }
    ])
    res.status(200).json(products)
  } catch (error) {
    console.log(error)
    res.status(500).json({ message: 'internal server error' })
  }
}

export const getSales = async (req, res) => {
  try {
    const data = await ConfirmOrder.aggregate([
      {
        $group: {
          _id: null,
          totalRevenue: { $sum: '$price' },
          totalProductsSold: { $sum: { $size: '$products' } },
          averageOrderValue: { $avg: '$price' },
          maxOrderValue: { $max: '$price' }
        }
      }
    ])

    res.status(200).json(data)
  } catch (error) {
    console.log(error)
    res.status(500).json({ message: 'internal server error' })
  }
}

export const getPopularSizeColor = async (req, res) => {
  try {
    const pipeline = [
      { $unwind: '$products' },
      {
        $group: {
          _id: { size: '$products.size', color: '$products.color' },
          count: { $sum: '$products.quantity' }
        }
      },
      { $sort: { count: -1 } },
      {
        $project: {
          _id: 0,
          size: '$_id.size',
          color: '$_id.color',
          count: 1
        }
      },
      {
        $facet: {
          sizes: [{ $group: { _id: '$size', count: { $sum: '$count' } } }, { $sort: { count: -1 } }, { $limit: 5 }],
          colors: [{ $group: { _id: '$color', count: { $sum: '$count' } } }, { $sort: { count: -1 } }, { $limit: 5 }]
        }
      }
    ]

    const results = await ConfirmOrder.aggregate(pipeline)

    res.status(200).json(results)
  } catch (error) {
    console.error(error)
  }
}

export const getOrdersForStats = async (req, res) => {
  try {
    const results = await ConfirmOrder.aggregate([
      {
        $group: {
          _id: null,
          pending: {
            $sum: {
              $cond: [
                //cond takes 3 arguments condition , if, else or i can say like Ternary operator
                { $eq: ['$orderStatus', 'pending'] },
                1,
                0
              ]
            }
          },
          processing: {
            $sum: {
              $cond: [
                //cond takes 3 arguments condition , if, else or i can say like Ternary operator
                { $eq: ['$orderStatus', 'processing'] },
                1,
                0
              ]
            }
          },
          delivered: {
            $sum: {
              $cond: [
                //cond takes 3 arguments condition , if, else or i can say like Ternary operator
                { $eq: ['$orderStatus', 'delivered'] },
                1,
                0
              ]
            }
          }
        }
      }
    ])
    res.status(200).json(results)
  } catch (error) {
    console.log(error)
    res.status(500).json({ message: 'internal server error' })
  }
}

export const getOrderPriceForStats = async (req, res) => {
  const today = new Date()
  today.setHours(0, 0, 0, 0) //resetting todays time to 0  it takes sethours(hour, minutes, seconds ,milliseconds)
  const month = new Date()
  month.setDate(0) //resetting month time to 0  it takes sethours(date)
  try {
    const results = await ConfirmOrder.aggregate([
      {
        $group: {
          _id: null,
          today: {
            $sum: {
              $cond: [{ $gte: ['$createdAt', today] }, '$price', 0]
            }
          },
          month: {
            $sum: {
              $cond: [{ $gte: ['$createdAt', month] }, '$price', 0]
            }
          },
          allTime: { $sum: '$price' }
        }
      }
    ])
    res.status(200).json(results)
  } catch (error) {
    console.log(error)
    res.status(500).json({ message: 'internal server error' })
  }
}

export const getTopCategories = async (req, res) => {
  try {
    const results = await Product.aggregate([
      {
        $group: {
          _id: '$categories',
          count: { $sum: '$purchasedCount' }
        }
      },
      { $unwind: '$_id' },
      { $group: { _id: '$_id', count: { $sum: '$count' } } },
      { $project: { _id: 0, title: '$_id', purchasedCount: '$count' } },
      { $sort: { count: -1 } },
      { $limit: 10 }
    ])
    res.status(200).json(results)
  } catch (error) {
    console.log(error)
    res.status(500).json({ message: 'internal server error' })
  }
}
