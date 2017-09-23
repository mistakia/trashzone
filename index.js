const path = require('path')

const express = require('express')
const Logger = require('logplease') 

const api = require('./api')

const logger = Logger.create('server') 
const app = express()
const http = require('http').createServer(app)

app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*')
  res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,OPTIONS')
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, Content-Length, X-Requested-With')

  if ('OPTIONS' === req.method || '/health_check' === req.path) {
    res.sendStatus(200)
  } else {
    next()
  }
})
app.use('/api', api)
app.get('/coenwulf', (req, res) => {
  res.sendFile(path.resolve('features/coenwulf/dist/index.html'))
})
app.use('/', express.static(path.join(__dirname, 'client/dist')))
/* app.get('/', (req, res) => {
 *   res.sendFile(path.resolve('client/dist/index.html'))
 * })
 * */
const PORT = process.env.PORT || 3000
http.listen(PORT, () => {
  logger.info(`listening on *:${PORT}`)  
})
