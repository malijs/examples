# Comminicating Errors

This section will cover different ways for communicating errors from server to client.
We will compare traditional gRPC implementations and Mali version.

## Service Definition

```protobuf
syntax = "proto3";

package ErrorExample;

import "status.proto";

service SampleService {
  rpc GetWidget (WidgetRequest) returns (Widget) {}
  rpc GetWidget2 (WidgetRequest) returns (Widget) {}
  rpc ListWidgets (WidgetRequest) returns (stream WidgetStreamObject) {}
  rpc CreateWidgets (stream Widget) returns (WidgetResult) {}
  rpc SyncWidgets (stream WidgetStreamObject) returns (stream WidgetStreamObject) {}
}

message Widget {
  string name = 1;
}

message WidgetStreamObject {
  Widget widget = 1;
  google.rpc.Status error = 2;
}

message WidgetRequest {
  int32 id = 1;
}

message WidgetResult {
  int32 created = 1;
}
```

## UNARY

With gRPC with use the callback in our handler to response with an error to the client.

```js
function getWidget (call, fn) {
  const { id } = call.request
  if (id && id % 2 === 0) {
    return fn(new Error('boom!'))
  }
  fn(null, { name: `w${id}` })
}
```

On client side:

```js
// change id to 4 to cause error
client.getWidget({ id: 0 }, (err, data) => {
  if (err) {
    console.error('Error: %s', err)
    return fn()
  }
  console.log(data)
})
```

With Mali the server implementation becomes just a matter of throwing an error:

```js
async function getWidget (ctx) {
  const { id } = ctx.req
  if (id && id % 2 === 0) {
    throw new Error('boom!')
  }
  ctx.res = { name: `w${id}` }
}
```

If `app.silent` is the default `false` this will log the error in the server application.
We can explicitly set the response to an error which will also communicate the error to the client, but circumvent the error logging.

```js
async function getWidget (ctx) {
  const { id } = ctx.req
  if (id && id % 2 === 0) {
    ctx.res = new Error('boom!')
  } else {
    ctx.res = { name: `w${id}` }
  }
}
```

## REQUEST STREAM

Similarly with request stream in gRPC implementation we use the callback to respond either with a response or an error:

```js
function createWidgets (call, fn) {
  let created = 0
  call.on('data', d => created++)
  call.on('end', () => {
    if (created && created % 2 === 0) {
      return fn(new Error('boom!'))
    }
    fn(null, { created })
  })
}
```

Client implementation:

```js
const call = client.createWidgets((err, res) => {
  if (err) {
    console.error('Error: %s', err)
    return fn()
  }
  console.log(res)
})

const widgets = [
  { name: 'w1' },
  { name: 'w2' },
  { name: 'w3' }
]

widgets.forEach(w => call.write(w))
call.end()
```

With Mali if becomes a matter of returning a Promise that's either resolved with the final response or rejected with an error:

```js
async function createWidgets (ctx) {
  ctx.res = new Promise((resolve, reject) => {
    // using Highland.js
    hl(ctx.req)
      .toArray(a => {
        const created = a.length
        if (created && created % 2 === 0) {
          return reject(new Error(`boom ${created}!`))
        }
        resolve({ created })
      })
  })
}
```

Alternatively, similar to `UNARY` calls, we can resolve with an error to explicitly return an error and circumvent the error logging within the application.

## RESPONSE STREAM



