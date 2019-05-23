const websocket = require('websocket-stream');
const http = require('http');
const Router = require('router');
const finalhandler = require('finalhandler');
const {chain}  = require('stream-chain');
const uuidv4 = require('uuid/v4');
const esriTypes = require('./utils/esri_types.js');
const defaultPipeline = require('./pipelines/default.js');
const electionsStream = require('twitter-elections');

const JSAPI_VERSION = process.argv[3] || "4.11";

function _doChallenge() {
  return !/^(3\.[1-9][0-9]|4\.[1-8]?)$/.test(JSAPI_VERSION);
}

function _updateServiceInfo(obj) {
  let service = require('../templates/service.json');
  Object.keys(obj).forEach(k => {
    service[k] = obj[k];
  });
  return service;
}

function _guessGeoFields (arr) {
  let latFieldsNames = ["latitude","coordenadas_y","lat","y"];
  let lonFieldsNames = ["longitude","coordenadas_x","long","lon","lng","x"];
  let regexLat = new RegExp(`\\b(${latFieldsNames.join("|")})\\b`, "i");
  let regexLon = new RegExp(`\\b(${lonFieldsNames.join("|")})\\b`, "i");
  // Lat & and Lon has to be float numbers
  let candidates = arr
    .filter(fieldObj => fieldObj.type === "esriFieldTypeDouble");

  let names = candidates.map(e => e.name);
  let latField = names.find(name => regexLat.test(name));
  let lonField = names.find(name => regexLon.test(name));
  // TO BE Reviewed
  return {
    latField : latField || null,
    lonField : lonField || null
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
  return function handle(stream, request) {
    var serverRef = this;
    stream.binary = false;
    stream.socket.uuid = uuidv4();
    console.log(`client [${stream.socket.uuid}] connected`);
    stream.socket.challenge = false;
    stream.on('data', function(buf){
      let data = buf.toString();
      console.log(`${data} from [${stream.socket.uuid}]`);
      if (!stream.socket.challenge && _doChallenge()) {
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
        stream.socket.challenge = true;
      } else {
        // Filters
        try{
          stream.socket.filter = JSON.parse(data).filter.where;
        }catch(err){
            console.log(`Invalid filter received from ${stream.socket.uuid}: ${data}`);
        };
      }
    });
    stream.on('close',function(){
      console.log(`client [${stream.socket.uuid}] disconnected`);
      serverRef.clients.delete(stream.socket);
      stream.end();
    });

    let pipeline = chain([
      ...defaultPipeline({ geo : obj.geo, service : obj.service}),
      data => {
          return stream.socket.hasOwnProperty("filter")
            ? streamServerFilter(data.value,stream.socket.filter)
              ? data
              : null
            : data;
      },
      data => JSON.stringify(data.value)
    ]);

    pipeline.on("error", function(err){
      console.error(err);
    })

    obj.pullStream
      .pipe(pipeline)
      .pipe(stream)
  }
}

function start(cfg){
  // First some Plumbing...
  let conf = _setup(cfg);
  let avoidGeo = false;
  let {latField,lonField} = _guessGeoFields(conf.service.info.fields);

  if (latField === null || lonField === null ) {
    avoidGeo = true;
    console.warn("Unable to find field candidates on payload. Skipping Re-Projecction");
  } else {
    console.log(`Found spatial information in fields [${lonField},${latField}]`);
  }

  let HTTPServer = _setupHTTPServer(conf.service);


  var fieldGeo = avoidGeo
    ? null
    : {
      lat : latField,
      lon : lonField
    };

  var wss = websocket.createServer({
    server: HTTPServer,
    path : `${conf.service.base_url}/subscribe`,
    binary: false },
    _setupSource({
      pullStream : electionsStream.start({
        ws : {
          host : "localhost",
          port : 8888,
          protocol : "ws"
        },
        twitter : {
          track : "PP,PSOE,CIUDADANOS,VOX,PODEMOS",
          credentials : require('./config/twitter_credentials.json')
        },
        geocoders : ["arcgis","osm"]
      }),
      service: conf.service,
      geo : fieldGeo
    }))
}

module.exports = {
  start: start
};
