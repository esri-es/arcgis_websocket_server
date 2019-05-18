const websocket = require('websocket-stream');
const http = require('http');
const through2 = require('through2');
const {parser} = require('stream-json/Parser');
const {streamValues} = require('stream-json/streamers/StreamValues');
const {chain}  = require('stream-chain');
const uuidv4 = require('uuid/v4');
/*
{
  ws : {
    server : {
      port : <mandatory>
    },
    client : {
      port: <optional>
      protocol : <ws|wss>
      host : <localhost|yourhost.com>
    }
  }
}
*/

function start(conf){

  let server = http.createServer(function(request, response) {
      console.log(`${(new Date())} Received request for ${request.url})`.green);
      response.writeHead(404);
      response.end();
  });

  server.listen(conf.ws.server.port, function() {
      console.log(`${(new Date())} Server is listening on port 9000`.green);
  });

  let wsPort = conf.ws.client.port ?
    `:${conf.ws.client.port}`
    : "";
  let wsUrl = `${conf.ws.client.protocol}://${conf.ws.client.host}${wsPort}`;
  let wsRemoteClient = websocket(wsUrl, {
    perMessageDeflate: false
  });

  let pipeline = chain([
    parser({jsonStreaming: true}),
    streamValues(),
    data => Buffer.from(JSON.stringify(data.value))
  ]);

  var wss = websocket.createServer({server: server}, setupSource(wsRemoteClient,pipeline))

  var connections = [];

  function setupSource(pullStream,modChain) {
    return function handle(stream, request) {
      // `request` is the upgrade request sent by the client.
      stream.socket.uuid = uuidv4();
      connections.push(stream.socket);

      pullStream
        .pipe(pipeline)
        .pipe(stream)
    }
  }
}

module.exports = {
  start: start
};
