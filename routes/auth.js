import { Router } from 'express'
import rateLimit from 'express-rate-limit'
import { decodeUserFromToken, checkAuth } from '../middleware/auth.js'
import * as authCtrl from '../controllers/auth.js'

const router = Router()

const authLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => res.status(429).json({ err: 'Too many attempts. Try again in a minute.' }),
})

/*---------- Public Routes ----------*/
router.post('/signup', authLimiter, authCtrl.signup)
router.post('/login', authLimiter, authCtrl.login)

/*---------- Protected Routes ----------*/
router.use(decodeUserFromToken)
router.post('/change-password', checkAuth, authCtrl.changePassword)

export { router }
