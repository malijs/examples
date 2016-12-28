const _ = require('lodash')
const hl = require('highland')
const JSONStream = require('JSONStream')
const BB = require('bluebird')
const fs = BB.promisifyAll(require('fs'))
const uuid = require('uuid')

const DBFILE = 'user_db.json'

class User {
  constructor (props) {
    _.forOwn(props, (v, k) => { this[k] = v })

    if (this.metadata && _.isEmpty(this.metadata)) {
      delete this.metadata
    }

    if (typeof this.metadata === 'string') {
      this.metadata = JSON.parse(new Buffer(this.metadata, 'base64').toString())
    } else if (Buffer.isBuffer(this.metadata)) {
      this.metadata = JSON.parse(this.metadata.toString())
    }

    if (typeof this.dateOfBirth === 'string') {
      this.dateOfBirth = new Date(this.dateOfBirth)
    }

    if (!this.id) {
      this.id = uuid()
    }
  }

  toObject () {
    const ret = {}
    _.forOwn(this, (v, k) => { ret[k] = v })
    return _.cloneDeep(ret)
  }

  toJSON () {
    const ret = this.toObject()
    delete ret.password

    if (this.metadata) {
      ret.metadata = new Buffer(JSON.stringify(this.metadata))
    }

    if (this.dateOfBirth instanceof Date) {
      ret.dateOfBirth = this.dateOfBirth.toISOString()
    }

    return ret
  }

  // simulates write
  // to a different, untracked file, so we don't mess with git
  async save () {
    const doc = this.toObject()
    await fs.appendFileAsync('user_db_write.json', JSON.stringify(doc), 'utf8')
    return this
  }

  static async findById (id) {
    return new Promise((resolve, reject) => {
      const input = fs.createReadStream(DBFILE)

      hl(input)
        .through(JSONStream.parse('*'))
        .find(u => u.id === id)
        .toCallback((err, data) => {
          if (err) {
            return reject(err)
          }
          resolve(new User(data))
        })
    })
  }

  static list () {
    return hl(fs.createReadStream(DBFILE))
      .through(JSONStream.parse('*'))
      .map(o => new User(o))
  }
}

module.exports = User
