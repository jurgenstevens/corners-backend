const router = require('express').Router()
const ctrl = require('../controllers/businesses')
const { decodeUserFromToken, checkBusiness } = require('../middleware/auth')

router.get('/me', decodeUserFromToken, checkBusiness, ctrl.getMyBusiness)
router.put('/setup', decodeUserFromToken, checkBusiness, ctrl.setup)
router.get('/:id', decodeUserFromToken, ctrl.show)

module.exports = router
