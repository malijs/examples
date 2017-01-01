# Mali Examples

A repository containing small examples to illustrate the use of Mali for creating gRPC applications.

## Installation

```sh
$ npm install
```

## Examples

* [Hello World](#helloworld) - The stock gRPC Hello World example
* [Route Guide](#routeguide) - The stock gRPC Route Guide tutorial
* [User Service](#userservice) - Sample "User" service

###<a name="helloworld">Hello World</a>

The stock [gRPC Hellow World example](https://github.com/grpc/grpc/tree/master/examples/node)
converted to use Mali for server.
Both dynamic and static code generated examples are provided.
With dynamic we create a server from protocol buffer definition file.
With static we create the server from pre-generated Node.js code.
The client is unchanged from the gRPC client sample code.

#### Run the server

```sh
$ # from this directory
$ node ./hello_world_dynamic/greeter_server.js
$ # OR
$ node ./hello_world_static/greeter_server.js
```

#### Run the client

```sh
$ # from this directory
$ node ./hello_world_dynamic/greeter_client.js
$ # OR
$ node ./hello_world_static/greeter_client.js
```

###<a name="routeguide">Route Guide</a>

The stock [gRPC Route Guide tutorial](http://www.grpc.io/docs/tutorials/basic/node.html)
converted to use Mali for server with some notable changes:

* We use the `route_guide_db.json` as the database source.
* All data is asynchronously queried to the file using streaming to demonstrate
asynchronous interaction with a "database".
* Similarly Notes are written to `route_guide_db_notes.json` file to simulate
asynchronous I/O interactions. This file is truncated at startup to get
a clean slate.
* Use of [logger](https://github.com/malijs/logger) middleware.

The client is unchanged from the gRPC client sample code.

#### Run the server

```sh
$ # from within route_guide directory
$ node ./server.js
```

#### Run the client

```sh
$ # from this directory
$ node ./route_guide/route_guide_client.js --db_path=./route_guide/route_guide_db.json
```

###<a name="userservice">User service</a>

A simple "User" service that demonstrates usage of [apikey](https://github.com/malijs/apikey), [logger](https://github.com/malijs/logger) and [tojson](https://github.com/malijs/tojson)
middleware. As well since currently Protocol Buffers (and therefore gRPC) doesn't support
serializing variable JSON data (the user "metadata" field in this case),
this example shows how to serialize the property by converting it to bytes.
This is not the most efficient solution but the best we can do right now.

#### Run the server

```sh
$ # from within user_service directory
$ node ./server.js
```

#### Run the tests for the service

```sh
$ # from this directory
$ npm run test-user
```
