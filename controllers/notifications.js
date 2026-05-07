import Notification from '../models/notification.js'

export async function index(req, res) {
  try {
    const notifications = await Notification.find({ recipient: req.user._id })
      .sort('-createdAt')
      .limit(50)
    res.json(notifications)
  } catch (err) {
    res.status(500).json({ err: err.message })
  }
}

export async function markRead(req, res) {
  try {
    await Notification.findOneAndUpdate(
      { _id: req.params.id, recipient: req.user._id },
      { read: true }
    )
    res.json({ message: 'Marked as read' })
  } catch (err) {
    res.status(500).json({ err: err.message })
  }
}

export async function markAllRead(req, res) {
  try {
    await Notification.updateMany({ recipient: req.user._id }, { read: true })
    res.json({ message: 'All marked as read' })
  } catch (err) {
    res.status(500).json({ err: err.message })
  }
}
