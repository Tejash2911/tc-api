import { createResetEmailHTML } from '../helpers/orderConfirmation.js'
import sendEmail from '../helpers/sendEmail.js'
import User from '../models/user.model.js'
import CryptoJS from 'crypto-js'
import jwt from 'jsonwebtoken'
import crypto from 'crypto'
import { config } from '../config/config.js'
import { messages } from '../utils/constants.js'

export const register = async (req, res) => {
  if (req.body.password.length < 5 || req.body.password.length > 16) {
    return res.status(400).json({ message: messages.VALIDATION_ERROR })
  }
  const newUser = new User({
    firstName: req.body.firstName,
    lastName: req.body.lastName,
    email: req.body.email,
    number: req.body.number,
    password: CryptoJS.AES.encrypt(req.body.password, config.cryptoJsSecretKey.toString()),
    userIP: req.body.userIP
  })
  try {
    const savedUser = await newUser.save()
    const { password, ...others } = savedUser._doc

    const accessToken = jwt.sign(
      {
        id: savedUser._id,
        isAdmin: savedUser.isAdmin
      },
      config.jwtSecretKey,
      { expiresIn: config.jwtSecretExpire || '3d' }
    )

    return res.status(201).json({ ...others, accessToken })
  } catch (error) {
    console.log(error)
    return res.status(500).json({ message: messages.INTERNAL_ERROR })
  }
}

export const login = async (req, res) => {
  console.log(req.body)
  if (!req.body.email || !req.body.password) {
    return res.status(400).json({ message: messages.BAD_REQUEST })
  }

  try {
    const user = await User.findOne({ email: req.body.email })
    if (!user) {
      return res.status(404).json({ message: messages.NOT_FOUND })
    }

    //checking if this login req is for admin
    if (req.body.forAdmin) {
      if (!user.isAdmin) {
        return res.status(404).json({ message: messages.NOT_FOUND })
      }
    }

    //matching pass
    const hashedPass = await CryptoJS.AES.decrypt(user.password, config.cryptoJsSecretKey)
    const pass = await hashedPass.toString(CryptoJS.enc.Utf8)
    console.log(`db pass = ${pass}`)
    console.log(`user pass = ${req.body.password}`)
    if (pass !== req.body.password) {
      return res.status(404).json({ message: messages.NOT_FOUND })
    }

    const accessToken = jwt.sign(
      {
        id: user._id,
        isAdmin: user.isAdmin
      },
      config.jwtSecretKey,
      { expiresIn: config.jwtSecretExpire || '3d' }
    )

    const { password, resetPasswordToken, resetPasswordExpire, ...others } = user._doc
    return res.status(200).json({
      message: messages.LOGIN_SUCCESS,
      data: { ...others, accessToken }
    })
  } catch (error) {
    console.log(error)
    return res.status(500).json({ message: messages.INTERNAL_ERROR })
  }
}

export const forgotPassword = async (req, res) => {
  const email = req.body.email
  if (!email) {
    return res.status(400).json({ message: messages.BAD_REQUEST })
  }

  const resetToken = crypto.randomBytes(20).toString('hex')
  const hashedResetPasswordToken = crypto.createHash('sha256').update(resetToken).digest('hex')
  const expireDate = Date.now() + 10 * 60000

  try {
    //finding if user and updating it
    const user = await User.findOneAndUpdate(
      { email: email },
      {
        resetPasswordToken: hashedResetPasswordToken,
        resetPasswordExpire: expireDate
      }
    )

    if (!user) {
      return res.status(401).json({ message: messages.UNAUTHORIZED })
    }

    //sending email thing
    const resetURl = `${config.frontendUrl}/resetpassword/${resetToken}`

    const emailText = `
      you have requested a password reset
      please go tho this link to reset password
      ${resetURl}
    `
    const emailTemplate = createResetEmailHTML(user.firstName, resetURl)
    try {
      sendEmail({
        to: user.email,
        subject: 'Forgot Password',
        emailHtml: emailTemplate,
        emailText: emailText
      })
    } catch (error) {
      //removing users reset token if its not valid
      await User.findOneAndUpdate(
        { email: email },
        {
          resetPasswordToken: undefined,
          resetPasswordExpire: undefined
        }
      )
      console.log(error)
      return res.status(401).json({ message: messages.UNAUTHORIZED })
    }
    return res.status(200).json({ message: messages.EMAIL_SENT })
  } catch (error) {
    console.log(error)
    return res.status(500).json({ message: messages.INTERNAL_ERROR })
  }
}

export const logout = async (req, res) => {
  // For JWT, we don't need to do anything on the server side
  // The client should clear the token from localStorage/cookies
  return res.status(200).json({ message: messages.LOGOUT_SUCCESS })
}

export const resetPassword = async (req, res) => {
  const hashedResetPasswordToken = crypto.createHash('sha256').update(req.params.resetToken).digest('hex')
  try {
    //validating if this token is valid or not
    const user = await User.findOne({
      resetPasswordToken: hashedResetPasswordToken,
      resetPasswordExpire: { $gt: Date.now() }
    })

    if (!user) {
      return res.status(404).json({ message: messages.NOT_FOUND })
    }

    //checking if user is entering his old password
    const oldPassHAsh = CryptoJS.AES.decrypt(user.password, config.cryptoJsSecretKey)
    const oldPassword = oldPassHAsh.toString(CryptoJS.enc.Utf8)

    const newPassword = req.body.password

    if (oldPassword === newPassword) {
      return res.status(400).json({ message: messages.VALIDATION_ERROR })
    }

    //setting saving new password to mongodb
    user.password = await CryptoJS.AES.encrypt(req.body.password, config.cryptoJsSecretKey.toString())
    user.resetPasswordToken = undefined
    user.resetPasswordExpire = undefined
    await user.save()

    return res.status(200).json({ message: messages.PASSWORD_CHANGED })
  } catch (error) {
    console.log(error)
    return res.status(500).json({ message: messages.INTERNAL_ERROR })
  }
}
