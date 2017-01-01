const os = require('os')
const pify = require('pify')
const fs = require('fs')
const appendFile = pify(fs.appendFile)
const Chance = require('chance')
const chance = new Chance()

const DB_WRITE_FILE = 'secret_db_write.json'

async function save (id, data) {
  if (!id || typeof id !== 'string') throw new Error('ID required')
  if (!data || typeof data !== 'string') throw new Error('Data required')

  const fakeError = chance.bool({ likelihood: 5 })
  if (fakeError) throw new Error('Error saving data')

  await appendFile(DB_WRITE_FILE, id.concat(':', data, os.EOL), 'utf8')
  return id
}

module.exports = save
