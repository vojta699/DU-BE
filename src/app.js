const express = require('express')
const router = require('./controllers/router')
const mongoose = require('mongoose');


const app = express()

// Připojení k MongoDB
if (process.env.NODE_ENV !== 'test') {
    mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true })
        .then(() => console.log('Connected to MongoDB'))
        .catch((err) => console.log('Error connecting to MongoDB:', err));
}
// Trasy
app.get('/', (req, res) => {
    res.send('Hello World!')
})

app.use(express.json({
    limit: '1mb'
}))
app.use((req, res, next) => {
    console.log(`${req.method} ${req.originalUrl} ${JSON.stringify(req.body)}`)
    next()
})

app.use('/', router)

module.exports = app