# Mali Examples

A repository containing small examples to illustrate the use of Mali for creating gRPC applications.

```sh
$ npm install
```

## Examples

### Hello World

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

### Route Guide

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
