import { Router } from 'express'
import * as ctrl from '../controllers/orders.js'
import { decodeUserFromToken, checkBusiness, checkDistributor } from '../middleware/auth.js'
import { requireActiveSubscription } from '../middleware/requireActiveSubscription.js'

const router = Router()

router.post('/', decodeUserFromToken, checkBusiness, requireActiveSubscription, ctrl.create)
router.get('/business', decodeUserFromToken, checkBusiness, requireActiveSubscription, ctrl.getBusinessOrders)
router.get('/distributor', decodeUserFromToken, checkDistributor, ctrl.getDistributorOrders)
router.put('/:orderId/quote', decodeUserFromToken, checkDistributor, ctrl.quote)
router.put('/:orderId/accept', decodeUserFromToken, checkBusiness, requireActiveSubscription, ctrl.accept)
router.put('/:orderId/cancel', decodeUserFromToken, checkBusiness, requireActiveSubscription, ctrl.cancelOrder)
router.put('/:orderId/status', decodeUserFromToken, checkDistributor, ctrl.updateStatus)

export default router
