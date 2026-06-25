import { Router } from 'express'
import * as ctrl from '../controllers/bugReports.js'
import { decodeUserFromToken, checkAuth } from '../middleware/auth.js'

const router = Router()

router.post('/', decodeUserFromToken, checkAuth, ctrl.create)

export default router
