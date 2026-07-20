import express, { Router } from 'express'
import * as ctrl from '../controllers/billing.js'
import { decodeUserFromToken, checkAuth } from '../middleware/auth.js'

const router = Router()

router.post('/webhook', express.raw({ type: 'application/json' }), ctrl.handleWebhook)
router.post('/create-checkout', decodeUserFromToken, checkAuth, ctrl.createCheckout)
router.get('/status', decodeUserFromToken, checkAuth, ctrl.getStatus)

export default router
