const Profile = require('../models/profile')
const User = require('../models/user')
const Business = require('../models/business')
const Patron = require('../models/patron')
const jwt = require('jsonwebtoken')
const bcrypt = require('bcrypt')

const SALT_ROUNDS = 10
const AUTH_LEVELS = Profile.AUTH_LEVELS || { PATRON: 150, BUSINESS: 250, DISTRIBUTOR: 500 }

function createJWT(profile) {
  return jwt.sign(
    {
      _id: profile._id,
      email: profile.email,
      profileId: profile._id,
      name: profile.name,
      authorizationLevel: profile.authorizationLevel,
    },
    process.env.SECRET,
    { expiresIn: '7d' }
  )
}

async function signup(req, res) {
  try {
    const { name, email, password, photo, role, zip, city, state, businessType, visibility } = req.body

    const existing = await Profile.findOne({ email })
    if (existing) return res.status(400).json({ err: 'Email already in use' })

    const authLevel = role === 'business' ? AUTH_LEVELS.BUSINESS
      : role === 'distributor' ? AUTH_LEVELS.DISTRIBUTOR
      : AUTH_LEVELS.PATRON

    const hashedPw = await bcrypt.hash(password, SALT_ROUNDS)

    const profile = await Profile.create({
      name,
      email,
      photo: photo || '',
      authorizationLevel: authLevel,
    })

    await User.create({ profile: profile._id, password: hashedPw })

    if (authLevel === AUTH_LEVELS.BUSINESS) {
      await Business.create({
        profile: profile._id,
        displayName: name,
        businessType: businessType || '',
        visibility: visibility || 'public',
      })
    } else if (authLevel === AUTH_LEVELS.PATRON) {
      await Patron.create({
        profile: profile._id,
        location: { zip: zip || '', city: city || '', state: state || '' },
      })
    }

    const token = createJWT(profile)
    res.status(201).json({ token })
  } catch (err) {
    res.status(500).json({ err: err.message })
  }
}

async function login(req, res) {
  try {
    const { email, password } = req.body
    const profile = await Profile.findOne({ email })
    if (!profile) return res.status(400).json({ err: 'Invalid credentials' })

    const user = await User.findOne({ profile: profile._id })
    if (!user) return res.status(400).json({ err: 'Invalid credentials' })

    const match = await bcrypt.compare(password, user.password)
    if (!match) return res.status(400).json({ err: 'Invalid credentials' })

    const token = createJWT(profile)
    res.json({ token })
  } catch (err) {
    res.status(500).json({ err: err.message })
  }
}

module.exports = { signup, login }
