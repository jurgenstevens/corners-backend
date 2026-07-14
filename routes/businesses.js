import { Router } from 'express'
import * as ctrl from '../controllers/businesses.js'
import { decodeUserFromToken, checkBusiness } from '../middleware/auth.js'

const router = Router()

// Public — no auth required
router.get('/join/:slug', ctrl.joinBySlug)

// Auth-protected
router.get('/me',     decodeUserFromToken, checkBusiness, ctrl.getMyBusiness)
router.put('/setup',  decodeUserFromToken, checkBusiness, ctrl.setup)
router.get('/:id',    decodeUserFromToken, ctrl.show)

export default router
