const Mali = require('mali')

const messages = require('./helloworld_pb')
const services = require('./helloworld_grpc_pb')

const HOSTPORT = '0.0.0.0:50051'

/**
 * Implements the SayHello RPC method.
 */
function sayHello (ctx) {
  const reply = new messages.HelloReply()
  reply.setMessage('Hello ' + ctx.req.getName())
  ctx.res = reply
}

/**
 * Starts an RPC server that receives requests for the Greeter service at the
 * sample server port
 */
function main () {
  const app = new Mali(services, 'GreeterService')
  app.use({ sayHello })
  app.start(HOSTPORT)
  console.log(`Greeter service running @ ${HOSTPORT}`)
}

main()
