/*
 * This mock some kind of "widget store", which can be either anther service or a
 * database. We can either get all updated widgets since some timestamp, or
 * get a random widget
 */

const jsf = require('json-schema-faker')
const _ = require('lodash')
const pTimes = require('p-times')
const Chance = require('chance')
const chance = new Chance()

jsf.extend('chance', () => chance)
const schema = require('./widget.json')

async function getWidget () {
  return jsf.resolve(schema)
}

async function getUpdatedWidgets (since) {
  return pTimes(_.random(2, 10), getWidget)
}

module.exports = {
  getUpdatedWidgets,
  getWidget
}
