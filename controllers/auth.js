import jwt from 'jsonwebtoken'
import UserModel from '../models/user.js'
const { User } = UserModel
import { Profile, AUTH_LEVELS } from '../models/profile.js'
import Business from '../models/business.js'
import Patron from '../models/patron.js'
import { Distributor } from '../models/distributor.js'

const ROLE_TO_AUTH_LEVEL = {
  Patron: AUTH_LEVELS.PATRON,
  Business: AUTH_LEVELS.BUSINESS,
  Distributor: AUTH_LEVELS.DISTRIBUTOR,
}

function normalizeRole(raw) {
  if (!raw) return ''
  const lower = raw.toLowerCase()
  return lower.charAt(0).toUpperCase() + lower.slice(1)
}

function createJWT(user) {
  if (!user.profile) throw new Error('User profile not populated before creating JWT')
  return jwt.sign(
    {
      _id: user._id,
      email: user.email,
      profileId: user.profile._id,
      name: user.profile.name,
      authorizationLevel: user.profile.authorizationLevel,
    },
    process.env.SECRET,
    { expiresIn: '24h' }
  )
}

function handleAuthError(err, res) {
  console.log(err)
  const { message } = err
  if (message === 'User not found' || message === 'Incorrect password') {
    res.status(401).json({ err: message })
  } else {
    res.status(500).json({ err: message })
  }
}

export async function signup(req, res) {
  try {
    if (!process.env.SECRET) throw new Error('no SECRET in back-end .env')

    const { name, email, password, zip, city, state, businessType, visibility } = req.body
    const role = normalizeRole(req.body.role)

    const authorizationLevel = ROLE_TO_AUTH_LEVEL[role]
    if (!authorizationLevel) return res.status(400).json({ err: `Invalid role: "${req.body.role}"` })

    const existingUser = await User.findOne({ email })
    if (existingUser) throw new Error('Account already exists')

    const newProfile = await Profile.create({ name, email, authorizationLevel })
    const newUser = await User.create({ email, password, profile: newProfile._id })

    if (authorizationLevel === AUTH_LEVELS.BUSINESS) {
      await Business.create({
        profile: newProfile._id,
        displayName: name,
        businessType: businessType || '',
        visibility: visibility || 'public',
      })
    } else if (authorizationLevel === AUTH_LEVELS.PATRON) {
      await Patron.create({
        profile: newProfile._id,
        location: { zip: zip || '', city: city || '', state: state || '' },
      })
    } else if (authorizationLevel === AUTH_LEVELS.DISTRIBUTOR) {
      await Distributor.create({ profile: newProfile._id })
    }

    const populatedUser = await User.findById(newUser._id).populate('profile')
    const token = createJWT(populatedUser)
    res.status(200).json({ token })
  } catch (err) {
    console.log(err)
    res.status(500).json({ err: err.message })
  }
}

export async function login(req, res) {
  try {
    if (!process.env.SECRET) throw new Error('no SECRET in back-end .env')
    const user = await User.findOne({ email: req.body.email }).populate('profile')
    if (!user) throw new Error('User not found')
    const isMatch = await user.comparePassword(req.body.password)
    if (!isMatch) throw new Error('Incorrect password')
    const token = createJWT(user)
    res.json({ token })
  } catch (err) {
    handleAuthError(err, res)
  }
}

export async function changePassword(req, res) {
  try {
    const user = await User.findById(req.user._id)
    if (!user) throw new Error('User not found')
    const isMatch = await user.comparePassword(req.body.password)
    if (!isMatch) throw new Error('Incorrect password')
    user.password = req.body.newPassword
    await user.save()
    const populatedUser = await User.findById(user._id).populate('profile')
    const token = createJWT(populatedUser)
    res.json({ token })
  } catch (err) {
    handleAuthError(err, res)
  }
}
