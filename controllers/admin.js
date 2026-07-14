import BugReport from '../models/bugReport.js'
import { generateSlug } from '../utils/generateSlug.js'
import VoteAbuseFlag from '../models/voteAbuseFlag.js'
import { Profile } from '../models/profile.js'
import Connection from '../models/connection.js'
import Business from '../models/business.js'
import Product from '../models/product.js'
import UserModel from '../models/user.js'
const { User } = UserModel

export async function getBugReports(req, res) {
  try {
    const filter = {}
    if (req.query.status) filter.status = req.query.status
    if (req.query.severity) filter.severity = req.query.severity
    if (req.query.category) filter.category = req.query.category
    const reports = await BugReport.find(filter)
      .populate('reporter', 'name email photo')
      .sort('-createdAt')
      .limit(100)
    res.json(reports)
  } catch (err) {
    res.status(500).json({ err: err.message })
  }
}

export async function updateBugReport(req, res) {
  try {
    const { status, adminNotes } = req.body
    const update = { status, adminNotes }
    if (status === 'resolved') {
      update.resolvedAt = new Date()
      update.resolvedBy = req.user.profileId
    }
    const report = await BugReport.findByIdAndUpdate(req.params.reportId, update, { new: true })
    if (!report) return res.status(404).json({ err: 'Bug report not found' })
    res.json(report)
  } catch (err) {
    res.status(500).json({ err: err.message })
  }
}

export async function getVoteAbuseFlags(req, res) {
  try {
    const flags = await VoteAbuseFlag.find({ reviewed: false, dismissed: false })
      .populate('patron', 'name email photo')
      .populate('product', 'name business')
      .sort('-createdAt')
    res.json(flags)
  } catch (err) {
    res.status(500).json({ err: err.message })
  }
}

export async function dismissAbuseFlag(req, res) {
  try {
    const flag = await VoteAbuseFlag.findByIdAndUpdate(
      req.params.flagId,
      { dismissed: true, reviewed: true, reviewedBy: req.user.profileId },
      { new: true }
    )
    if (!flag) return res.status(404).json({ err: 'Flag not found' })
    res.json(flag)
  } catch (err) {
    res.status(500).json({ err: err.message })
  }
}

export async function banUser(req, res) {
  try {
    const { reason } = req.body
    await Profile.findByIdAndUpdate(req.params.profileId, {
      isBanned: true,
      banReason: reason,
      bannedAt: new Date(),
    })
    await Connection.deleteMany({
      $or: [{ patron: req.params.profileId }, { business: req.params.profileId }],
    })
    res.json({ message: 'User banned' })
  } catch (err) {
    res.status(500).json({ err: err.message })
  }
}

export async function suspendUser(req, res) {
  try {
    const { reason, days } = req.body
    const profile = await Profile.findByIdAndUpdate(
      req.params.profileId,
      {
        isSuspended: true,
        suspensionReason: reason,
        suspendedUntil: new Date(Date.now() + days * 86400000),
      },
      { new: true }
    )
    if (!profile) return res.status(404).json({ err: 'User not found' })
    res.json(profile)
  } catch (err) {
    res.status(500).json({ err: err.message })
  }
}

export async function liftSuspension(req, res) {
  try {
    const profile = await Profile.findByIdAndUpdate(
      req.params.profileId,
      { isSuspended: false, suspendedUntil: null, suspensionReason: null },
      { new: true }
    )
    if (!profile) return res.status(404).json({ err: 'User not found' })
    res.json(profile)
  } catch (err) {
    res.status(500).json({ err: err.message })
  }
}

export async function flagUser(req, res) {
  try {
    const { reason } = req.body
    const profile = await Profile.findByIdAndUpdate(
      req.params.profileId,
      { $push: { flags: { reason, flaggedBy: req.user.profileId } } },
      { new: true }
    )
    if (!profile) return res.status(404).json({ err: 'User not found' })
    res.json(profile)
  } catch (err) {
    res.status(500).json({ err: err.message })
  }
}

export async function verifyBusiness(req, res) {
  try {
    const { notes } = req.body
    const business = await Business.findById(req.params.businessId ?? req.params.id)
    if (!business) return res.status(404).json({ err: 'Business not found' })

    business.verificationStatus = 'approved'
    if (notes) business.verificationNotes = notes

    if (!business.slug) {
      let slug = generateSlug(business.displayName || business.businessType || 'store')
      const collision = await Business.findOne({ slug, _id: { $ne: business._id } })
      if (collision) slug = slug + '-' + Math.random().toString(36).slice(2, 6)
      business.slug = slug
    }

    await business.save()
    res.json(business)
  } catch (err) {
    res.status(500).json({ err: err.message })
  }
}

