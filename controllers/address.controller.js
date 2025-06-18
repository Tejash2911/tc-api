import Address from '../models/address.model.js'
import { messages } from '../utils/constants.js'

export const getUserAddress = async (req, res) => {
  try {
    if (!req.user || !req.user.id) {
      return res.status(401).json({ message: messages.UNAUTHORIZED })
    }

    const address = await Address.findOne({ userID: req.user.id })

    if (!address) {
      return res.status(404).json({ message: messages.NOT_FOUND })
    }

    return res.status(200).json(address)
  } catch (error) {
    console.log(error)
    return res.status(500).json({ message: messages.INTERNAL_ERROR })
  }
}

export const saveUserAddress = async (req, res) => {
  const { street, city, state, zip, country, mobile } = req.body

  if (!street && !city && !state && !zip && !country && !mobile) {
    return res.status(400).json({ message: messages.BAD_REQUEST })
  }
  const payload = { userID: req.user.id, address: req.body }

  const isUpdate = req.query.update

  try {
    const address = isUpdate
      ? await Address.findOneAndUpdate({ userID: req.user.id }, payload)
      : await Address.create(payload)

    return res.status(200).json({ message: messages.ADDRESS_CREATED })
  } catch (error) {
    console.log(error)
    return res.status(500).json({ message: messages.INTERNAL_ERROR })
  }
}

export const updateUserAddress = async (req, res) => {
  const { street, city, state, zip, country, mobile } = req.body

  if (!street && !city && !state && !zip && !country && !mobile) {
    return res.status(400).json({ message: messages.BAD_REQUEST })
  }

  try {
    const address = await Address.findOneAndUpdate(
      { userID: req.user.id },
      { $set: req.body },
      { new: true, runValidators: true }
    )

    if (!address) {
      return res.status(404).json({ message: messages.NOT_FOUND })
    }

    return res.status(200).json({ message: messages.ADDRESS_UPDATED })
  } catch (error) {
    console.log(error)
    return res.status(500).json({ message: messages.INTERNAL_ERROR })
  }
}
