import jwt from 'jsonwebtoken'
import { config } from '../config/config.js'

export const verifyToken = (req, res, next) => {
  const authHeader = req.headers.token
  if (authHeader) {
    const token = authHeader.split(' ')[1]
    jwt.verify(token, config.jwtSecretKey, (err, user) => {
      if (err) {
        res.status(403).json({ message: 'token is not valid' })
      } else {
        req.user = user
        next()
      }
    })
  } else {
    res.status(401).json({ message: 'You are not Logged in' })
  }
}

export const verifyUserWithToken = (req, res, next) => {
  verifyToken(req, res, () => {
    if (req.user.id === req.params.id || req.user.isAdmin === true) {
      next()
    } else {
      res.status(403).json({ message: 'you are not allowed to do that ' })
    }
  })
}

export const verifyAdminWithToken = (req, res, next) => {
  verifyToken(req, res, () => {
    if (req.user.isAdmin === true) {
      next()
    } else {
      res.status(403).json({ message: 'you are not allowed to do that' })
    }
  })
}
