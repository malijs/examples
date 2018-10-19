const path = require('path')
const Mali = require('mali')
const Redis = require('ioredis')
const { Transform } = require('stream')

const redis = new Redis()

const PROTO_PATH = path.resolve(__dirname, '../protos/redischat.proto')
const HOSTPORT = '0.0.0.0:50051'

const upper = new Transform({
  writableObjectMode: true,
  readableObjectMode: true,
  transform (keys, encoding, callback) {
    for (const key of keys) {
      console.log(`sending: ${key}`)
      this.push({ key })
    }
    callback()
  }
})

function scan (ctx) {
  ctx.res = redis.scanStream({ match: ctx.req.key }).pipe(upper)
}

function setupRedisData () {
  for (let i = 0; i < 20; i++) {
    redis.set(`foo:${i}`, `bar${i}`)
  }
}

function main () {
  setupRedisData()

  const app = new Mali(PROTO_PATH, 'RedisChat')
  app.use({ scan })
  app.start(HOSTPORT)
  console.log(`RedisChat service running @ ${HOSTPORT}`)
}

main()
