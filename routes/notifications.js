import { Router } from 'express'
import * as ctrl from '../controllers/notifications.js'
import { decodeUserFromToken } from '../middleware/auth.js'

const router = Router()

router.get('/', decodeUserFromToken, ctrl.index)
router.put('/read-all', decodeUserFromToken, ctrl.markAllRead)
router.put('/:id/read', decodeUserFromToken, ctrl.markRead)

export default router
