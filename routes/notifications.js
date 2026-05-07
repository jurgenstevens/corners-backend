const router = require('express').Router()
const ctrl = require('../controllers/notifications')
const { decodeUserFromToken } = require('../middleware/auth')

router.get('/', decodeUserFromToken, ctrl.index)
router.put('/:id/read', decodeUserFromToken, ctrl.markRead)
router.put('/read-all', decodeUserFromToken, ctrl.markAllRead)

module.exports = router
