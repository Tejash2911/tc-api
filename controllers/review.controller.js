import mongoose from 'mongoose'
import Review from '../models/review.model.js'
import { messages } from '../utils/constants.js'

export const addReview = async (req, res) => {
  const { review, rating } = req.body
  // 1) Check if user entered all fields
  if (!review && !rating) {
    return res.status(400).json({ message: messages.VALIDATION_ERROR })
  }

  if (rating < 1) {
    return res.status(400).json({ message: messages.VALIDATION_ERROR })
  }

  try {
    // 2) Check if the user make a review before on that product
    let checkUser = await Review.find({ user: req.user.id, product: req.params.productId })
    if (checkUser.length !== 0) {
      return res.status(400).json({ message: messages.ONLY_ONE_ALLOWED })
    }

    //create review
    const newReview = await Review.create({
      user: req.user.id,
      product: req.params.productId,
      rating,
      review
    })
    return res.status(201).json({ message: messages.REVIEW_CREATED })
  } catch (error) {
    console.log(error)
    return res.status(500).json({ message: messages.INTERNAL_ERROR })
  }
}

export const getReviews = async (req, res) => {
  try {
    const productId = req.params.id
    if (!productId || !mongoose.Types.ObjectId.isValid(productId)) {
      return res.status(404).json({ message: messages.NOT_FOUND })
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

    return res.status(200).json(review)
  } catch (error) {
    console.log(error)
    return res.status(500).json({ message: messages.INTERNAL_ERROR })
  }
}

export const abuseReview = async (req, res) => {
  try {
    // Find the review with the matching id
    const dbReview = await Review.findOne({
      _id: new mongoose.Types.ObjectId(req.params.id)
    })
    if (!dbReview) {
      return res.status(404).json({ message: messages.NOT_FOUND })
    }
    // If the user has already reported the review, return error message
    if (dbReview.abuseReports.some(vote => vote.userID.toString() === req.user.id)) {
      return res.status(200).json({ message: messages.ONLY_ONE_REPORT })
    }
    // If the user is trying to reports his own review, return error message
    if (dbReview.user.toString() === req.user.id) {
      return res.status(200).json({ message: messages.CAN_NOT_REPORT_OWN_REVIEW })
    }
    // Update the review and add the user's report
    await Review.findByIdAndUpdate(req.params.id, { $push: { abuseReports: { userID: req.user.id } } }, { new: true })
    return res.status(200).json({ message: messages.REVIEW_REPORTED })
  } catch (error) {
    console.log(error)
    return res.status(500).json({ message: messages.INTERNAL_ERROR })
  }
}

export const upvoteReview = async (req, res) => {
  try {
    // Find the review with the matching id
    const dbReview = await Review.findOne({
      _id: new mongoose.Types.ObjectId(req.params.id)
    })
    if (!dbReview) {
      return res.status(404).json({ message: messages.NOT_FOUND })
    }
    // If the user has already up voted the review, return error message

    if (dbReview.upVotes.some(vote => vote.userID.toString() === req.user.id)) {
      return res.status(200).json({ message: messages.ONLY_ONE_UPVOTE })
    }
    // If the user is trying to upvote his own review, return error message
    if (dbReview.user.toString() === req.user.id) {
      return res.status(200).json({ message: messages.CAN_NOT_UPVOTE_OWN_REVIEW })
    }
    // Update the review and add the user's upvote
    await Review.findByIdAndUpdate(req.params.id, { $push: { upVotes: { userID: req.user.id } } }, { new: true })
    return res.status(200).json({ message: messages.REVIEW_UPVOTED })
  } catch (error) {
    console.log(error)
    return res.status(500).json({ message: messages.INTERNAL_ERROR })
  }
}
