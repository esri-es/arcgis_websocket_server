const websocket = require('websocket-stream');
const http = require('http');
const through2 = require('through2');
const {parser} = require('stream-json/Parser');
const {streamValues} = require('stream-json/streamers/StreamValues');
const {chain}  = require('stream-chain');
const fs = require('fs');

var server = http.createServer(function(request, response) {
    response.writeHead(404);
    response.end();
});

server.listen(9000, function() {
    console.log(`${(new Date())} Server is listening on port 9000`);
});




var wss = websocket.createServer({server: server}, handle)
function handle(stream, request) {
  // `request` is the upgrade request sent by the client.

  const pipeline = chain([
    fs.createReadStream('test2.json'),
    parser({packValues: true}),
    streamValues(),
    data => JSON.stringify(data.value)
  ]);

  pipeline.on('data', (data) => console.log(data));
  pipeline
  .pipe(stream);
}
