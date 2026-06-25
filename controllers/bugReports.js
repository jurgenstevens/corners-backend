import BugReport from '../models/bugReport.js'

const roleMap = { 150: 'Patron', 250: 'Business', 500: 'Distributor' }

export async function create(req, res) {
  try {
    const { category, title, description, stepsToReproduce, severity, relatedUserId, relatedBusinessId } = req.body
    const report = await BugReport.create({
      reporter: req.user.profileId,
      reporterRole: roleMap[req.user.authorizationLevel],
      category,
      title,
      description,
      stepsToReproduce,
      severity,
      relatedUserId,
      relatedBusinessId,
    })
    res.status(201).json(report)
  } catch (err) {
    res.status(500).json({ err: err.message })
  }
}
