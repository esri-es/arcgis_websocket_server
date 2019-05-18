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
const streamServerFilter = require('./src/filter_utils.js');
const proj4 = require('proj4');


function setup(serviceName) {
  var CONF;
  try {
    let {hostname,port,protocol} = new URL(process.argv[2]);
    CONF = {
      ws : {
        server : {
          port : 9000,
          protocol : "ws",
          host : "localhost"
        },
        client : {
          protocol : protocol.replace(/:/g,""),
          host: hostname,
          port : port,
          geo_fields : null
        }
      },
      service : {
        name: serviceName,
        fieldObj : null,
        out_sr : {
          wkid : 102100,
          latestWkid : 3857
        }
      }
    };
  } catch(err) {
    console.log(`ws initialization failed! reason : [${err}]`);
    process.exit(12);
  }
  return CONF;
}


function updateServiceInfo(obj) {
  let service = require('./templates/service.json');
  Object.keys(obj).forEach(k => {
    service[k] = obj[k];
  });
  return service;
}

const JSAPI_VERSION = process.argv[3] || "4.11";

function doChallenge() {
  return !/^(3\.[1-9][0-9]|4\.[1-8]?)$/.test(JSAPI_VERSION);
}

function guessGeoFields (arr) {
  let candidates = arr
    .filter(fieldObj => fieldObj.type === "esriFieldTypeDouble")
    .filter(fieldObj => /\b(latitude|longitude|lat|lon|x|y)\b/.test(fieldObj.name));

  if (candidates.length >= 2) {
    console.log(`found geofields candidates:`);
    candidates.map(e => console.log(e.name))
  }
  return {
    latField : "lat",
    lonField : "lon"
  }
}

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
  let {latField,lonField} = guessGeoFields(fields);

  let serviceRes = updateServiceInfo({
    fields : fields,
    streamUrls : {
        "transport": "ws",
        "urls": [
            //`wss://${wsUrl}`,
            `${wsServerUrl}`
        ]
    }
  })
  var connections = {};
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
    res.end();
  });

  let server = http.createServer(function(req, res) {
    router(req, res, finalhandler(req, res));
  });

  server.listen(conf.ws.server.port, function() {
    console.log(`Your StreamServer is ready on [http://${conf.ws.server.host}${wsServerPort}${BASE_URL}]`);
  });

  let wsRemoteClient = websocket(wsClientUrl, {
    perMessageDeflate: false
  });

  var wss = websocket.createServer({server: server}, setupSource(wsRemoteClient,conf.service.out_sr))

  function setupSource(pullStream,outSR) {
    console.log( `WS Server ready at [${wsServerUrl}]`);
    return function handle(stream, request) {
      // `request` is the upgrade request sent by the client.
      stream.socket.uuid = uuidv4();
      stream.socket.challenge = false;
      var filter = false;
      stream.on('data', function(buf){
        let data = buf.toString();
        console.log(`${data} from [${stream.socket.uuid}]`);
        if (!connections[stream.socket.uuid].challenge && doChallenge()) {
          // Challenge
          stream.write(JSON.stringify({
            error: null,
            ...JSON.parse(data)
          }));
          console.log("Challenge done!");
          connections[stream.socket.uuid].challenge = true;
        } else {
          // Filters
          try{
              connections[stream.socket.uuid].filter = JSON.parse(data).filter.where;
              filter = true;
          }catch(err){
              console.log(`Invalid filter received from ${stream.socket.uuid}: ${data}`);
          };
        }
      });
      stream.on('close',function(){
        console.log(`client [${stream.socket.uuid}] disconnected`);
        delete connections[stream.socket.uuid];
      })

      let pipeline = chain([
        parser({jsonStreaming: true}),
        streamValues(),
        data => {
            return filter
              ? streamServerFilter(data.value,connections[stream.socket.uuid].filter)
                ? data
                : null
              : data;
        },
        data => {
          // Reprojection according to conf.
          let [lon,lat] = proj4(proj4.defs(`EPSG:${outSR.latestWkid}`),[data.value[lonField],data.value[latField]])
          data.value[latField] = lat;
          data.value[lonField] = lon;
          return data;

        },
        data => Buffer.from(JSON.stringify(data.value))
      ]);

      connections[stream.socket.uuid] = stream.socket;
      pullStream
        .pipe(pipeline)
        .pipe(stream)
    }
  }
}

module.exports = {
  start: start,
  setup: setup
};
