import mongoose from 'mongoose'
import Address from '../models/address.model.js'

export const getUserAddress = async (req, res) => {
  try {
    if (!req.user || !req.user.id) {
      return res.status(401).json({ message: 'User not authenticated' })
    }

    const address = await Address.findOne({ userID: req.user.id })

    if (!address) {
      return res.status(404).json({ message: 'Address not found' })
    }

    res.status(200).json(address)
  } catch (error) {
    console.error('Error fetching user address:', error)
    res.status(500).json({ message: 'Internal Server Error' })
  }
}

export const saveUserAddress = async (req, res) => {
  const { street, city, state, zip, country, mobile } = req.body

  if (!street && !city && !state && !zip && !country && !mobile) {
    return res.status(400).json({ ok: false, message: 'all fields are required' })
  }
  const payload = { userID: req.user.id, address: req.body }

  const isUpdate = req.query.update

  try {
    const address = isUpdate
      ? await Address.findOneAndUpdate({ userID: req.user.id }, payload)
      : await Address.create(payload)

    return res.status(200).json({ ok: true, address })
  } catch (error) {
    if (error.code === 11000) {
      return res.status(500).json({ ok: false, message: 'We already have your Address in our system' })
    }
    console.log(error)
    return res.status(500).json({ ok: false, message: 'internal server error' })
  }
}

export const updateUserAddress = async (req, res) => {
  const { street, city, state, zip, country, mobile } = req.body

  if (!street && !city && !state && !zip && !country && !mobile) {
    return res.status(400).json({ ok: false, message: 'At least one field is required to update the address' })
  }

  try {
    const address = await Address.findOneAndUpdate(
      { userID: req.user.id },
      { $set: req.body }, // Only update the fields provided in req.body
      { new: true, runValidators: true } // Return the updated document
    )

    if (!address) {
      return res.status(404).json({ ok: false, message: 'Address not found' })
    }

    return res.status(200).json({ ok: true, address })
  } catch (error) {
    console.error('Error updating user address:', error)
    return res.status(500).json({ ok: false, message: 'Internal Server Error' })
  }
}
