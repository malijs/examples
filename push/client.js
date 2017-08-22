const path = require('path')
const caller = require('grpc-caller')
const Chance = require('chance')
const chance = new Chance()

const PROTO_PATH = path.resolve(__dirname, '../protos/push.proto')
const HOSTPORT = '0.0.0.0:50051'
const client = caller(HOSTPORT, PROTO_PATH, 'PushService')

const id = chance.guid()
const data = { id, datetime: new Date().getTime() }

async function main () {
  const call = await client.syncWidgets(data)
  call.on('data', (data) => {
    console.log(`client ${id} got data %j`, data)
  })
}

main()
