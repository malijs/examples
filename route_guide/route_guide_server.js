const path = require('path')
const hl = require('highland')
const _ = require('lodash')
const Mali = require('mali')
const pify = require('pify')
const fs = pify(require('fs'))
const logger = require('mali-logger')
const asCallback = require('ascallback')
const pFinally = require('p-finally')
const miss = require('mississippi')

const db = require('./feature_db')
const { getDistance, pointKey } = require('./route_utils')

const PROTO_PATH = path.resolve(__dirname, '../protos/route_guide.proto')
const HOSTPORT = '0.0.0.0:50051'

/**
 * getFeature request handler. Gets a request with a point, and responds with a
 * feature object indicating whether there is a feature at that point.
 * @param {Object} ctx Context or point
 */
async function getFeature (ctx) {
  const point = ctx.req
  let feature = await db.checkFeature(point)
  if (!feature) {
    feature = {
      name: '',
      location: point
    }
  }

  ctx.res = feature
}

/**
 * listFeatures request handler. Gets a request with two points, and responds
 * with a stream of all features in the bounding box defined by those points.
 */
async function listFeatures (ctx) {
  const lo = ctx.req.lo
  const hi = ctx.req.hi

  const left = _.min([lo.longitude, hi.longitude])
  const right = _.max([lo.longitude, hi.longitude])
  const top = _.max([lo.latitude, hi.latitude])
  const bottom = _.min([lo.latitude, hi.latitude])

  const input = await db.getFeaturesListStream()

  const ret = hl(input).filter(feature => {
    if (feature.name === '') {
      return false
    }
    if (feature.location.longitude >= left &&
      feature.location.longitude <= right &&
      feature.location.latitude >= bottom &&
      feature.location.latitude <= top) {
      return true
    }
  })

  ctx.res = ret
}

async function statsMapper (point) {
  let feature = await db.checkFeature(point)
  if (!feature) {
    feature = {
      name: '',
      location: point
    }
  }
  return {
    point,
    feature
  }
}

// to be used because we don't have highland asyncWrapper
function statsMappedCb (point, fn) {
  asCallback(Promise.resolve(statsMapper(point)), fn)
}

/**
 * recordRoute handler. Gets a stream of points, and responds with statistics
 * about the "trip": number of points, number of known features visited, total
 * distance traveled, and total time spent.
 */
async function recordRoute (ctx) {
  // TODO we need to wait for Highland flatReduce
  // to be able to use async reduce iterator
  // for now we'll just async map to get features if present
  // TODO wrapAsync is not present in highland beta.3 yet
  // So use callback style using statsMappedCb

  const iv = {
    point_count: 0,
    feature_count: 0,
    distance: 0,
    previous: null
  }

  const mapper = hl.wrapCallback(statsMappedCb)

  const startTime = process.hrtime()

  return new Promise((resolve, reject) => {
    hl(ctx.req)
      .map(mapper)
      .series()
      .reduce((memo, data) => {
        memo.point_count += 1
        if (data.feature && data.feature.name) {
          memo.feature_count += 1
        }

        if (memo.previous != null) {
          memo.distance += getDistance(memo.previous, data.point)
        }
        memo.previous = data.point
        return memo
      }, iv)
      .toCallback((err, r) => {
        if (err) {
          return reject(err)
        }

        ctx.res = {
          point_count: r.point_count,
          feature_count: r.feature_count,
          // Cast the distance to an integer
          distance: r.distance | 0,
          // End the timer
          elapsed_time: process.hrtime(startTime)[0]
        }
        resolve()
      })
  })
}

async function handleNode (ctx, note) {
  const key = pointKey(note.location)
  const existing = await db.getNote(key)
  if (existing) {
    _.each(existing.value, n => ctx.res.write(n))
  }

  return db.putNote(key, note)
}

function handleNoteCb (ctx, note, fn) {
  asCallback(handleNode(ctx, note), fn)
}

/**
 * routeChat handler. Receives a stream of message/location pairs, and responds
 * with a stream of all previous messages at each of those locations.
 */
async function routeChat (ctx) {
  const p = _.partial(handleNoteCb, ctx)
  miss.each(ctx.req, p, () => {
    ctx.res.end()
  })
}

let app

function main () {
  fs.truncate('route_guide_db_notes.json', 0).then(() => {
    app = new Mali(PROTO_PATH, 'RouteGuide')
    app.use(logger())
    app.use({
      getFeature,
      listFeatures,
      recordRoute,
      routeChat
    })
    app.start(HOSTPORT)
    console.log(`Route Guide service running @ ${HOSTPORT}`)
  })
}

function shutdown (err) {
  if (err) {
    console.error(err)
  }

  const p = fs
    .truncate('route_guide_db_notes.json', 0)
    .then(app.close())

  pFinally(p, () => process.exit())
}

process.on('uncaughtException', shutdown)
process.on('SIGINT', shutdown)
process.on('SIGTERM', shutdown)

main()
