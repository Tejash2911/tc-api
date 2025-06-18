import Cart from '../models/cart.model.js'
import { messages } from '../utils/constants.js'

export const addToCart = async (req, res) => {
  try {
    const cart = await Cart.findOne({ userID: req.user.id })

    //if that user cart exist
    if (cart) {
      let itemIndex = cart.products.findIndex(p => `${p.productID}` === `${req.body.products[0].productID}`)
      console.log(`duplicate index : ${itemIndex}`)

      //if that product exist on cart.
      if (itemIndex > -1) {
        let productItem = cart.products[itemIndex]
        const newQuantity = parseInt(productItem.quantity) + parseInt(req.body.products[0].quantity)
        productItem.quantity = newQuantity
        cart.products[itemIndex] = productItem

        await cart.save()

        return res
          .status(200)
          .json({ status: 'success', productExisted: true, message: messages.PRODUCT_QUANTITY_UPDATED })

        // if user cart does'nt have that product
      } else {
        await Cart.findOneAndUpdate(
          { userID: req.user.id },
          {
            //pushing new product to array
            $push: {
              products: req.body.products
            }
          },
          { new: true }
        )

        return res.status(200).json({ productExisted: false, message: messages.PRODUCT_CREATED })
      }
    } else {
      const newCart = Cart({ ...req.body, userID: req.user.id })
      await newCart.save()
      return res.status(200).json({ productExisted: false, message: messages.PRODUCT_CREATED })
    }
  } catch (error) {
    console.log(error)
    return res.status(500).json({ message: messages.INTERNAL_ERROR })
  }
}

export const getCartSize = async (req, res) => {
  try {
    const cartSize = await Cart.aggregate([
      { $match: { userID: req.user.id } },
      {
        $addFields: {
          size: { $size: '$products' }
        }
      },
      { $project: { size: 1, _id: 0 } }
    ])
    const [removedArrayBrackets] = cartSize
    return res.status(200).json(removedArrayBrackets)
  } catch (error) {
    console.log(error)
    return res.status(500).json({ message: messages.INTERNAL_ERROR })
  }
}

export const updateCartQty = async (req, res) => {
  try {
    if (req.params.newQuantity === '0') {
      await Cart.updateOne({ userID: req.user.id }, { $pull: { products: { productID: req.params.productNumber } } })
    } else {
      await Cart.updateOne(
        { userID: req.user.id, 'products.productID': req.params.productNumber },
        { $set: { 'products.$.quantity': req.params.newQuantity } }
      )
    }

    return res.status(200).json({ message: messages.PRODUCT_QUANTITY_UPDATED })
  } catch (error) {
    console.log(error)
    return res.status(500).json({ message: messages.INTERNAL_ERROR })
  }
}

export const deleteFromCart = async (req, res) => {
  try {
    await Cart.updateOne({ userID: req.user.id }, { $pull: { products: { productID: req.params.id } } })
    return res.status(200).json({ message: messages.PRODUCT_DELETED })
  } catch (error) {
    console.log(error)
    return res.status(500).json({ message: messages.INTERNAL_ERROR })
  }
}

export const getUserCart = async (req, res) => {
  try {
    const cart = await Cart.aggregate([
      { $match: { userID: req.user.id } },
      {
        $lookup: {
          from: 'products',
          localField: 'products.productID',
          foreignField: '_id',
          as: 'productInfo'
        }
      },

      {
        $project: {
          userID: 1,
          products: 1,
          productInfo: {
            title: 1,
            productNo: 1,
            _id: 1,
            desc: 1,
            img: 1,
            price: 1
          }
        }
      }
    ])
    if (!cart.length) {
      return res.status(404).json({ message: messages.NOT_FOUND })
    }
    const [carT] = cart //removing array brackets
    const mergedProducts = []
    carT.products.forEach(product => {
      //merging user cart product with db product info like price n all which are dynamic
      const productInfo = carT.productInfo.find(info => {
        return `${info._id}` === `${product.productID}` //converted to string because when i was checking === it was checking the reference on the memory not value bcz its an Objectid is an reference ty[e]
      })
      mergedProducts.push({ ...product, ...productInfo })
    })

    return res.status(200).json({ userID: req.user.id, cartID: carT._id, products: mergedProducts, productFound: true })
  } catch (error) {
    console.log(error)
    return res.status(500).json({ message: messages.INTERNAL_ERROR })
  }
}

export const getAllCart = async (req, res) => {
  try {
    const cart = await Cart.find()

    return res.status(200).json(cart)
  } catch (error) {
    console.log(error)
    return res.status(500).json({ message: messages.INTERNAL_ERROR })
  }
}
