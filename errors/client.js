const path = require('path')
const async = require('async')
const grpc = require('grpc')

const PROTO_PATH = path.resolve(__dirname, '../protos/errorexample.proto')
const HOSTPORT = '0.0.0.0:50051'

const loaded = grpc.load(PROTO_PATH)
const client = new loaded.ErrorExample.SampleService(HOSTPORT, grpc.credentials.createInsecure())

function getWidgetOK (fn) {
  client.getWidget({ id: 0 }, (err, data) => {
    if (err) {
      console.error('Error: %s', err)
      return fn()
    }
    console.log(data)
    fn()
  })
}

function getWidgetError (fn) {
  client.getWidget({ id: 4 }, (err, data) => {
    if (err) {
      console.error('Error: %s', err)
      return fn()
    }
    console.log(data)
    fn()
  })
}

function listWidgets (fn) {
  const call = client.listWidgets({ id: 3 })
  call.on('data', d => {
    console.log(d)
  })
  call.on('error', err => {
    console.error('Error: %s', err)
  })
  call.on('end', fn)
}

function listWidgetsError (fn) {
  const call = client.listWidgets({ id: 8 })
  call.on('data', d => {
    if (d.widget) {
      console.log(d.widget)
    } else if (d.error) {
      console.log('Data error: %s', d.error.message)
    }
  })
  call.on('error', err => {
    console.error('Client error: %s', err)
  })
  call.on('end', fn)
}

function createWidgets (fn) {
  const call = client.createWidgets((err, res) => {
    if (err) {
      console.error('Error: %s', err)
      return fn()
    }
    console.log(res)
  })

  const widgets = [
    { name: 'w1' },
    { name: 'w2' },
    { name: 'w3' }
  ]

  widgets.forEach(w => call.write(w))
  call.end()
  fn()
}

function createWidgetsError (fn) {
  const call = client.createWidgets((err, res) => {
    if (err) {
      console.error('Error: %s', err)
      return fn()
    }
    console.log(res)
  })

  const widgets = [
    { name: 'w1' },
    { name: 'w2' },
    { name: 'w3' },
    { name: 'w4' }
  ]

  widgets.forEach(w => call.write(w))
  call.end()
}

function syncWidgets (fn) {
  const call = client.syncWidgets()
  call.on('data', d => {
    if (d.widget) {
      console.log(d.widget)
    } else if (d.error) {
      console.log('Data error: %s', d.error.message)
    }
  })
  call.on('error', err => {
    console.error('Client error: %s', err)
  })
  const widgets = [
    { name: 'w1' },
    { name: 'w2' },
    { name: 'w3' }
  ]

  widgets.forEach(w => call.write({ widget: w }))
  call.end()
  fn()
}

function syncWidgetsError (fn) {
  const call = client.syncWidgets()
  call.on('data', d => {
    if (d.widget) {
      console.log(d.widget)
    } else if (d.error) {
      console.log('Data error: %s', d.error.message)
    }
  })
  call.on('error', err => {
    console.error('Client error: %s', err)
  })
  const widgets = [
    { name: 'w1' },
    new Error('Client Boom 1'),
    { name: 'w2' },
    { name: 'w3' },
    { name: 'w4' },
    new Error('Client Boom 2'),
    { name: 'w5' }
  ]

  widgets.forEach(w => {
    if (w instanceof Error) {
      const { message } = w
      call.write({ error: { message } })
    } else {
      call.write({ widget: w })
    }
  })
  call.end()
  fn()
}

function main () {
  async.series([
    getWidgetOK,
    getWidgetError,
    listWidgets,
    listWidgetsError,
    createWidgets,
    createWidgetsError,
    syncWidgets,
    syncWidgetsError
  ], () => {
    console.log('done!')
  })
}

main()
