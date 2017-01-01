const fs = require('fs')
const path = require('path')
const caller = require('grpc-caller')
const hl = require('highland')
const JSONStream = require('JSONStream')

const DBFILE = 'secret_data.json'
const PROTO_PATH = path.resolve(__dirname, '../protos/secret.proto')
const HOSTPORT = '0.0.0.0:50051'
const client = caller(HOSTPORT, PROTO_PATH, 'SecretService')

function main () {
  const call = client.processSecrets((err, result) => {
    if (err) console.log(err)
    console.dir(result)
    process.exit(0)
  })

  const input = fs.createReadStream(DBFILE)

  hl(input)
    .through(JSONStream.parse('*'))
    .each(d => call.write(d))
    .done(() => call.end())
}

main()
