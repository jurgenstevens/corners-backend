import { Router } from 'express'
import * as ctrl from '../controllers/patrons.js'
import { decodeUserFromToken, checkPatron } from '../middleware/auth.js'

const router = Router()

router.get('/me', decodeUserFromToken, checkPatron, ctrl.getMe)
router.put('/me', decodeUserFromToken, checkPatron, ctrl.update)

export default router