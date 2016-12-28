const path = require('path')
const hl = require('highland')
const Mali = require('mali')

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

  app.use(logger())
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
