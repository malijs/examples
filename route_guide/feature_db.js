/*
 * Represents an feature / route db interface
 * We're just doing fs calls to files here to represent
 * async actions using promises and streams
 */

const hl = require('highland')
const JSONStream = require('JSONStream')
const _ = require('lodash')
const BB = require('bluebird')
const fs = BB.promisifyAll(require('fs'))

/**
 * Get a feature object at the given point, or creates one if it does not exist.
 * @param {point} point The point to check
 * @return {feature} The feature object at the point. Note that an empty name
 *     indicates no feature
 */
async function checkFeature (point) {
  return new Promise((resolve, reject) => {
    const input = fs.createReadStream('route_guide_db.json')

    hl(input)
      .through(JSONStream.parse('*'))
      .find(feature =>
        feature.location.latitude === point.latitude &&
        feature.location.longitude === point.longitude)
      .toCallback((err, result) => {
        if (err) {
          return reject(err)
        }
        resolve(result)
      })
  })
}

async function getFeaturesListStream () {
  return fs
    .createReadStream('route_guide_db.json')
    .pipe(JSONStream.parse('*'))
}

async function getNote (key) {
  return new Promise((resolve, reject) => {
    const input = fs.createReadStream('route_guide_db_notes.json')

    hl(input)
      .through(JSONStream.parse('*'))
      .find(v => v && v.key === key)
      .toCallback((err, result) => {
        if (err) {
          return reject(err)
        }
        resolve(result)
      })
  })
}

async function putNote (key, value) {
  const file = await fs.readFileAsync('route_guide_db_notes.json', 'utf8')
  let all = file ? JSON.parse(file) : []
  if (!Array.isArray(all)) {
    console.warn('notes file is not an array')
    all = []
  }
  const existing = _.find(all, v => v && v.key === key)
  if (existing) {
    existing.value.push(value)
  } else {
    const data = { key, value: [value] }
    all.push(data)
  }
  const str = JSON.stringify(all)
  await fs.writeFileAsync('route_guide_db_notes.json', str)
  return value
}

exports.checkFeature = checkFeature
exports.getFeaturesListStream = getFeaturesListStream
exports.getNote = getNote
exports.putNote = putNote