export async function revokeBusiness(req, res) {
  try {
    const business = await Business.findByIdAndUpdate(
      req.params.id,
      { verificationStatus: 'pending', verificationNotes: null },
      { new: true }
    )
    if (!business) return res.status(404).json({ err: 'Business not found' })
    res.json(business)
  } catch (err) {
    res.status(500).json({ err: err.message })
  }
}

export async function rejectStore(req, res) {
  try {
    const business = await Business.findByIdAndUpdate(
      req.params.id,
      { verificationStatus: 'rejected', rejectedAt: new Date() },
      { new: true }
    )
    if (!business) return res.status(404).json({ err: 'Business not found' })
    res.json(business)
  } catch (err) {
    res.status(500).json({ err: err.message })
  }
}

async function cleanupRejectedBusinessesInternal() {
  const cutoff = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000)
  const stale = await Business.find({ verificationStatus: 'rejected', rejectedAt: { $lt: cutoff } })
  for (const biz of stale) {
    await Promise.all([
      User.findOneAndDelete({ profile: biz.profile }),
      Connection.deleteMany({ business: biz._id }),
      VoteAbuseFlag.deleteMany({ business: biz._id }),
    ])
    await Promise.all([
      Profile.findByIdAndDelete(biz.profile),
      Business.findByIdAndDelete(biz._id),
    ])
  }
}

export async function getProductsHittingTally(req, res) {
  try {
    const products = await Product.find({ status: { $in: ['ready_to_stock', 'stocked'] } })
      .populate('business', 'name')
      .sort('-updatedAt')
      .limit(50)
    res.json(products)
  } catch (err) {
    res.status(500).json({ err: err.message })
  }
}

export async function getRejectedProductsExpiring(req, res) {
  try {
    const products = await Product.find({ status: 'rejected' }).sort('updatedAt')
    const now = Date.now()
    const withExpiry = products.map(p => {
      const daysSince = (now - new Date(p.updatedAt)) / 86400000
      return { ...p.toObject(), daysUntilDeletion: Math.max(0, 30 - daysSince) }
    })
    res.json(withExpiry)
  } catch (err) {
    res.status(500).json({ err: err.message })
  }
}

export async function getBannedUsers(req, res) {
  try {
    const users = await Profile.find({ isBanned: true }).sort('-bannedAt').limit(100)
    res.json(users)
  } catch (err) {
    res.status(500).json({ err: err.message })
  }
}

export async function getStats(req, res) {
  try {
    cleanupRejectedBusinessesInternal().catch(() => {})
    const [pendingBusinesses, approvedBusinesses, totalPatrons, abuseFlags, openBugReports, tallyHits] =
      await Promise.all([
        Business.countDocuments({ verificationStatus: 'pending' }),
        Business.countDocuments({ verificationStatus: 'approved' }),
        Profile.countDocuments({ authorizationLevel: 150 }),
        VoteAbuseFlag.countDocuments({ reviewed: false, dismissed: false }),
        BugReport.countDocuments({ status: 'open' }),
        Product.countDocuments({ status: { $in: ['ready_to_stock', 'stocked'] } }),
      ])
    const [recentVerified, recentSignups] = await Promise.all([
      Business.find({ verificationStatus: 'approved' })
        .populate('profile', 'name email')
        .sort('-updatedAt')
        .limit(5)
        .select('displayName profile updatedAt verificationStatus'),
      Profile.find({ authorizationLevel: { $in: [150, 250] } })
        .sort('-createdAt')
        .limit(5)
        .select('name email authorizationLevel createdAt'),
    ])
    res.json({ pendingBusinesses, approvedBusinesses, totalPatrons, abuseFlags, openBugReports, tallyHits, recentVerified, recentSignups })
  } catch (err) {
    res.status(500).json({ err: err.message })
  }
}

export async function liftBan(req, res) {
  try {
    const profile = await Profile.findByIdAndUpdate(
      req.params.profileId,
      { isBanned: false, banReason: null, bannedAt: null },
      { new: true }
    )
    if (!profile) return res.status(404).json({ err: 'User not found' })
    res.json(profile)
  } catch (err) {
    res.status(500).json({ err: err.message })
  }
}

