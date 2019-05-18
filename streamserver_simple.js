const websocket = require('websocket-stream');
const http = require('http');
const Router = require('router');
const finalhandler = require('finalhandler');
const {parser} = require('stream-json/Parser');
const {streamValues} = require('stream-json/streamers/StreamValues');
const Replace = require('stream-json/filters/Replace');
const {chain}  = require('stream-chain');
const uuidv4 = require('uuid/v4');
const esriTypes = require('./utils/esri_types.js');
const fs = require('fs-extra');

function start(conf){
  const SERVICE_NAME = conf.service.name;
  const BASE_URL = `/arcgis/rest/services/${SERVICE_NAME}/StreamServer`;
  let wsClientPort = conf.ws.client.port ?
    `:${conf.ws.client.port}`
    : "";
  let wsServerPort = conf.ws.server.port ?
      `:${conf.ws.server.port}`
      : "";
  let wsClientUrl = `${conf.ws.client.protocol}://${conf.ws.client.host}${wsClientPort}`;
  let wsServerUrl = `${conf.ws.server.protocol}://${conf.ws.server.host}${wsServerPort}/`;
  let fields = esriTypes.convertToEsriFields(conf.service.fieldObj);

  let serviceRes = require('./templates/service.json');
  serviceRes.fields = fields;
  serviceRes.streamUrls = {
      "transport": "ws",
      "urls": [
          //`wss://${wsUrl}`,
          `${wsServerUrl}`
      ]
  };

  var router = Router();
  router.get(`${BASE_URL}/info`, function (req, res) {
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    res.statusCode = 200;
    res.write(JSON.stringify(serviceRes));
    res.end();

  });
  router.get(`${BASE_URL}/subscribe`, function (req, res) {
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    res.statusCode = 200;
    fs.createReadStream(JSON.stringify(serviceRes, null, 2))
      .pipe(res);
  });

  let server = http.createServer(function(req, res) {
    router(req, res, finalhandler(req, res));
  });

  server.listen(conf.ws.server.port, function() {
      console.log(`${(new Date())} Server is listening on port 9000`);
  });


  let wsRemoteClient = websocket(wsClientUrl, {
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
