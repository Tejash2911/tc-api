import jwt from 'jsonwebtoken'
import { config } from '../config/config.js'
import { messages } from '../utils/constants.js'

export const verifyToken = (req, res, next) => {
  const token = req.headers.token
  if (token) {
    jwt.verify(token, config.jwtSecretKey, (error, user) => {
      if (error) {
        return res.status(401).json({ message: messages.UNAUTHORIZED })
      } else {
        req.user = user
        next()
      }
    })
  } else {
    return res.status(401).json({ message: messages.UNAUTHORIZED })
  }
}

export const verifyUserWithToken = (req, res, next) => {
  verifyToken(req, res, () => {
    if (req.user.id === req.params.id || req.user.isAdmin === true) {
      next()
    } else {
      return res.status(401).json({ message: messages.UNAUTHORIZED })
    }
  })
}

export const verifyAdminWithToken = (req, res, next) => {
  verifyToken(req, res, () => {
    if (req.user.isAdmin === true) {
      next()
    } else {
      return res.status(401).json({ message: messages.UNAUTHORIZED })
    }
  })
}
