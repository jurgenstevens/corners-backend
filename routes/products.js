const router = require('express').Router()
const ctrl = require('../controllers/products')
const { decodeUserFromToken, checkBusiness, checkPatron } = require('../middleware/auth')

router.get('/', decodeUserFromToken, checkBusiness, ctrl.index)
router.post('/', decodeUserFromToken, checkBusiness, ctrl.create)
router.get('/patron', decodeUserFromToken, checkPatron, ctrl.indexForPatron)
router.post('/request/:businessId', decodeUserFromToken, checkPatron, ctrl.requestProduct)
router.post('/:id/vote', decodeUserFromToken, checkPatron, ctrl.vote)
router.put('/:id/status', decodeUserFromToken, checkBusiness, ctrl.updateStatus)
router.put('/:id', decodeUserFromToken, checkBusiness, ctrl.update)
router.delete('/:id', decodeUserFromToken, checkBusiness, ctrl.destroy)

module.exports = router
