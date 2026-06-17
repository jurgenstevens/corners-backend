import { Router } from 'express'
import * as ctrl from '../controllers/distributors.js'
import { decodeUserFromToken, checkBusiness, checkDistributor } from '../middleware/auth.js'
import { uploadPDF } from '../middleware/upload.js'

const router = Router()

router.post('/catalog/upload', decodeUserFromToken, checkDistributor, uploadPDF, ctrl.uploadCatalog)
router.get('/catalog/mine', decodeUserFromToken, checkDistributor, ctrl.getCatalogForDistributor)
router.put('/catalog/:productId', decodeUserFromToken, checkDistributor, ctrl.updateProduct)
router.delete('/catalog/:productId', decodeUserFromToken, checkDistributor, ctrl.deleteProduct)

router.get('/nearby', decodeUserFromToken, checkBusiness, ctrl.getNearby)
router.get('/:id', decodeUserFromToken, checkBusiness, ctrl.getById)
router.get('/:distributorId/catalog', decodeUserFromToken, checkBusiness, ctrl.getCatalog)

export default router
