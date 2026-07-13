import cloudinary from '../config/cloudinary.js'

export async function uploadImage(req, res) {
  try {
    const options = {
      folder: 'corners',
      allowed_formats: ['jpg', 'jpeg', 'png', 'webp'],
      transformation: [{ width: 1200, height: 1200, crop: 'limit' }],
    }
    const result = await new Promise((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream(options, (err, result) => {
        if (err) reject(err)
        else resolve(result)
      })
      stream.end(req.file.buffer)
    })
    res.json({ url: result.secure_url })
  } catch (err) {
    console.error('uploadImage error:', err)
    res.status(500).json({ err: err.message })
  }
}
