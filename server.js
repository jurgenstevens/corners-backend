const express = require('express')
const cors = require('cors')
require('dotenv').config()
require('./config/database')

const app = express()

app.use(cors())
app.use(express.json())

app.use('/api/auth', require('./routes/auth'))
app.use('/api/profiles', require('./routes/profiles'))
app.use('/api/products', require('./routes/products'))
app.use('/api/connections', require('./routes/connections'))
app.use('/api/businesses', require('./routes/businesses'))
app.use('/api/notifications', require('./routes/notifications'))

const PORT = process.env.PORT || 3001
app.listen(PORT, () => console.log(`Server running on port ${PORT}`))
