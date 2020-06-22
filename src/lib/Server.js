'use strict'
/**
 * WebSocket Server
 * Provides discovery and signalling
 * See ../schema/message.json for the protocol
 ******************************/

const url = require('url'),
  { EventEmitter } = require('events'),
  { verifyAuth } = require('./utils'),
  WebSocketServer = require('ws').Server,
  Ajv = require('ajv'),
  messageSchema = require('../schema/message.json')

const ajv = new Ajv()
const validateMessage = ajv.compile(messageSchema)

class Server extends EventEmitter {
  constructor (httpServer, store) {
    super()

    this._peers = store
    this._server = new WebSocketServer({
      clientTracking: false,
      noServer: true
    })
    // bindings
    this._onPeerConnection = this._onPeerConnection.bind(this)
    this._authenticatePeer = this._authenticatePeer.bind(this)
    // Add event handlers
    this._server.on('connection', this._onPeerConnection)
    this._server.on('error', this._onServerError)
    // Authenticate when peer tries to establish a websocket connection
    httpServer.on('upgrade', this._authenticatePeer)
  }

  // Authenticates a peer attempting to connect
  async _authenticatePeer (request, socket, head) {
    // Parse authentication request
    const query = url.parse(request.url, true).query
    const { publicKey, timestamp, signature } = query
    // Verify signature
    const isValid = await verifyAuth(publicKey, timestamp, signature)
    if (!isValid) {
      console.log('Authentication failed for ' + publicKey)
      // Invalid so reject connection
      socket.destroy()
      return
    }
    // Valid so connect to peer
    this._server.handleUpgrade(request, socket, head, ws => {
      this._server.emit('connection', ws, publicKey)
    })
  }

  // Handles server errors
  _onServerError (error) {
    this.emit('error', error)
  }

  // Handles new peer connections
  _onPeerConnection (peer, peerId) {
    console.debug('New peer connection ' + peerId)

    peer = this._addPeer(peer, peerId)

    // Add event handlers for peer communication
    peer.on('message', data => this._onPeerMessage(peer, data))
    peer.on('error', error => this._onPeerError(peer, error))
    peer.on('close', (code, message) => this._onPeerClose(peer, code, message))
  }

  // Handles errors with a peer connection
  _onPeerError (peer, error) {
    peer._emit('error', error)
  }

  // Validates the message from a peer
  // returns the message parsed if valid
  _validatePeerMessage (peer, data) {
    let msg
    // Validate JSON type
    try {
      msg = JSON.parse(data)
    } catch (err) {
      peer._emit('invalid-json')
      console.warn('Invalid JSON from peer', peer.id)
      return null
    }

    // Validate message format
    if (!validateMessage(msg)) {
      peer._emit('invalid-message')
      console.warn('Invalid message from peer', peer.id)
      return null
    }

    // Validate identity
    if (msg.senderId !== peer.id) {
      peer._emit('unauthorized')
      console.warn('Unauthorized senderId from peer', peer.id)
      return null
    }

    return msg
  }

  // Handles new messages received from a peer
  _onPeerMessage (peer, data) {
    const msg = this._validatePeerMessage(peer, data)
    // Invalid message
    if (!msg) return

    const { senderId, receiverId, type } = msg

    // Check if recipient is connected
    if (!this._isConnected(receiverId)) {
      peer._emit('not-found', { type, receiverId })
      console.debug(`Not Found: receiver ${receiverId} from ${senderId}`)
      return
    }

    // Signal to receiving peer
    this._peers.get(receiverId)._emit(type, msg)
    console.info(`Sent signal to peer ${receiverId} from ${senderId} (${type})`)
  }

  // Handles connection closure with a peer
  _onPeerClose (peer, code, message) {
    if (!!peer.id && this._isConnected(peer.id)) {
      // Remove the peer from the local peers list
      this._peers.del(peer.id)
      console.log(this._peers.keys())
      console.info(`Removed peer ${peer.id} ${code} ${message}`)
    }
  }

  // Adds a peer to connected peers
  _addPeer (peer, peerId) {
    peer.id = peerId
    // Attach an 'event emitter' to peer for responses from server
    peer._emit = (event, data) => {
      let response = { event }
      if (data) response.data = data
      peer.send(JSON.stringify(response))
    }

    this._peers.set(peerId, peer)
    console.info(`Added peer connection ${peerId}`)
    return peer
  }

  // Checks if a peer is currently connected
  _isConnected (peerId) {
    return this._peers.has(peerId)
  }
}

exports = module.exports = Server
