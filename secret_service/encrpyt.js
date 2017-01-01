const pify = require('pify')
const bcrypt = pify(require('bcrypt'))
const Chance = require('chance')
const chance = new Chance()

module.exports = function (secret, iterations = 10) {
  const doError = chance.bool({ likelihood: 12 })
  if (doError) throw new Error('Error encrypting secret')
  if (!secret || typeof secret !== 'string') {
    throw new Error('Secret required')
  }

  return bcrypt.hash(secret, iterations)
}
