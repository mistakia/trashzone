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
app.get('/odds', (req, res) => {
  res.sendFile(path.resolve('features/odds/dist/index.html'))
})
app.get('/draft', (req, res) => {
  res.sendFile(path.resolve('features/draft/dist/index.html'))
})
app.get('/trade', (req, res) => {
  res.sendFile(path.resolve('features/trade/dist/index.html'))
})
app.get('/rankings', (req, res) => {
  res.sendFile(path.resolve('features/rankings/dist/index.html'))
})
app.get('/league', (req, res) => {
  res.sendFile(path.resolve('features/league/dist/index.html'))
})
app.use('/data', express.static(path.join(__dirname, 'data')))
app.use('/', express.static(path.join(__dirname, 'static')))
app.get('/', (req, res) => {
  res.sendFile(path.resolve('client/dist/index.html'))
})

const PORT = process.env.PORT || 3000
http.listen(PORT, () => {
  logger.info(`listening on *:${PORT}`)
})
