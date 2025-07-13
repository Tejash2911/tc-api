import mongoose from 'mongoose'
import Product from '../models/product.model.js'
import { deleteImageFromCloudinary, uploadImageToCloudinary } from '../utils/cloudinaryMethods.js'
import { messages } from '../utils/constants.js'

export const addProduct = async (req, res) => {
  const id = new mongoose.Types.ObjectId()
  try {
    const image = await uploadImageToCloudinary(req.body.img, id)
    req.body.img = image.url

    const savedProduct = await Product.create({ ...req.body, _id: id })

    return res.status(201).json({ message: messages.PRODUCT_CREATED, data: savedProduct })
  } catch (error) {
    console.log(error)
    return res.status(500).json({ message: messages.INTERNAL_ERROR })
  }
}

export const updateProduct = async (req, res) => {
  try {
    if (req.body.img.split('/')[0] === 'data:image') {
      const image = await uploadImageToCloudinary(req.body.img, req.body._id)
      console.log(image)
      req.body.img = image.url
    }
    const updateProduct = await Product.findByIdAndUpdate(
      req.params.id,
      {
        $set: req.body
      },
      { new: true }
    )
    return res.status(200).json({ message: messages.PRODUCT_UPDATED, data: updateProduct })
  } catch (error) {
    console.log(error)
    return res.status(500).json({ message: messages.INTERNAL_ERROR })
  }
}

export const deleteProduct = async (req, res) => {
  const id = req.params.id
  if (!mongoose.isValidObjectId(id)) {
    return res.status(404).json({ message: messages.NOT_FOUND })
  }
  try {
    await Product.findByIdAndDelete(id)
    const result = await deleteImageFromCloudinary(id)
    return res.status(200).json({ message: messages.PRODUCT_DELETED })
  } catch (error) {
    console.log(error)
    return res.status(500).json({ message: messages.INTERNAL_ERROR })
  }
}

export const getProductInfo = async (req, res) => {
  if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
    return res.status(404).json({ message: messages.NOT_FOUND })
  }

  try {
    const savedProducts = await Product.findById(req.params.id)
    if (!savedProducts) {
      return res.status(404).json({ message: messages.NOT_FOUND })
    }
    return res.status(200).json(savedProducts)
  } catch (error) {
    console.log(error)
    return res.status(500).json({ message: messages.INTERNAL_ERROR })
  }
}

export const getAllProducts = async (req, res) => {
  // Parse and default offset and limit
  const offset = parseInt(req.query.offset, 10) || 1
  const limit = parseInt(req.query.limit, 10) || 10
  const skip = (offset - 1) * limit

  // Extract query parameters
  const qCategory = req.query.category
  const qSort = req.query.sort
  const qColor = req.query.color
  const qSize = req.query.size
  const qs = req.query.search

  try {
    // Base query
    let query = Product.find()
    let filter = {}

    // Build filters
    const filters = []

    // Search filter
    if (qs) {
      filters.push({
        $or: [
          { title: { $regex: qs, $options: 'i' } },
          { productNo: { $regex: qs, $options: 'i' } },
          { desc: { $regex: qs, $options: 'i' } },
          { categories: { $regex: qs, $options: 'i' } }
        ]
      })
    }

    // Category filter
    if (qCategory) {
      filters.push({ categories: { $in: [qCategory] } })
    }

    // Color filter
    if (qColor) {
      filters.push({ color: { $in: [qColor] } })
    }

    // Size filter
    if (qSize) {
      filters.push({ size: { $in: [qSize] } })
    }

    // Apply filters if any exist
    if (filters.length > 0) {
      filter = { $and: filters }
    }

    // Apply filters to query
    query = query.find(filter)

    // Sorting logic
    switch (qSort) {
      case 'newest':
        query.sort({ createdAt: -1, _id: -1 }) // Add _id as secondary sort
        break
      case 'price-asc':
        query.sort({ price: 1, _id: 1 }) // Add _id as secondary sort
        break
      case 'price-desc':
        query.sort({ price: -1, _id: -1 }) // Add _id as secondary sort
        break
      case 'top-purchased':
        query.sort({ purchasedCount: -1, _id: -1 }) // Add _id as secondary sort
        break
      case 'top-rated':
        query.sort({ ratingsAverage: -1, ratingsQuantity: -1, _id: -1 }) // Add _id as secondary sort
        break
      case 'top-reviewed':
        query.sort({ ratingsQuantity: -1, _id: -1 }) // Add _id as secondary sort
        break
      default:
        // No sorting if the query doesn't match known values
        query.sort({ _id: -1 }) // Default sort by _id
        break
    }

    // Apply pagination
    query.skip(skip).limit(limit)

    // Fetch filtered products
    const products = await query.exec()

    // Count documents with filters
    const totalCount = await Product.countDocuments(filter)

    return res.status(200).json({ data: products, totalCount })
  } catch (error) {
    console.log(error)
    return res.status(500).json({ message: messages.INTERNAL_ERROR })
  }
}

export const searchProducts = async (req, res) => {
  const s = req.params.s
  if (!s) {
    return res.status(404).json({ message: messages.NOT_FOUND })
  }
  try {
    const products = await Product.find(
      {
        $or: [
          { title: { $regex: s, $options: 'i' } },
          { productNo: { $regex: s, $options: 'i' } },
          { desc: { $regex: s, $options: 'i' } },
          { categories: { $in: [s] } }
        ]
      },
      {
        title: 1,
        _id: 1
      }
    ).limit(5)

    return res.status(200).json(products)
  } catch (error) {
    console.log(error)
    return res.status(500).json({ message: messages.INTERNAL_ERROR })
  }
}
