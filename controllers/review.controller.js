import mongoose from 'mongoose'
import Review from '../models/review.model.js'

export const addReview = async (req, res) => {
  const { review, rating } = req.body
  // 1) Check if user entered all fields
  if (!review && !rating) {
    return res.status(400).json({ success: false, message: 'All fields ae Required' })
  }

  if (rating < 1) {
    return res.status(400).json({ success: false, message: 'Rating cant be less then One' })
  }

  try {
    // 2) Check if the user make a review before on that product
    let checkUser = await Review.find({ user: req.user.id, product: req.params.productid })
    console.log(checkUser.length)
    if (checkUser.length !== 0) {
      return res.status(400).json({ success: 'Error', message: 'Only One Review is allowed Per user' })
    }

    //create review
    const newReview = await Review.create({
      user: req.user.id,
      product: req.params.productid,
      rating,
      review
    })
    res.status(201).json({ success: true, message: 'your Review is Successfully added' })
  } catch (error) {
    console.log(error)
    res.status(500).json({ success: false, message: 'internal server error' })
  }
}

export const getReviews = async (req, res) => {
  try {
    const productId = req.params.id
    if (!productId || !mongoose.Types.ObjectId.isValid(productId)) {
      return res.status(404).json({ message: 'Invalid Product ID' })
    }

    const review = await Review.aggregate([
      { $match: { product: new mongoose.Types.ObjectId(productId) } },
      {
        $lookup: {
          from: 'users',
          localField: 'user',
          foreignField: '_id',
          as: 'user'
        }
      },
      {
        $addFields: {
          upVotesLength: { $size: '$upVotes' }
        }
      },
      { $sort: { upVotesLength: -1 } },
      { $project: { user: 1, review: 1, rating: 1, createdAt: 1, upVotesLength: 1 } },
      { $unwind: '$user' }
    ])

    res.status(200).json(review)
  } catch (error) {
    console.error(error.message) // add some logging for debugging
    res.status(500).json({ message: 'Internal Server Error' })
  }
}

export const abuseReview = async (req, res) => {
  try {
    // Find the review with the matching id
    const dbReview = await Review.findOne({
      _id: mongoose.Types.ObjectId(req.params.id)
    })
    if (!dbReview) {
      return res.status(404).json({ success: false, message: 'review not found' })
    }
    // If the user has already reported the review, return error message
    if (dbReview.abuseReports.some(vote => vote.userID.toString() === req.user.id)) {
      return res.status(400).json({ success: false, message: 'you can not report more then once' })
    }
    // If the user is trying to reports his own review, return error message
    if (dbReview.user.toString() === req.user.id) {
      return res.status(400).json({ success: false, message: 'you can not report your own review' })
    }
    // Update the review and add the user's report
    await Review.findByIdAndUpdate(req.params.id, { $push: { abuseReports: { userID: req.user.id } } }, { new: true })
    return res
      .status(200)
      .json({ success: true, message: 'Thank you for your contribution, your response has been recorded' })
  } catch (err) {
    return res.status(500).json({ success: false, message: 'something went wrong' })
  }
}

export const upvoteReview = async (req, res) => {
  try {
    // Find the review with the matching id
    const dbReview = await Review.findOne({
      _id: mongoose.Types.ObjectId(req.params.id)
    })
    console.log(dbReview)
    if (!dbReview) {
      return res.status(404).json({ success: false, message: 'review not found' })
    }
    // If the user has already up voted the review, return error message

    if (dbReview.upVotes.some(vote => vote.userID.toString() === req.user.id)) {
      return res.status(400).json({ success: false, message: 'you can not upvote more then once' })
    }
    // If the user is trying to upvote his own review, return error message
    if (dbReview.user.toString() === req.user.id) {
      return res.status(400).json({ success: false, message: 'you can not upvote your own review' })
    }
    // Update the review and add the user's upvote
    await Review.findByIdAndUpdate(req.params.id, { $push: { upVotes: { userID: req.user.id } } }, { new: true })
    return res
      .status(200)
      .json({ success: true, message: 'Thank you for your contribution, your response has been recorded' })
  } catch (err) {
    console.log(err)
    return res.status(500).json({ success: false, message: 'something went wrong' })
  }
}
