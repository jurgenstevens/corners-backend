const router = require('express').Router()
const ctrl = require('../controllers/connections')
const { decodeUserFromToken, checkPatron, checkBusiness } = require('../middleware/auth')

router.get('/nearby', decodeUserFromToken, checkPatron, ctrl.nearby)
router.post('/request/:businessId', decodeUserFromToken, checkPatron, ctrl.requestConnection)
router.post('/dismiss/:businessId', decodeUserFromToken, checkPatron, ctrl.dismiss)
router.get('/my-stores', decodeUserFromToken, checkPatron, ctrl.getMyStores)
router.get('/status/:businessId', decodeUserFromToken, checkPatron, ctrl.getMyConnectionStatus)
router.get('/pending', decodeUserFromToken, checkBusiness, ctrl.getPending)
router.put('/:connectionId/status', decodeUserFromToken, checkBusiness, ctrl.updateStatus)

module.exports = router
