var path = require('path')
const protoLoader = require('@grpc/proto-loader')
const grpc = require('grpc')

const PROTO_PATH = path.resolve(__dirname, '../protos/redischat.proto')

const pd = protoLoader.loadSync(PROTO_PATH)
const loaded = grpc.loadPackageDefinition(pd)
const redischat = loaded.redischat

function main () {
  const client = new redischat.RedisChat('localhost:50051', grpc.credentials.createInsecure())
  const call = client.scan({ key: 'foo:*' })
  let count = 0

  call.on('data', function (d) {
    count++
    console.log(d)
  })

  call.on('end', () => {
    console.log(`count: ${count}`)
  })
}

main()
