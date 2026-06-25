import { Router } from 'express'
import * as ctrl from '../controllers/admin.js'
import { decodeUserFromToken, checkAdmin } from '../middleware/auth.js'

const router = Router()

router.use(decodeUserFromToken, checkAdmin)

router.get('/stats', ctrl.getStats)
router.get('/stats/zip-activity', ctrl.getZipActivity)
router.get('/stats/top-products', ctrl.getTopProducts)
router.get('/stats/growth', ctrl.getGrowthStats)
router.get('/stats/connection-rates', ctrl.getConnectionRates)

router.get('/bug-reports', ctrl.getBugReports)
router.put('/bug-reports/:reportId', ctrl.updateBugReport)
router.get('/vote-abuse-flags', ctrl.getVoteAbuseFlags)
router.put('/vote-abuse-flags/:flagId/dismiss', ctrl.dismissAbuseFlag)
router.put('/users/:profileId/ban', ctrl.banUser)
router.put('/users/:profileId/suspend', ctrl.suspendUser)
router.put('/users/:profileId/lift-suspension', ctrl.liftSuspension)
router.put('/users/:profileId/flag', ctrl.flagUser)
router.put('/businesses/:businessId/verify', ctrl.verifyBusiness)
router.get('/products/tally-hits', ctrl.getProductsHittingTally)
router.get('/products/expiring-rejected', ctrl.getRejectedProductsExpiring)
router.get('/users/banned', ctrl.getBannedUsers)
router.get('/users/patrons', ctrl.getAllPatrons)
router.put('/users/:profileId/lift-ban', ctrl.liftBan)

router.get('/businesses', ctrl.getAllBusinesses)
router.get('/businesses/:id', ctrl.getBusinessDetail)
router.put('/businesses/:id/reject', ctrl.rejectBusiness)

router.get('/distributors', ctrl.getAllDistributors)

router.get('/products', ctrl.getAllProducts)
router.delete('/products/:id', ctrl.hardDeleteProduct)
router.put('/products/:id/restore', ctrl.restoreProduct)

export default router
