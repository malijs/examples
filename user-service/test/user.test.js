import test from 'ava'
import path from 'path'
import caller from 'grpc-caller'
import sprom from 'sprom'

import User from '../user'

const users = require('../user_db.json')

const PROTO_PATH = path.resolve(__dirname, '../../protos/user.proto')
const HOSTPORT = '0.0.0.0:50051'
const client = caller(HOSTPORT, PROTO_PATH, 'UserService')

test('get existing user', async t => {
  t.plan(2)
  const response = await client.getUser({ id: '1d78202b-23cf-4d1e-92ac-2d2f76278a7d' })
  t.truthy(response)
  const user = new User(response)
  t.deepEqual(user.metadata, {
    foo: 'bar',
    active: true
  })
})

test('get all users', async t => {
  const nusers = users.length
  t.plan(nusers + 1)
  const call = await client.listUsers()
  let counter = 0
  call.on('data', (data) => {
    const u = new User(data)
    t.truthy(u.id)
    counter++
  })

  await sprom(call)
  t.is(counter, nusers)
})

test('create user', async t => {
  t.plan(5)
  const data = {
    email: 'test@test.com',
    dateOfBirth: new Date('1/1/2000').toISOString(),
    password: 's3crE+1',
    metadata: new Buffer(JSON.stringify({foo: 'bar'}))
  }

  const ret = await client.createUser(data)
  t.truthy(ret)
  t.truthy(ret.id)
  const r = new User(ret)
  t.truthy(r.metadata)
  t.truthy(r.metadata.foo)
  t.is(r.metadata.foo, 'bar')
})
