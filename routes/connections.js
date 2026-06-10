import { Router } from 'express'
import * as ctrl from '../controllers/connections.js'
import { decodeUserFromToken, checkPatron, checkBusiness } from '../middleware/auth.js'

const router = Router()

router.get('/nearby', decodeUserFromToken, checkPatron, ctrl.nearby)
router.post('/request/:businessId', decodeUserFromToken, checkPatron, ctrl.requestConnection)
router.post('/dismiss/:businessId', decodeUserFromToken, checkPatron, ctrl.dismiss)
router.get('/my-stores', decodeUserFromToken, checkPatron, ctrl.getMyStores)
router.get('/status/:businessId', decodeUserFromToken, checkPatron, ctrl.getMyConnectionStatus)
router.delete('/disconnect/:businessId', decodeUserFromToken, checkPatron, ctrl.disconnect)
router.get('/pending', decodeUserFromToken, checkBusiness, ctrl.getPending)
router.put('/:connectionId/status', decodeUserFromToken, checkBusiness, ctrl.updateStatus)

export default router