export async function hardDeleteProduct(req, res) {
  try {
    await Product.findByIdAndDelete(req.params.id)
    res.json({ message: 'Product permanently deleted' })
  } catch (err) {
    res.status(500).json({ err: err.message })
  }
}

export async function restoreProduct(req, res) {
  try {
    const product = await Product.findByIdAndUpdate(
      req.params.id,
      { status: 'pending', isActive: true },
      { new: true }
    )
    if (!product) return res.status(404).json({ err: 'Product not found' })
    res.json(product)
  } catch (err) {
    res.status(500).json({ err: err.message })
  }
}

export async function getAllBusinesses(req, res) {
  try {
    const filter = {}
    if (req.query.verificationStatus) filter.verificationStatus = req.query.verificationStatus
    const businesses = await Business.find(filter)
      .populate('profile', 'name email photo createdAt')
      .sort('-createdAt')
      .limit(100)
    res.json(businesses)
  } catch (err) {
    res.status(500).json({ err: err.message })
  }
}

export async function getBusinessDetail(req, res) {
  try {
    const business = await Business.findById(req.params.id)
      .populate('profile', 'name email photo authorizationLevel createdAt isBanned isSuspended suspendedUntil')
    if (!business) return res.status(404).json({ err: 'Business not found' })
    const [connectionStats, productCount, tallyCount] = await Promise.all([
      Connection.aggregate([{ $match: { business: business._id } }, { $group: { _id: '$status', count: { $sum: 1 } } }]),
      Product.countDocuments({ business: business.profile._id, isActive: true }),
      Product.countDocuments({ business: business.profile._id, status: { $in: ['ready_to_stock', 'stocked'] } }),
    ])
    res.json({ business, connectionStats, productCount, tallyCount })
  } catch (err) {
    res.status(500).json({ err: err.message })
  }
}


export async function getZipActivity(req, res) {
  try {
    const result = await Business.aggregate([
      { $match: { 'location.zip': { $exists: true, $ne: '' } } },
      { $group: { _id: '$location.zip', storeCount: { $sum: 1 } } },
      { $sort: { storeCount: -1 } },
      { $limit: 10 },
      { $project: { _id: 0, zip: '$_id', storeCount: 1 } },
    ])
    res.json(result)
  } catch (err) {
    res.status(500).json({ err: err.message })
  }
}

export async function getTopProducts(req, res) {
  try {
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
    const products = await Product.find({ updatedAt: { $gte: thirtyDaysAgo } })
      .populate('business', 'name')
      .sort('-currentTally')
      .limit(20)
    res.json(products)
  } catch (err) {
    res.status(500).json({ err: err.message })
  }
}

export async function getGrowthStats(req, res) {
  try {
    const now = new Date()
    const weeks = await Promise.all(
      Array.from({ length: 8 }, (_, i) => {
        const weekStart = new Date(now)
        weekStart.setDate(now.getDate() - (7 - i) * 7)
        weekStart.setHours(0, 0, 0, 0)
        const weekEnd = new Date(weekStart)
        weekEnd.setDate(weekStart.getDate() + 7)
        return Promise.all([
          Profile.countDocuments({ authorizationLevel: 150, createdAt: { $gte: weekStart, $lt: weekEnd } }),
          Profile.countDocuments({ authorizationLevel: 250, createdAt: { $gte: weekStart, $lt: weekEnd } }),
          Profile.countDocuments({ authorizationLevel: 500, createdAt: { $gte: weekStart, $lt: weekEnd } }),
        ]).then(([patrons, businesses, distributors]) => ({
          weekStart: weekStart.toISOString().split('T')[0],
          patrons,
          businesses,
          distributors,
          total: patrons + businesses + distributors,
        }))
      })
    )
    res.json(weeks)
  } catch (err) {
    res.status(500).json({ err: err.message })
  }
}

export async function getConnectionRates(req, res) {
  try {
    const businesses = await Business.find({ isActive: true }).populate('profile', 'name').select('displayName profile').limit(50)
    const result = await Promise.all(
      businesses.map(async b => {
        const [connected, denied] = await Promise.all([
          Connection.countDocuments({ business: b._id, status: 'approved' }),
          Connection.countDocuments({ business: b._id, status: { $in: ['denied', 'blocked'] } }),
        ])
        const total = connected + denied
        return {
          businessId: b._id,
          name: b.displayName || b.profile?.name || 'Unknown',
          connected,
          dismissed: denied,
          approvalRate: total > 0 ? Math.round((connected / total) * 100) : 0,
        }
      })
    )
    res.json(result.filter(r => r.connected + r.dismissed > 0).sort((a, b) => b.connected - a.connected))
  } catch (err) {
    res.status(500).json({ err: err.message })
  }
}

