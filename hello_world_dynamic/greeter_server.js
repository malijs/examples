const path = require('path')
const Mali = require('mali')

const PROTO_PATH = path.resolve(__dirname, '../protos/helloworld.proto')
const HOSTPORT = '0.0.0.0:50051'

/**
 * Implements the SayHello RPC method.
 */
function sayHello (ctx) {
  ctx.res = { message: 'Hello ' + ctx.req.name }
}

/**
 * Starts an RPC server that receives requests for the Greeter service at the
 * sample server port
 */
function main () {
  const app = new Mali(PROTO_PATH, 'Greeter')
  app.use({ sayHello })
  app.start(HOSTPORT)
  console.log(`Greeter service running @ ${HOSTPORT}`)
}

main()
