import { Router } from 'express'
import * as ctrl from '../controllers/products.js'
import { decodeUserFromToken, checkBusiness, checkPatron } from '../middleware/auth.js'

const router = Router()

router.get('/patron', decodeUserFromToken, checkPatron, ctrl.indexForPatron)
router.get('/by-business/:businessId', decodeUserFromToken, checkPatron, ctrl.indexForPatronByBusiness)
router.get('/', decodeUserFromToken, checkBusiness, ctrl.index)
router.post('/', decodeUserFromToken, checkBusiness, ctrl.create)
router.post('/request/:businessId', decodeUserFromToken, checkPatron, ctrl.requestProduct)
router.post('/:id/vote', decodeUserFromToken, checkPatron, ctrl.vote)
router.post('/:id/request-info', decodeUserFromToken, checkBusiness, ctrl.requestInfo)
router.put('/:id/status', decodeUserFromToken, checkBusiness, ctrl.updateStatus)
router.put('/:id/patron-update', decodeUserFromToken, checkPatron, ctrl.patronUpdate)
router.put('/:id', decodeUserFromToken, checkBusiness, ctrl.update)
router.delete('/:id', decodeUserFromToken, checkBusiness, ctrl.destroy)

export default router
