import { Router } from 'express'
import { decodeUserFromToken, checkAuth, checkBusiness } from '../middleware/auth.js'
import * as productsCtrl from '../controllers/products.js'

const router = Router()
router.use(decodeUserFromToken)

router.get('/', checkAuth, productsCtrl.indexAll)
router.get('/my', checkAuth, checkBusiness, productsCtrl.index)
router.post('/', checkAuth, checkBusiness, productsCtrl.create)
router.put('/:id', checkAuth, checkBusiness, productsCtrl.update)
router.delete('/:id', checkAuth, checkBusiness, productsCtrl.destroy)

export { router }