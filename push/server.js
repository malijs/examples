const path = require('path')
const _ = require('lodash')
const hl = require('highland')
const Mali = require('mali')
const logger = require('mali-logger')
const first = require('ee-first')

const widgetSource = require('./widget_source')
const updateSource = require('./update_source')

const PROTO_PATH = path.resolve(__dirname, '../protos/push.proto')
const HOSTPORT = '0.0.0.0:50051'

let app = null
const updater = new updateSource.WidgetUpdater()
const clients = {}

function disconnectHandler (req, res) {
  const ee = first([
    [res, 'close', 'error']
  ], err => {
    console.log(`client ${req.id} disconnected`)
    if (err) {
      console.error(`client ${req.id} errored ${err}`)
    }
    delete clients[req.id]
    ee.cancel()
  })
}

function writeWidget (id, widget) {
  if (clients[id]) {
    clients[id].write(widget)
  }
}

async function syncWidgets (ctx) {
  const req = ctx.req
  const id = req.id
  console.log(`client ${id} connected`)
  const widgets = await widgetSource.getUpdatedWidgets(ctx.since)
  clients[id] = ctx.call
  ctx.res = hl(widgets).each(w => writeWidget(id, w))
  disconnectHandler(req, ctx.call)
}

function updateHandler (widget) {
  const ids = _.keys(clients)
  _.each(ids, id => writeWidget(id, widget))
}

function status () {
  setInterval(() => {
    const n = _.keys(clients).length
    console.log(`connected clients: ${n}`)
  }, 30000)
}

function main () {
  app = new Mali(PROTO_PATH, 'PushService')
  app.use(logger())
  app.use({ syncWidgets })
  app.start(HOSTPORT)

  updater.on('widget_updated', updateHandler)
  updater.start()

  status()

  console.log(`Push Service service running @ ${HOSTPORT}`)
}

function shutdown (err) {
  if (err) {
    console.error(err)
  }

  updater.stop()
  app.close().then(() => process.exit())
}

process.on('uncaughtException', shutdown)
process.on('SIGINT', shutdown)
process.on('SIGTERM', shutdown)

main()
