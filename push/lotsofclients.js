const path = require('path')
const caller = require('grpc-caller')
const Chance = require('chance')
const chance = new Chance()

const PROTO_PATH = path.resolve(__dirname, '../protos/push.proto')
const HOSTPORT = '0.0.0.0:50051'
const NUM_CLIENTS = 100

async function main () {
  for (let i = 0; i < NUM_CLIENTS; i++) {
    let delay = chance.integer({ min: 100, max: 10000 })
    setTimeout(async() => {
      const client = caller(HOSTPORT, PROTO_PATH, 'PushService')
      const id = chance.guid()
      const data = { id, timestamp: new Date().getTime() }
      const call = await client.syncWidgets(data)
      call.on('data', data => {
        console.log(`client ${id} got widget %j`, data)
      })
    }, delay)
  }
}

main()
