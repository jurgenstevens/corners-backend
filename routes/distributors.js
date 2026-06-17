import { Router } from 'express'
import * as ctrl from '../controllers/distributors.js'
import { decodeUserFromToken, checkBusiness } from '../middleware/auth.js'

const router = Router()

router.get('/nearby', decodeUserFromToken, checkBusiness, ctrl.getNearby)
router.get('/:id', decodeUserFromToken, checkBusiness, ctrl.getById)
router.get('/:distributorId/catalog', decodeUserFromToken, checkBusiness, ctrl.getCatalog)

export default router
