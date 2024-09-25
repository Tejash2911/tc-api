import mongoose from 'mongoose'
import Product from './product.model.js'

const reviewSchema = new mongoose.Schema(
  {
    review: {
      type: String,
      required: [true, 'Review cannot be empty!']
    },
    rating: {
      type: Number,
      min: 1,
      max: 5
    },
    product: {
      type: mongoose.Types.ObjectId,
      ref: 'Product',
      required: [true, 'Review must belong to a product']
    },
    user: {
      type: mongoose.Types.ObjectId,
      ref: 'User',
      required: [true, 'Review must belong to a user']
    },
    upVotes: [{ userID: { type: mongoose.Types.ObjectId, ref: 'User' } }],
    abuseReports: [{ userID: { type: mongoose.Types.ObjectId, ref: 'User' } }]
  },
  {
    timestamps: true
  }
)

reviewSchema.post('save', function () {
  reviewSchema.static.calcAvgRating(this.product)
})

//calculating avg
reviewSchema.static.calcAvgRating = async function (productID) {
  console.log('calc run')
  const stats = await Review.aggregate([
    { $match: { product: productID } },
    {
      $group: {
        _id: '$product',
        numberOfRating: { $sum: 1 },
        avg: { $avg: '$rating' }
      }
    }
  ])

  //updating products based on any action on reviews
  if (stats.length > 0) {
    await Product.findByIdAndUpdate(productID, {
      ratingsQuantity: stats[0].numberOfRating,
      ratingsAverage: stats[0].avg
    })
  } else {
    await Product.findByIdAndUpdate(productID, {
      ratingsQuantity: 0,
      ratingsAverage: 4.5
    })
  }
}

const Review = mongoose.model('Review', reviewSchema)

export default Review
