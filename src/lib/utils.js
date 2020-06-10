'use strict'
/**
 * Utilities
 ******************************/

const { sign } = require('tweetnacl'),
  { SIGNATURE_EXPIRE_TIME } = require('../../config')

// Converts a string into a Uint8Array
function strToUint8 (hex) {
  return Uint8Array.from(Buffer.from(hex))
}

// Converts a hex string into a Uint8Array
function hexToUint8 (hex) {
  return Uint8Array.from(Buffer.from(hex, 'hex'))
}

// Verifies a pgp signature is valid and not expired and returns the userId
exports.verifyAuth = async (publicKey, timestamp, signature) => {
  // Fail verification if all params are not supplied
  if (!publicKey || !timestamp || !signature) return false

  // Validate signature
  const validSig = sign.detached.verify(
    strToUint8(timestamp),
    hexToUint8(signature),
    hexToUint8(publicKey)
  )

  // Check if signature has expired (is older than SIGNATURE_EXPIRE_TIME)
  const signatureTime = new Date(timestamp)
  const isExpired = new Date() - signatureTime > SIGNATURE_EXPIRE_TIME

  return validSig && !isExpired
}
