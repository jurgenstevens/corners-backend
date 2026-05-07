const jwt = require('jsonwebtoken')

function decodeUserFromToken(req, res, next) {
  let token = req.get('Authorization')
  if (!token) return res.status(401).json({ err: 'Not authorized, no token' })
  token = token.replace('Bearer ', '')
  jwt.verify(token, process.env.SECRET, function (err, decoded) {
    if (err) return res.status(401).json({ err: 'Not authorized, bad token' })
    req.user = decoded
    next()
  })
}

function checkBusiness(req, res, next) {
  if (req.user?.authorizationLevel >= 250) return next()
  return res.status(403).json({ err: 'Business access required' })
}

function checkPatron(req, res, next) {
  if (req.user?.authorizationLevel >= 150 && req.user?.authorizationLevel < 250) return next()
  return res.status(403).json({ err: 'Patron access required' })
}

function checkDistributor(req, res, next) {
  if (req.user?.authorizationLevel >= 500) return next()
  return res.status(403).json({ err: 'Distributor access required' })
}

module.exports = { decodeUserFromToken, checkBusiness, checkPatron, checkDistributor }
