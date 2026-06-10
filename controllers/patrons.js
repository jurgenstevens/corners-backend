import Patron from '../models/patron.js'
import { Profile } from '../models/profile.js'

export async function getMe(req, res) {
  try {
    console.log('patrons.getMe — profileId:', req.user.profileId)
    const patron = await Patron.findOne({ profile: req.user.profileId })
      .populate('profile', 'name photo email')
    if (!patron) return res.status(404).json({ err: 'Patron not found' })
    console.log('patrons.getMe — patron found:', patron._id)
    res.json(patron)
  } catch (err) {
    console.log('patrons.getMe — ERROR:', err.message)
    res.status(500).json({ err: err.message })
  }
}

export async function update(req, res) {
  try {
    const { name, photo, zip, city, state } = req.body
    console.log('patrons.update — profileId:', req.user.profileId, '| data:', { name, photo, zip, city, state })

    const patron = await Patron.findOneAndUpdate(
      { profile: req.user.profileId },
      { location: { zip: zip || '', city: city || '', state: state || '' } },
      { new: true }
    )
    if (!patron) return res.status(404).json({ err: 'Patron not found' })

    const profileUpdate = {}
    if (name) profileUpdate.name = name
    if (photo !== undefined) profileUpdate.photo = photo
    if (Object.keys(profileUpdate).length) {
      await Profile.findByIdAndUpdate(req.user.profileId, profileUpdate)
    }

    console.log('patrons.update — updated successfully')
    res.json(patron)
  } catch (err) {
    console.log('patrons.update — ERROR:', err.message)
    res.status(500).json({ err: err.message })
  }
}