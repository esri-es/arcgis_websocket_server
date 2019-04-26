var express = require('express');
var app = express();
var expressWs = require('express-ws')(app);
var cors = require('express-cors');

var websocket = require('websocket-stream')

var http = require('http');

const PORT = 8000;
const TIME_INTERVAL = 2000;
const NGROK = process.argv[2];
const ENDPOINT = "/arcgis/rest/services/ASDITrackInformation/StreamServer";

var connections = [];
var messages = [];

var server = http.createServer(function(request, response) {
    console.log((new Date()) + ' Received request for ' + request.url);
    response.writeHead(404);
    response.end();
});

server.listen(9000, function() {
    console.log((new Date()) + ' Server is listening on port 9000');
});

var wss = websocket.createServer({
  perMessageDeflate: false,
  server: server
}, handle);

// Broadcast to all.
wss.broadcast = function broadcast(data) {
  connections.forEach(function each(client) {
    if (client.readyState === 1) {
      client.send(data);
    }
  });
};

function broadcast(d){

    wss.broadcast(JSON.stringify(d));
}


function handle(stream) {
  // console.log("Entramos:", new Date())
  stream.on('data', (chunk) => {
      var aux = JSON.parse(new Buffer.from(chunk).toString());
      console.log(`Event data [${new Date()}] ${JSON.stringify(aux)}`);
      var data = {
          "geometry":{
              "x": aux.lon,
              "y": aux.lat,
              "spatialReference":{
                  "wkid":4326
              }
          },
          "attributes": aux
      };
      data.attributes.FltId = aux.id_str;
      broadcast(data);
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
  console.log(serviceDesc.streamUrls[0].urls);
  res.status(200).json(serviceDesc);
  res.end();
});

app.ws(`${ENDPOINT}/subscribe`, function(ws, req) {
  // Con exponer este endpoint , simplemente apuntamos subscribe a que conecte con el ws:// o wss://
  console.log("Reached");
  connections.push(ws);
});

app.listen(PORT, function() {
    console.log((new Date()) + ` StreamServer is listening on port ${PORT}`);
});
