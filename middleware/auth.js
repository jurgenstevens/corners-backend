import jwt from 'jsonwebtoken'
import { Profile } from '../models/profile.js'

export function decodeUserFromToken(req, res, next) {
  let token = req.get('Authorization') || req.query.token || req.body.token
  if (!token) return next()
  token = token.replace('Bearer ', '')
  jwt.verify(token, process.env.SECRET, (err, decoded) => {
    if (err) return next(err)
    req.user = decoded
    next()
  })
}

export function checkAuth(req, res, next) {
  return req.user ? next() : res.status(401).json({ err: 'Not Authorized' })
}

export function checkBusiness(req, res, next) {
  if (req.user?.authorizationLevel >= 250) return next()
  return res.status(403).json({ err: 'Business access required' })
}

export function checkPatron(req, res, next) {
  if (req.user?.authorizationLevel >= 150 && req.user?.authorizationLevel < 250) return next()
  return res.status(403).json({ err: 'Patron access required' })
}

export function checkDistributor(req, res, next) {
  if (req.user?.authorizationLevel >= 500) return next()
  return res.status(403).json({ err: 'Distributor access required' })
}

export function checkAdmin(req, res, next) {
  if (req.user?.authorizationLevel === 100) return next()
  return res.status(403).json({ err: 'Admin access required' })
}

export async function checkNotBanned(req, res, next) {
  try {
    if (!req.user) return next()
    const profile = await Profile.findById(req.user.profileId).select('isBanned isSuspended suspendedUntil')
    if (!profile) return next()
    if (profile.isBanned) {
      return res.status(403).json({ err: 'Your account has been banned.' })
    }
    if (profile.isSuspended && profile.suspendedUntil > new Date()) {
      return res.status(403).json({ err: `Your account is suspended until ${profile.suspendedUntil.toLocaleDateString()}.` })
    }
    next()
  } catch (err) {
    next()
  }
}
