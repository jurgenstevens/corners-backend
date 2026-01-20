import jwt from 'jsonwebtoken'

const SECRET = process.env.SECRET
import { AUTH_LEVELS } from '../models/profile.js'

function checkAdmin(req, res, next) {
  if (req.user?.profile?.authorizationLevel === AUTH_LEVELS.ADMIN) {
    return next()
  }
  return res.status(403).json({ err: 'Admins only' })
}

function checkBusiness(req, res, next) {
  if (req.user?.profile?.authorizationLevel === AUTH_LEVELS.BUSINESS) {
    return next()
  }
  return res.status(403).json({ err: 'Business only' })
}

function checkDistributor(req, res, next) {
  if (req.user?.profile?.authorizationLevel === AUTH_LEVELS.DISTRIBUTOR) {
    return next()
  }
  return res.status(403).json({ err: 'Distributors only' })
}

function checkPatron(req, res, next) {
  if (req.user?.profile?.authorizationLevel === AUTH_LEVELS.PATRON) {
    return next()
  }
  return res.status(403).json({ err: 'Patrons only' })
}

const decodeUserFromToken = (req, res, next) => {
  let token = req.get('Authorization') || req.query.token || req.body.token
  if (!token) return next()

  token = token.replace('Bearer ', '')
  jwt.verify(token, SECRET, (err, decoded) => {
    if (err) return next(err)

    req.user = decoded.user
    next()
  })
}

function checkAuth(req, res, next) {
  return req.user ? next() : res.status(401).json({ err: 'Not Authorized' })
}

export { decodeUserFromToken, checkAuth, checkAdmin, checkBusiness, checkPatron, checkDistributor }
