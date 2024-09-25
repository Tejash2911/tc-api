import express from 'express'
import stripePackage from 'stripe'

const stripe = stripePackage(process.env.STRIPE_SECRET_KEY)
const router = express.Router()

router.post('/payment', async (req, res) => {
  console.log('api hied')
  await stripe.paymentIntents.create(
    {
      source: req.body.tokenID,
      amount: req.body.amount,
      currency: 'INR'
    },
    (stripErr, stripRes) => {
      if (stripErr) {
        res.status(500).json(stripErr)
      } else {
        res.status(200).json(stripRes)
      }
    }
  )
})

export default router
