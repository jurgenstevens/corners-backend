import jwt from 'jsonwebtoken'
import { User } from '../models/user.js'
import { Profile, AUTH_LEVELS } from '../models/profile.js'

const ROLE_TO_AUTH_LEVEL = {
  Patron: AUTH_LEVELS.PATRON,
  Business: AUTH_LEVELS.BUSINESS,
  Distributor: AUTH_LEVELS.DISTRIBUTOR,
}

async function signup(req, res) {
  try {
    if (!process.env.SECRET) throw new Error('no SECRET in back-end .env')
    if (!process.env.CLOUDINARY_URL) {
      throw new Error('no CLOUDINARY_URL in back-end .env file')
    }

    const { name, email, password, role } = req.body

    const authorizationLevel = ROLE_TO_AUTH_LEVEL[role]
    if (!authorizationLevel) {
      return res.status(400).json({ err: 'Invalid role' })
    }

    const existingUser = await User.findOne({ email })
    if (existingUser) throw new Error('Account already exists')

    // Create profile with controlled fields
    const newProfile = await Profile.create({
      name,
      email,
      authorizationLevel,
    })

    const newUser = await User.create({
      email,
      password,
      profile: newProfile._id,
    })

    // ✅ IMPORTANT: populate profile before creating JWT
    const populatedUser = await User.findById(newUser._id).populate('profile')

    const token = createJWT(populatedUser, newProfile)
    res.status(200).json({ token })

  } catch (err) {
    console.log(err)

    // rollback safety
    try {
      if (req.body?.profile) {
        await Profile.findByIdAndDelete(req.body.profile)
      }
    } catch (cleanupErr) {
      console.log('Cleanup failed:', cleanupErr)
    }

    res.status(500).json({ err: err.message })
  }
}

async function login(req, res) {
  try {
    if (!process.env.SECRET) throw new Error('no SECRET in back-end .env')
    if (!process.env.CLOUDINARY_URL) {
      throw new Error('no CLOUDINARY_URL in back-end .env')
    }

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

async function changePassword(req, res) {
  try {
    const user = await User.findById(req.user._id)
    if (!user) throw new Error('User not found')

    const isMatch = user.comparePassword(req.body.password)
    if (!isMatch) throw new Error('Incorrect password')

    user.password = req.body.newPassword
    await user.save()

    const profile = await Profile.findById(user.profile)
    const token = createJWT(user, profile)
    res.json({ token })
    
  } catch (err) {
    handleAuthError(err, res)
  }
}

/* --== Helper Functions ==-- */

function handleAuthError(err, res) {
  console.log(err)
  const { message } = err
  if (message === 'User not found' || message === 'Incorrect password') {
    res.status(401).json({ err: message })
  } else {
    res.status(500).json({ err: message })
  }
}

function createJWT(user) {
  if (!user.profile) {
    throw new Error('User profile not populated before creating JWT')
  }  
  
  return jwt.sign(
    {

      _id: user._id,
      email: user.email,
      profileId: user.profile._id,
      name: user.profile.name,
      authorizationLevel: user.profile.authorizationLevel,
    },
    process.env.SECRET, 
    { expiresIn: '24h' })
}

export { signup, login, changePassword }
