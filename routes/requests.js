import { Router } from 'express'
import { decodeUserFromToken, checkAuth, checkBusiness, checkPatron } from '../middleware/auth.js'
import * as requestsCtrl from '../controllers/requests.js'

const router = Router()
router.use(decodeUserFromToken)

router.post('/', checkAuth, checkPatron, requestsCtrl.create)
router.get('/my', checkAuth, checkPatron, requestsCtrl.indexForPatron)
router.get('/business', checkAuth, checkBusiness, requestsCtrl.indexForBusiness)
router.put('/:id/status', checkAuth, checkBusiness, requestsCtrl.updateStatus)

export { router }