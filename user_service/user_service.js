const path = require('path')
const hl = require('highland')
const Mali = require('mali')

const createError = require('create-grpc-error')
const apikey = require('mali-apikey')
const logger = require('mali-logger')
const toJSON = require('mali-tojson')
const User = require('./user')

const PROTO_PATH = path.resolve(__dirname, '../protos/user.proto')
const HOSTPORT = '0.0.0.0:50051'

async function getUser (ctx) {
  const user = await User.findById(ctx.req.id)
  ctx.res = user
}

async function listUsers (ctx) {
  const users = await User.list()
  ctx.res = hl(users).map(u => u.toJSON())
}

async function createUser (ctx) {
  const user = new User(ctx.req)
  ctx.res = await user.save()
}

let app

function main () {
  app = new Mali(PROTO_PATH, 'UserService')

  const apiKeyErrorMetadata = { type: 'AUTH', code: 'INVALID_APIKEY' }
  app.use(logger())
  app.use(apikey({ error: { metadata: apiKeyErrorMetadata } }, async (key, ctx, next) => {
    if (key !== '654321') throw createError('Not Authorized', apiKeyErrorMetadata)
    await next()
  }))
  app.use(toJSON)
  app.use({
    getUser,
    listUsers,
    createUser
  })

  app.start(HOSTPORT)
  console.log(`User service running @ ${HOSTPORT}`)
}

function shutdown (err) {
  if (err) {
    console.error(err)
  }

  app.close().then(() => {
    process.exit()
  })
}

process.on('uncaughtException', shutdown)
process.on('SIGINT', shutdown)
process.on('SIGTERM', shutdown)

main()
