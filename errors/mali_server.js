const path = require('path')
const hl = require('highland')
const Mali = require('mali')
const miss = require('mississippi')

const PROTO_PATH = path.resolve(__dirname, '../protos/errorexample.proto')
const HOSTPORT = '0.0.0.0:50051'

async function getWidget (ctx) {
  const { id } = ctx.req
  if (id && id % 2 === 0) {
    throw new Error('boom!')
  }
  ctx.res = { name: `w${id}` }
}

async function getWidget2 (ctx) {
  const { id } = ctx.req
  if (id && id % 2 === 0) {
    ctx.res = new Error('boom!')
  } else {
    ctx.res = { name: `w${id}` }
  }
}

async function listWidgets (ctx) {
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

  ctx.res = hl(widgets)
    .map(w => {
      if (w instanceof Error) {
        const { message } = w
        return { error: { message } }
      } else {
        return { widget: w }
      }
    })
}

async function createWidgets (ctx) {
  ctx.res = new Promise((resolve, reject) => {
    hl(ctx.req)
      .toArray(a => {
        const created = a.length
        if (created && created % 2 === 0) {
          return reject(new Error(`boom ${created}!`))
        }
        resolve({ created })
      })
  })
}

async function syncWidgets (ctx) {
  let counter = 0
  miss.each(ctx.req, (d, next) => {
    counter++
    if (d.widget) {
      console.log('data: %s', d.widget.name)
      ctx.res.write({ widget: { name: d.widget.name.toUpperCase() } })
    } else if (d.error) {
      console.error('Error: %s', d.error.message)
    }
    if (counter % 4 === 0) {
      ctx.res.write({ error: { message: `Boom ${counter}!` } })
    }
    next()
  }, () => {
    ctx.res.end()
  })
}

function main () {
  const app = new Mali(PROTO_PATH)
  app.use({
    getWidget,
    getWidget2,
    listWidgets,
    createWidgets,
    syncWidgets
  })
  app.start(HOSTPORT)
  console.log(`Greeter service running @ ${HOSTPORT}`)
}

main()
