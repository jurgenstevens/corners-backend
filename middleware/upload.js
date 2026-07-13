import multer from 'multer'

const storage = multer.memoryStorage()

export const uploadPDF = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter(req, file, cb) {
    if (file.mimetype === 'application/pdf') cb(null, true)
    else cb(new Error('Only PDF files are allowed'))
  },
}).single('catalog')

export const uploadImage = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter(req, file, cb) {
    if (['image/jpeg', 'image/png', 'image/webp'].includes(file.mimetype)) cb(null, true)
    else cb(new Error('Only JPEG, PNG, and WebP images are allowed'))
  },
}).single('image')
