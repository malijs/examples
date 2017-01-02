const path = require('path')
const hl = require('highland')
const asCallback = require('ascallback')
const Mali = require('mali')
const logger = require('mali-logger')
const pify = require('pify')
const fs = require('fs')
const truncate = pify(fs.truncate)

const encrypt = require('./encrpyt')
const save = require('./save')

const PROTO_PATH = path.resolve(__dirname, '../protos/secret.proto')
const HOSTPORT = '0.0.0.0:50051'

async function processSecretAsync (id, secret) {
  const data = await encrypt(secret)
  const r = await save(id, data)
  return r
}

// to be used because we don't have highland async wrapper
function processSecretCb (data, fn) {
  asCallback(processSecretAsync(data.id, data.secret), (err, r) => {
    if (err) err.id = data.id
    fn(err, r)
  })
}

async function processSecrets (ctx) {
  const processSercret = hl.wrapCallback(processSecretCb)

  const failed = []
  return new Promise((resolve, reject) => {
    hl(ctx.req)
      .map(processSercret)
      .parallel(10)
      .errors((err, push) => {
        if (err.id) {
          failed.push({ id: err.id, message: err.message })
          push(null)
        } else push(err)
      })
      .compact()
      .reduce(m => ++m, 0)
      .toCallback((err, success) => {
        if (err) return reject(err)
        ctx.res = { success, failed }
        resolve()
      })
  })
}

let app

function main () {
  app = new Mali(PROTO_PATH, 'SecretService')

  app.use(logger())
  app.use({ processSecrets })

  app.start(HOSTPORT)
  console.log(`Secret service running @ ${HOSTPORT}`)
}

async function shutdown (err) {
  if (err) console.error(err)

  await truncate('secret_db_write.json', 0)
  await app.close()
  process.exit()
}

process.on('uncaughtException', shutdown)
process.on('SIGINT', shutdown)
process.on('SIGTERM', shutdown)

main()
