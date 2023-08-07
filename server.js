const express = require('express')
const cors = require('cors')
const morgan = require('morgan')
const bodyParser = require('body-parser')
const errorhandler = require('errorhandler')
const apiRouter = require('./api/api')

const app = express()
const PORT = process.env.PORT || 4000

app.use(bodyParser.json())
app.use(morgan('dev'))
app.use(cors())

app.use('/api', apiRouter)


app.use(errorhandler())
app.listen(PORT, () => {
    console.log('Listening on port ' + PORT)
})

module.exports = app
