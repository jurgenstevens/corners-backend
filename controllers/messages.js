import Message from '../models/message.js'
import MessageThread from '../models/messageThread.js'
import { Profile } from '../models/profile.js'
import Notification from '../models/notification.js'

export async function getMyThreads(req, res) {
  try {
    const filter = { participants: req.user.profileId }
    if (req.query.businessId) filter.relatedBusiness = req.query.businessId
    const threads = await MessageThread.find(filter)
      .populate('participants', 'name photo')
      .sort('-lastMessage')

    const withUnread = await Promise.all(
      threads.map(async thread => {
        const unreadCount = await Message.countDocuments({
          thread: thread._id,
          readBy: { $nin: [req.user.profileId] },
        })
        return { ...thread.toObject(), unreadCount }
      })
    )

    res.json(withUnread)
  } catch (err) {
    res.status(500).json({ err: err.message })
  }
}

export async function getThread(req, res) {
  try {
    const thread = await MessageThread.findById(req.params.threadId).populate('participants', 'name photo')
    if (!thread) return res.status(404).json({ err: 'Thread not found' })

    const isParticipant = thread.participants.some(p => p._id.toString() === req.user.profileId.toString())
    if (!isParticipant) return res.status(403).json({ err: 'Not a participant in this thread' })

    const messages = await Message.find({ thread: thread._id })
      .populate('sender', 'name photo')
      .sort('createdAt')

    await Message.updateMany(
      { thread: thread._id, readBy: { $nin: [req.user.profileId] } },
      { $push: { readBy: req.user.profileId } }
    )

    res.json({ thread, messages })
  } catch (err) {
    res.status(500).json({ err: err.message })
  }
}

export async function sendMessage(req, res) {
  try {
    const { body } = req.body
    const thread = await MessageThread.findById(req.params.threadId)
    if (!thread) return res.status(404).json({ err: 'Thread not found' })

    const isParticipant = thread.participants.some(p => p.toString() === req.user.profileId.toString())
    if (!isParticipant) return res.status(403).json({ err: 'Not a participant in this thread' })

    const message = await Message.create({ thread: thread._id, sender: req.user.profileId, body })

    thread.lastMessage = new Date()
    thread.lastMessagePreview = body.slice(0, 100)
    await thread.save()

    const others = thread.participants.filter(p => p.toString() !== req.user.profileId.toString())
    await Promise.all(
      others.map(recipientId =>
        Notification.create({
          recipient: recipientId,
          type: 'new_message',
          message: `New message: "${body.slice(0, 60)}..."`,
          relatedId: thread._id,
        })
      )
    )

    res.status(201).json(message)
  } catch (err) {
    res.status(500).json({ err: err.message })
  }
}

export async function startThread(req, res) {
  try {
    const { recipientProfileId, subject, body, relatedBusinessId } = req.body

    const thread = await MessageThread.create({
      participants: [req.user.profileId, recipientProfileId],
      subject,
      isAdminThread: true,
      initiatedBy: req.user.profileId,
      relatedBusiness: relatedBusinessId || undefined,
      lastMessage: new Date(),
      lastMessagePreview: body.slice(0, 100),
    })

    const message = await Message.create({ thread: thread._id, sender: req.user.profileId, body })

    await Notification.create({
      recipient: recipientProfileId,
      type: 'admin_message',
      message: `You have a message from Corners admin: "${body.slice(0, 60)}"`,
      relatedId: thread._id,
    })

    res.status(201).json({ thread, message })
  } catch (err) {
    res.status(500).json({ err: err.message })
  }
}

export async function closeThread(req, res) {
  try {
    const thread = await MessageThread.findById(req.params.threadId)
    if (!thread) return res.status(404).json({ err: 'Thread not found' })

    thread.status = 'closed'
    await thread.save()

    await Message.create({
      thread: thread._id,
      sender: req.user.profileId,
      body: 'This conversation has been closed by an admin.',
      isSystemMessage: true,
    })

    res.json(thread)
  } catch (err) {
    res.status(500).json({ err: err.message })
  }
}
