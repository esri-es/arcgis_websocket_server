var express = require('express');
var app = express();
var expressWs = require('express-ws')(app);
var cors = require('express-cors');
var websocket = require('websocket-stream')
var http = require('http');
const uuidv4 = require('uuid/v4');
const colors = require('colors');
const proj4 = require('proj4');

const PORT = 8000;
const TIME_INTERVAL = 2000;
const NGROK = process.argv[2];
const ENDPOINT = "/arcgis/rest/services/ASDITrackInformation/StreamServer";
const OUT_SR = {
  wkid : 102100, latestWkid : 3857
};

const filterTweets = require('./src/filter_utils.js');

var connections = [];

var server = http.createServer(function(request, response) {
    console.log(`${(new Date())} Received request for ${request.url})`.green);
    response.writeHead(404);
    response.end();
});

server.listen(9000, function() {
    console.log(`${(new Date())} Server is listening on port 9000`.green);
});

var wss = websocket.createServer({
  perMessageDeflate: false,
  server: server
}, handle);

// Broadcast to all.
function broadcast(d){
  let data = JSON.stringify(d);
  connections.forEach(function each(client) {
    if (client.readyState === 1 && shouldBeSent(client, d)){
        console.log(`Sending to [${client.uuid}]`);
        client.send(data);
    }
  });
}

function shouldBeSent(c, d){
    if(c.hasOwnProperty('filter') && c.filter){
      let cond = filterTweets(d.attributes, c.filter);
      console.log(`DEBO ENVIAR : [${cond}]`);
      return cond;
    } else {
      return true;
    }
}

function handle(stream) {
  stream.on('data', (chunk) => {
      try{
        var aux = JSON.parse(new Buffer.from(chunk).toString());
        if (aux.lon !== 0 & aux.lat !== 0) {
          var data = {
              geometry : proj4(proj4.defs('EPSG:3857'),{
                x : aux.lon, y : aux.lat,
                spatialReference : OUT_SR}),
              attributes : aux
          };
          data.attributes.FltId = aux.id_str;
          broadcast(data);
        }

      } catch(e) {
        console.error(`Skipped Tweet: Unable to parse it: ${e}`.yellow);
      }
  });

}



app.use(cors())
//     cors({
//     allowedOrigins: [
//         NGROK, 'localhost:8080'
//     ]
// })
// );

app.use(function(req, res, next) {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
  next();
});

app.get('/arcgis/rest/info', function(req,res,next) {
  res.status(200).json({
      currentVersion: 10.5,
      fullVersion: "10.5.0",
      authInfo: {
          isTokenBasedSecurity: false
      }
  })
  res.end();
});

// Construct service description JSON adding
// (`ws://${NGROK}${ENDPOINT}`) as one of streamUrls
var serviceDesc = require('./mock/service.js')(`${NGROK}${ENDPOINT}`);

app.get(ENDPOINT, function(req, res, next){
  // if(serviceDesc.streamUrls){
  //   console.log(serviceDesc.streamUrls[0].urls);
  // }
  res.status(200).json(serviceDesc);
  res.end();
});

app.ws(`${ENDPOINT}/subscribe`, function(ws, req) {
  // Con exponer este endpoint , simplemente apuntamos subscribe a que conecte con el ws:// o wss://
  console.log("New connection established".green);
  ws.uuid = uuidv4();
  connections.push(ws);

  ws.on('message', function(msg) {
    // This comes from the connected clients
    let i = connections.findIndex((el) => el.uuid === ws.uuid);

    // For 4.9+ , JS API sends a "challenge" , a filter with all the fields
    // specified in service.js
    // So we have to answer back
    ws.send(JSON.stringify({
      error: null ,
      ...JSON.parse(msg)
    }));

    try{
        connections[i].filter = JSON.parse(msg).filter.where;
    }catch(err){
        console.log(`Invalid filter received from ${i}: ${msg}`.red);
    };
  });

  ws.on("close", function(){
    let i = connections.findIndex((el) => el.uuid === ws.uuid);
    connections.splice(i,1);
    console.log(`ws disconnected [${ws.uuid}]`.green);
  })

});

app.listen(PORT, function() {
    console.log(`${(new Date())} StreamServer is listening on port ${PORT}`.green);
});
