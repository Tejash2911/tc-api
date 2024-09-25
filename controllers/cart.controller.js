import Cart from '../models/cart.model.js'

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

        console.log('cart updated')
        return res
          .status(200)
          .json({ status: 'success', productExisted: true, message: 'Product Quantity updated to Cart' })

        // if user cart does'nt have that product
      } else {
        console.log('product is not duplicate')
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

        return res.status(200).json({ status: 'success', productExisted: false, message: 'Product added to Cart' })
      }
    } else {
      const newCart = Cart({ ...req.body, userID: req.user.id })
      await newCart.save()
      return res.status(200).json({ status: 'success', productExisted: false, message: 'Product added to Cart' })
    }
  } catch (err) {
    res.status(500).json({ status: 'failed', message: 'Internal Server Error' })
    console.log(err)
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
    res.status(200).json(removedArrayBrackets)
  } catch (error) {
    console.log(error)
    res.status(500).json({ message: 'internal server error' })
  }
}

export const updateCartQty = async (req, res) => {
  try {
    if (req.params.newQuantity === '0') {
      console.log('quantity is 0')
      await Cart.updateOne({ userID: req.user.id }, { $pull: { products: { productID: req.params.productNumber } } })
    } else {
      console.log('quantity is not 0')
      await Cart.updateOne(
        { userID: req.user.id, 'products.productID': req.params.productNumber },
        { $set: { 'products.$.quantity': req.params.newQuantity } }
      )
    }

    res.status(200).json({ status: 'success', message: 'Product Quantity Updated Successfully' })
  } catch (error) {
    console.log(error)
    res.status(500).json({ status: 'failed', message: 'Internal Server Error' })
  }
}

export const deleteFromCart = async (req, res) => {
  console.log(req.params.id)
  try {
    await Cart.updateOne({ userID: req.user.id }, { $pull: { products: { productID: req.params.id } } })
    res.status(200).json({ status: 'success', message: 'Product deleted Successfully' })
  } catch (err) {
    console.log(err)
    res.status(500).json({ status: 'failed', message: 'Internal Server Error' })
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
      return res.status(404).json({ success: true, message: 'no products found' })
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

    res.status(200).json({ userID: req.user.id, cartID: carT._id, products: mergedProducts, productFound: true })
  } catch (err) {
    console.log(err)
    res.status(500).json(err)
  }
}

export const getAllCart = async (req, res) => {
  try {
    const cart = await Cart.find()

    res.status(200).json(cart)
  } catch (err) {
    res.status(500).json(err)
  }
}
