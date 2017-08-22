const jsf = require('json-schema-faker')
const _ = require('lodash')
const hl = require('highland')
const pTimes = require('p-times')
const Chance = require('chance')
const chance = new Chance()

jsf.extend('chance', () => chance)
const schema = require('./widget.json')

async function generateWidget () {
  return jsf.resolve(schema)
}

async function getUpdatedWidgets (since) {
  return pTimes(_.random(1, 10), generateWidget)
}

module.exports = {
  getUpdatedWidgets,
  generateWidget
}
