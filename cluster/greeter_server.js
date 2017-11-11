const cluster = require('cluster')
const path = require('path')
const _ = require('lodash')
const Mali = require('mali')
const numCPUs = require('os').cpus().length

const PROTO_PATH = path.resolve(__dirname, '../protos/helloworld.proto')

function getPort () {
  return _.random(1000, 60000)
}

function getHostport (port) {
  return '0.0.0.0:'.concat(port || getPort())
}

if (cluster.isMaster) {
  console.log(`Master ${process.pid} is running`)

  // Fork workers.
  for (let i = 0; i < numCPUs; i++) {
    cluster.fork()
  }

  cluster.on('exit', (worker, code, signal) => {
    console.log(`worker ${worker.process.pid} died`)
  })
} else {
  main()
}

/**
 * Implements the SayHello RPC method.
 */
function sayHello (ctx) {
  console.log(`${process.pid} got request with name: ${ctx.req.name}`)
  ctx.res = { message: `Hello ${ctx.req.name}` }
}

/**
 * Starts an RPC server that receives requests for the Greeter service at the
 * sample server port
 */
function main () {
  const HOSTPORT = getHostport()
  const app = new Mali(PROTO_PATH, 'Greeter')
  app.use({ sayHello })
  app.start(HOSTPORT)
  console.log(`Greeter service ${process.pid} running @ ${HOSTPORT}`)
}
