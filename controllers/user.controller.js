import mongoose from 'mongoose'
import User from '../models/user.model.js'
import { decryptPass, encryptPass } from '../utils/pass.js'
import { messages } from '../utils/constants.js'

export const deleteUser = async (req, res) => {
  try {
    await User.findByIdAndDelete(req.params.id)
    return res.status(200).json({ message: messages.USER_DELETED })
  } catch (error) {
    console.log(error)
    return res.status(500).json({ message: messages.INTERNAL_ERROR })
  }
}

export const getUserInfo = async (req, res) => {
  try {
    const sUser = await User.findById(req.params.id)
    return res.status(200).json(sUser)
  } catch (error) {
    console.log(error)
    return res.status(500).json({ message: messages.INTERNAL_ERROR })
  }
}

export const getAllUsersInfo = async (req, res) => {
  // Parse offset and limit from query parameters, defaulting to 1 and 10 respectively
  const offset = parseInt(req.query.offset) || 1
  const limit = parseInt(req.query.limit) || 10
  // Parse search query parameter, if provided
  const search = req.query.search || ''
  const skip = (offset - 1) * limit

  try {
    let filters = []

    if (search) {
      if (mongoose.isValidObjectId(search)) {
        filters.push({ _id: new mongoose.Types.ObjectId(search) })
      } else if (isNaN(search)) {
        filters.push({
          $or: [
            { firstName: { $regex: search, $options: 'i' } },
            { lastName: { $regex: search, $options: 'i' } },
            { email: { $regex: search, $options: 'i' } }
          ]
        })
      } else {
        filters.push({ number: { $eq: Number(search) } })
      }
    }

    let filterQuery = {}
    if (filters.length > 0) filterQuery = { $and: filters }

    // Query for filtered data
    const resUsers = await User.find(filterQuery, { password: 0 }).skip(skip).limit(limit).exec()

    // Query for total count of filtered data
    const totalCount = await User.countDocuments(filterQuery)

    return res.status(200).json({ data: resUsers, totalCount })
  } catch (error) {
    console.log(error)
    return res.status(500).json({ message: messages.INTERNAL_ERROR })
  }
}

export const getUserStats = async (req, res) => {
  const date = new Date()
  const lastYear = new Date(date.setFullYear(date.getFullYear() - 1))
  //very confusing about dates
  try {
    const data = await User.aggregate([
      { $match: { createdAt: { $gte: lastYear } } },
      {
        $project: {
          month: { $month: '$createdAt' }
        }
      },
      {
        $group: {
          _id: '$month',
          total: { $sum: 1 }
        }
      }
    ])
    return res.status(200).json(data)
  } catch (error) {
    console.log(error)
    return res.status(500).json({ message: messages.INTERNAL_ERROR })
  }
}

export const updateUser = async (req, res) => {
  try {
    if (req.body.password) {
      if (!req.body.currentPass) {
        return res.status(400).json({ message: messages.VALIDATION_ERROR })
      }
      const oldDbPass = await User.findById(req.user.id, { password: 1, _id: 0 })
      const decryptedOldPass = decryptPass(oldDbPass.password)

      if (decryptedOldPass !== req.body.currentPass) {
        return res.status(400).json({ message: messages.VALIDATION_ERROR })
      }
      req.body.password = encryptPass(req.body.password)
    }
    const user = await User.findByIdAndUpdate(req.params.id, { $set: req.body }, { new: true })
    return res.status(200).json({ message: messages.USER_UPDATED })
  } catch (error) {
    console.log(error)
    return res.status(500).json({ message: messages.INTERNAL_ERROR })
  }
}
