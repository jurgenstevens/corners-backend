import express from 'express'
import { uploadImage as uploadImageMiddleware } from '../middleware/upload.js'
import { uploadImage } from '../controllers/uploads.js'
const router = express.Router()

router.post('/image', uploadImageMiddleware, uploadImage)

export default router
