const websocket = require('websocket-stream');
const http = require('http');
const Router = require('router');
const finalhandler = require('finalhandler');
const {parser} = require('stream-json/Parser');
const {streamValues} = require('stream-json/streamers/StreamValues');
const {chain}  = require('stream-chain');
const uuidv4 = require('uuid/v4');
const esriTypes = require('./utils/esri_types.js');
const streamServerFilter = require('./src/filter_utils.js');
const proj4 = require('proj4');

const JSAPI_VERSION = process.argv[3] || "4.11";

function _doChallenge() {
  return !/^(3\.[1-9][0-9]|4\.[1-8]?)$/.test(JSAPI_VERSION);
}

function _updateServiceInfo(obj) {
  let service = require('./templates/service.json');
  Object.keys(obj).forEach(k => {
    service[k] = obj[k];
  });
  return service;
}

function _guessGeoFields (arr) {
  let candidates = arr
    .filter(fieldObj => fieldObj.type === "esriFieldTypeDouble")
    .filter(fieldObj => /\b(latitude|longitude|lat|lon|x|y)\b/.test(fieldObj.name));

  if (candidates.length >= 2) {
    console.log(`found geofields candidates:`);
    candidates.map(e => console.log(e.name))
  }

  // TO BE Reviewed
  return {
    latField : "lat",
    lonField : "lon"
  }
}

function _setup(config) {
  let fields = esriTypes.convertToEsriFields(config.payload);
  let newConfig = {
    ws : {
      server : {
        port : config.service.port,
        protocol : "ws",
        host : config.service.host,
      },
      client : {...config.client}
    },
    service : {...config.service,
      info : _updateServiceInfo({ fields : fields}),
      base_url : `/arcgis/rest/services/${config.service.name}/StreamServer`
    }

  };

  return newConfig;
}

function _setupHTTPServer(serviceConf){
  var router = Router();
  let isNgrok = /ngrok.io/.test(serviceConf.host);
  let wsServerPort = isNgrok
      ? ""
      : serviceConf.port
        ? `:${serviceConf.port}`
        : "";
  let wsServerUrl = `${isNgrok ? "wss" : "ws"}://${serviceConf.host}${wsServerPort}${serviceConf.base_url}`;
  // Update serviceConf.info prior to serve it from HTTPServer
  serviceConf.info.streamUrls = [{
    transport : "ws",
    urls: [
      //`wss://${wsUrl}`,
      `${wsServerUrl}`
    ]
  }];

  router.get(`${serviceConf.base_url}`, function (req, res) {
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
    res.statusCode = 200;
    res.write(JSON.stringify(serviceConf.info));
    res.end();

  });

  // Retro-compatibility end-point (versions before 4.8)
  router.get(`/arcgis/rest/info`, function (req, res) {
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
    res.statusCode = 200;
    res.write(JSON.stringify({
          currentVersion: 10.5,
          fullVersion: "10.5.0",
          authInfo: {
              isTokenBasedSecurity: false
          }
    }));
    res.end();
  });

  let server = http.createServer(function(req, res) {
    router(req, res, finalhandler(req, res));
  });

  server.listen(serviceConf.port, function() {
    console.log(`Your StreamServer is ready on [${serviceConf.protocol}://${serviceConf.host}${wsServerPort}${serviceConf.base_url}]`);
  });

  return server;
}

function _setupSource(obj) {
  //console.log( `WS Server ready at [${conf.ws.client.wsUrl}/${BASE_URL}/subscribe]`);
  let {latField,lonField} = _guessGeoFields(obj.service.info.fields);
  return function handle(stream, request) {
    stream.binary = false;
    stream.socket.uuid = uuidv4();
    stream.socket.challenge = false;
    var filter = false;
    stream.on('data', function(buf){
      let data = buf.toString();
      console.log(`${data} from [${stream.socket.uuid}]`);
      if (!obj.connections[stream.socket.uuid].challenge && _doChallenge()) {
        // Challenge
        try {
          stream.write(JSON.stringify({
            error: null,
            ...JSON.parse(data)
          }));
        } catch(err) {
          console.log(`bad payload[${data}]`);
        }
        console.log("Challenge done!");
        obj.connections[stream.socket.uuid].challenge = true;
      } else {
        // Filters
        try{
            obj.connections[stream.socket.uuid].filter = JSON.parse(data).filter.where;
            filter = true;
        }catch(err){
            console.log(`Invalid filter received from ${stream.socket.uuid}: ${data}`);
        };
      }
    });
    stream.on('close',function(){
      console.log(`client [${stream.socket.uuid}] disconnected`);
      delete obj.connections[stream.socket.uuid];
    })

    let pipeline = chain([
      parser({jsonStreaming: true}),
      streamValues(),
      data => {
          return filter
            ? streamServerFilter(data.value,obj.connections[stream.socket.uuid].filter)
              ? data
              : null
            : data;
      },
      data => {

        if (data.value[latField] !== 0 && data.value[lonField] !== 0) {
          // Reprojection according to conf.
          let [lon,lat] = proj4(proj4.defs(`EPSG:${obj.service.out_sr.latestWkid}`),[data.value[lonField],data.value[latField]])
          data.value[latField] = lat;
          data.value[lonField] = lon;
          let fixed = {
              geometry : {
                x : lon, y : lat,
                spatialReference : obj.service.out_sr
              },
              attributes : data.value
          };
          fixed.attributes.FltId = data.value.id_str;
          data.value = fixed;

          return data;
        } else {
          return null
        }
      },
      data => {
        return JSON.stringify(data.value)
      }
    ]);

    obj.connections[stream.socket.uuid] = stream.socket;

    obj.pullStream
      .pipe(pipeline)
      .pipe(stream)
  }
}

function start(cfg){
  // First some Plumbing...
  let conf = _setup(cfg);
  var connections = {};
  let HTTPServer = _setupHTTPServer(conf.service);

  let wsRemoteClient = websocket(conf.ws.client.wsUrl, {
    perMessageDeflate: false
  });

  var wss = websocket.createServer({
    server: HTTPServer,
    path : `${conf.service.base_url}/subscribe`,
    binary: false },
    _setupSource({
      pullStream : wsRemoteClient,
      service: conf.service,
      connections : connections
    }))
}

module.exports = {
  start: start
};
