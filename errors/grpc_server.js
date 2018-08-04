const _ = require('lodash')
const protoLoader = require('@grpc/proto-loader')
const grpc = require('grpc')
const path = require('path')

const PROTO_PATH = path.resolve(__dirname, '../protos/errorexample.proto')
const HOSTPORT = '0.0.0.0:50051'

const pd = protoLoader.loadSync(PROTO_PATH)
const loaded = grpc.loadPackageDefinition(pd)
const example = loaded.ErrorExample

function listWidgets (call) {
  const widgets = [
    { name: 'w1' },
    { name: 'w2' },
    { name: 'w3' },
    new Error('boom!'),
    { name: 'w4' },
    new Error('Another boom!'),
    { name: 'w5' },
    { name: 'w6' }
  ]

  _.each(widgets, w => {
    if (w instanceof Error) {
      const { message } = w
      call.write({ error: { message } })
    } else {
      call.write({ widget: w })
    }
  })
  call.end()
}

function getWidget (call, fn) {
  const { id } = call.request
  if (id && id % 2 === 0) {
    return fn(new Error('boom!'))
  }
  fn(null, { name: `w${id}` })
}

function createWidgets (call, fn) {
  let created = 0
  call.on('data', d => created++)
  call.on('end', () => {
    if (created && created % 2 === 0) {
      return fn(new Error('boom!'))
    }
    fn(null, { created })
  })
}

function syncWidgets (call) {
  let counter = 0
  call.on('data', d => {
    counter++
    if (d.widget) {
      console.log('data: %s', d.widget.name)
      call.write({ widget: { name: d.widget.name.toUpperCase() } })
    } else if (d.error) {
      console.error('Error: %s', d.error.message)
    }
    if (counter % 4 === 0) {
      call.write({ error: { message: `Boom ${counter}!` } })
    }
  })
  call.on('end', () => {
    call.end()
  })
}

function main () {
  const server = new grpc.Server()
  server.addService(example.SampleService.service, {
    getWidget,
    getWidget2: getWidget,
    listWidgets,
    createWidgets,
    syncWidgets
  })
  server.bind(HOSTPORT, grpc.ServerCredentials.createInsecure())
  server.start()
}

main()
