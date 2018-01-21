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

Similarly with request stream in gRPC server implementation we use the callback to respond either with a response or an error:

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

With response stream calls we can `emit` an error to the response stream. However this would cause a stop to the request. Sometimes this is not desireble if we can detect and control errorous conditions and want to contirnue streaming. In such scenarios we need to setup are responses to include error data. Reviewing our call definition:

```protobuf
rpc ListWidgets (WidgetRequest) returns (stream WidgetStreamObject) {}
```

and our response type:

```
message WidgetStreamObject {
  Widget widget = 1;
  google.rpc.Status error = 2;
}
```

If there was an error in processing the request on a perticular instance of the stream and we want to send that to the client but continue on serving the rest of the request, we can just set the `error` property of the payload. Here we use Google API's [RPC status](https://github.com/googleapis/googleapis/blob/master/google/rpc/status.proto) proto definition to define the error field.

Our gRPC server implementation can look something like the following:

```js
function listWidgets (call) {
  const widgets = [
    { name: 'w1' },
    { name: 'w2' },
    { name: 'w3' },
    new Error('boom!'),
    { name: 'w4' },
    new Error('Another boom!'),
    { name: 'w5' },
    { name: 'w6' }
  ]

  _.each(widgets, w => {
    if (w instanceof Error) {
      const { message } = w
      call.write({ error: { message } })
    } else {
      call.write({ widget: w })
    }
  })
  call.end()
}
```

On client:

```js
const call = client.listWidgets({ id: 8 })

call.on('data', d => {
  if (d.widget) {
    console.log(d.widget)
  } else if (d.error) {
    console.log('Data error: %s', d.error.message)
  }
})

call.on('error', err => {
  console.error('Client error: %s', err)
})

call.on('end', () => console.log('done!'))
```

With Mali we set the response to a stream that's piped to the client. We can use stream utilities such as [Highland.js](http://highlandjs.org/), or others to work with the stream data.

```js
async function listWidgets (ctx) {
  const widgets = [
    { name: 'w1' },
    { name: 'w2' },
    { name: 'w3' },
    new Error('boom!'),
    { name: 'w4' },
    new Error('Another boom!'),
    { name: 'w5' },
    { name: 'w6' }
  ]

  ctx.res = hl(widgets)
    .map(w => {
      if (w instanceof Error) {
        const { message } = w
        return { error: { message } }
      } else {
        return { widget: w }
      }
    })
}
```

## DUPLEX

We can take the same approach with duplex streams.

gRPC server implementation:

```js
function syncWidgets (call) {
  let counter = 0
  call.on('data', d => {
    counter++
    if (d.widget) {
      console.log('data: %s', d.widget.name)
      call.write({ widget: { name: d.widget.name.toUpperCase() } })
    } else if (d.error) {
      console.error('Error: %s', d.error.message)
    }
    if (counter % 4 === 0) {
      call.write({ error: { message: `Boom ${counter}!` } })
    }
  })
  call.on('end', () => {
    call.end()
  })
}
```

Client:

```js
const call = client.syncWidgets()

call.on('data', d => {
  if (d.widget) {
    console.log(d.widget)
  } else if (d.error) {
    console.log('Data error: %s', d.error.message)
  }
})

call.on('error', err => {
  console.error('Client error: %s', err)
})

const widgets = [
  { name: 'w1' },
  new Error('Client Boom 1'),
  { name: 'w2' },
  { name: 'w3' },
  { name: 'w4' },
  new Error('Client Boom 2'),
  { name: 'w5' }
]

widgets.forEach(w => {
  if (w instanceof Error) {
    const { message } = w
    call.write({ error: { message } })
  } else {
    call.write({ widget: w })
  }
})
call.end()
```

With Mali we can use [mississippi](https://npmjs.com/package/mississippi) stream utility to ietrate over the stream and supply response data. In case of an error we set the `error` property in the payload appropriately.

```js
async function syncWidgets (ctx) {
  let counter = 0
  miss.each(ctx.req, (d, next) => {
    counter++
    if (d.widget) {
      console.log('data: %s', d.widget.name)
      ctx.res.write({ widget: { name: d.widget.name.toUpperCase() } })
    } else if (d.error) {
      console.error('Error: %s', d.error.message)
    }
    if (counter % 4 === 0) {
      ctx.res.write({ error: { message: `Boom ${counter}!` } })
    }
    next()
  }, () => {
    ctx.res.end()
  })
}
```
