import { Router } from 'express'
import { decodeUserFromToken, checkAdmin } from '../middleware/auth.js'
import * as ctrl from '../controllers/messages.js'

const router = Router()

router.get('/', decodeUserFromToken, ctrl.getMyThreads)
router.get('/:threadId', decodeUserFromToken, ctrl.getThread)
router.post('/:threadId/reply', decodeUserFromToken, ctrl.sendMessage)
router.post('/start', decodeUserFromToken, checkAdmin, ctrl.startThread)
router.put('/:threadId/close', decodeUserFromToken, checkAdmin, ctrl.closeThread)

export default router
