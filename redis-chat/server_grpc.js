const path = require('path')
const grpc = require('grpc')
const protoLoader = require('@grpc/proto-loader')
const Redis = require('ioredis')
const { Transform } = require('stream')

const redis = new Redis()

const PROTO_PATH = path.resolve(__dirname, '../protos/redischat.proto')
const HOSTPORT = '0.0.0.0:50051'

const packageDefinition = protoLoader.loadSync(PROTO_PATH)
const redischat = grpc.loadPackageDefinition(packageDefinition).redischat

function scan (call) {
  var key = call.request.key

  const upper = new Transform({
    writableObjectMode: true,
    readableObjectMode: true,
    transform (keys, encoding, callback) {
      for (const key of keys) {
        console.log(`sending: ${key}`)
        call.write({ key })
      }
      callback()
    }
  })

  redis
    .scanStream({ match: key })
    .pipe(upper)
    .on('finish', () => {
      call.end()
    })
}

function setupRedisData () {
  for (let i = 0; i < 20; i++) {
    redis.set(`foo:${i}`, `bar${i}`)
  }
}

function getServer () {
  setupRedisData()

  const server = new grpc.Server()
  server.addService(redischat.RedisChat.service, {
    scan
  })
  return server
}
var routeServer = getServer()
routeServer.bind(HOSTPORT, grpc.ServerCredentials.createInsecure())
routeServer.start()
