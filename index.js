'use strict'
/**
 * Runs the server
 ******************************/

const http = require('http'),
  LRU = require('lru-cache'),
  options = {
    max: 500,
    maxAge: 1000 * 60 * 60,
    dispose: function (key, n) {
      n.close(1000, 'Session expired')
    }
  },
  cache = new LRU(options),
  Server = require('./src/lib/Server'),
  release = require('./package.json'),
  { ENV, PORT } = require('./config')

/**
 * Create server
 **/
const httpServer = http.createServer((req, res) => {
  console.info(`--> ${req.method} ${req.url}`)
  res.end('Wubba lubba dub dub!')
})
const server = new Server(httpServer, cache)
// Catch all errors
server.on('error', console.error)

/**
 * Start server
 **/
httpServer.listen(PORT, () => {
  console.info(`Started for Ciphora Server (${release.version}) - ${ENV}`)
  console.info(`Running on port ${PORT}`)
})