export async function getAllPatrons(req, res) {
  try {
    const patrons = await Profile.find({ authorizationLevel: 150 })
      .select('name email photo isBanned isSuspended suspendedUntil createdAt')
      .sort({ createdAt: -1 })
      .limit(500)
    res.json(patrons)
  } catch (err) {
    res.status(500).json({ err: err.message })
  }
}

export async function getPatronDetail(req, res) {
  try {
    const patron = await Profile.findById(req.params.id)
      .select('name email photo isBanned isSuspended suspendedUntil suspensionReason banReason bannedAt createdAt flags')
    if (!patron) return res.status(404).json({ err: 'Patron not found' })
    const [connections, votes, activeFlags] = await Promise.all([
      Connection.find({ patron: patron._id })
        .populate('business', 'displayName location businessType')
        .sort('-createdAt')
        .limit(50),
      Product.find({ votedBy: patron._id })
        .select('name brand status currentTally tallyGoal business')
        .sort('-updatedAt')
        .limit(50),
      VoteAbuseFlag.find({ patron: patron._id, dismissed: false, reviewed: false })
        .sort('-createdAt'),
    ])
    res.json({ patron, connections, votes, activeFlags })
  } catch (err) {
    res.status(500).json({ err: err.message })
  }
}

export async function deletePatron(req, res) {
  try {
    const patron = await Profile.findById(req.params.id)
    if (!patron) return res.status(404).json({ err: 'Patron not found' })
    await Promise.all([
      Connection.deleteMany({ patron: patron._id }),
      Product.updateMany(
        { votedBy: patron._id },
        { $pull: { votedBy: patron._id }, $inc: { currentTally: -1 } }
      ),
      VoteAbuseFlag.deleteMany({ patron: patron._id }),
    ])
    await Profile.findByIdAndDelete(patron._id)
    res.json({ message: 'Patron deleted' })
  } catch (err) {
    res.status(500).json({ err: err.message })
  }
}

export async function getAllDistributors(req, res) {
  try {
    const distributors = await Profile.find({ authorizationLevel: 500 })
      .select('name email photo createdAt')
      .sort({ createdAt: -1 })
    res.json(distributors)
  } catch (err) {
    res.status(500).json({ err: err.message })
  }
}

export async function getAllProducts(req, res) {
  try {
    const products = await Product.find()
      .select('name brand status currentTally tallyGoal isActive business createdAt updatedAt')
      .sort({ createdAt: -1 })
      .limit(500)

    const profileIds = [...new Set(products.map(p => p.business?.toString()).filter(Boolean))]
    const businesses = await Business.find({ profile: { $in: profileIds } }).select('profile displayName')
    const bizByProfile = {}
    businesses.forEach(b => { bizByProfile[b.profile.toString()] = b.displayName })

    const result = products.map(p => ({
      ...p.toObject(),
      storeName: bizByProfile[p.business?.toString()] ?? null,
    }))
    res.json(result)
  } catch (err) {
    res.status(500).json({ err: err.message })
  }
}

export async function getProductDetail(req, res) {
  try {
    const product = await Product.findById(req.params.id)
      .populate('votedBy', 'name email photo')
      .populate('requestedBy', 'name email')
    if (!product) return res.status(404).json({ err: 'Product not found' })
    const business = await Business.findOne({ profile: product.business })
      .select('_id displayName businessType location')
    res.json({ product, business })
  } catch (err) {
    res.status(500).json({ err: err.message })
  }
}

export async function approveProduct(req, res) {
  try {
    const product = await Product.findByIdAndUpdate(
      req.params.id,
      { status: 'approved' },
      { new: true }
    )
    if (!product) return res.status(404).json({ err: 'Product not found' })
    res.json(product)
  } catch (err) {
    res.status(500).json({ err: err.message })
  }
}

export async function verifyAuthenticBusiness(req, res) {
  try {
    const business = await Business.findByIdAndUpdate(
      req.params.id,
      { isAuthentic: true },
      { new: true }
    )
    if (!business) return res.status(404).json({ err: 'Business not found' })
    res.json(business)
  } catch (err) {
    res.status(500).json({ err: err.message })
  }
}
