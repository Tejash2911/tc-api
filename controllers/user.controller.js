import mongoose from 'mongoose'
import User from '../models/user.model.js'
import { decryptPass, encryptPass } from '../utils/pass.js'

export const deleteUser = async (req, res) => {
  try {
    await User.findByIdAndDelete(req.params.id)
    res.status(200).json('user deleted')
  } catch (err) {
    res.status(500).json(err)
  }
}

export const getUserInfo = async (req, res) => {
  try {
    const sUser = await User.findById(req.params.id)
    res.status(200).json(sUser)
  } catch (err) {
    res.status(500).json(err)
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
  } catch (err) {
    console.log(err)
    res.status(500).json({ err: 'Internal server error' })
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
    res.status(200).json(data)
  } catch (err) {
    res.status(500).json(err)
  }
}

export const updateUser = async (req, res) => {
  try {
    console.log('me hit')
    if (req.body.password) {
      if (!req.body.currentPass) return res.status(400).json({ error: 'Old password Is Required!!' })
      const oldDbPass = await User.findById(req.user.id, { password: 1, _id: 0 })
      const decryptedOldPass = decryptPass(oldDbPass.password)

      if (decryptedOldPass !== req.body.currentPass)
        return res.status(401).json({ error: "Old password does'nt matched!!" })
      req.body.password = encryptPass(req.body.password)
    }
    const user = await User.findByIdAndUpdate(req.params.id, { $set: req.body }, { new: true })
    console.log('me hit3')
    res.status(200).json(user)
  } catch (err) {
    res.status(500).json({ error: 'failed to update user' })
    console.log(err)
  }
}
