import { Router } from 'express'
import * as ctrl from '../controllers/orders.js'
import { decodeUserFromToken, checkBusiness, checkDistributor } from '../middleware/auth.js'

const router = Router()

router.post('/', decodeUserFromToken, checkBusiness, ctrl.create)
router.get('/business', decodeUserFromToken, checkBusiness, ctrl.getBusinessOrders)
router.get('/distributor', decodeUserFromToken, checkDistributor, ctrl.getDistributorOrders)
router.put('/:orderId/quote', decodeUserFromToken, checkDistributor, ctrl.quote)
router.put('/:orderId/accept', decodeUserFromToken, checkBusiness, ctrl.accept)
router.put('/:orderId/status', decodeUserFromToken, checkDistributor, ctrl.updateStatus)

export default router
