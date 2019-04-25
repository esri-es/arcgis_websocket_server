var express = require('express');
var app = express();
var expressWs = require('express-ws')(app);
var cors = require('express-cors');

var websocket = require('websocket-stream')

var http = require('http');

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
}, handle)

function handle(stream) {
  console.log("Entramos:", new Date())
  stream.on('data', (chunk) => {
      console.log('Event data:', new Date());
      var aux = new Buffer.from(chunk);
      console.log(aux.toString());
  });
  stream.on('close', (chunk) => {
      console.log('Event close:', new Date());
  });
  stream.on('end', (chunk) => {
      console.log('Event end:', new Date());
  });
  stream.on('error', (chunk) => {
      console.log('Event error:', new Date());
  });
  stream.on('pause', (chunk) => {
      console.log('Event pause:', new Date());
  });
  stream.on('readable', (chunk) => {
      console.log('Event readable:', new Date());
  });
  stream.on('resume', (chunk) => {
      console.log('Event resume:', new Date());
  });
}

function decodeBuffer(message){
    var json = JSON.stringify(message.binaryData);
    var bufferOriginal = Buffer.from(JSON.parse(json).data);
    var msg = bufferOriginal.toString('utf8');

    return msg;
}

var mock  = {
    messages: './mock/messages.json',
    serviceDesc: './mock/service.js'

    // messages: './mock/messages_bus.json',
    // serviceDesc: './mock/service_bus.js'
};

const messagesArr = require(mock.messages);
const PORT = 8000;
const TIME_INTERVAL = 2000;
const NGROK = process.argv[2];
const ENDPOINT = "/arcgis/rest/services/ASDITrackInformation/StreamServer";

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
var serviceDesc = require(mock.serviceDesc)(`${NGROK}${ENDPOINT}`);

app.get(ENDPOINT, function(req, res, next){
  console.log(serviceDesc.streamUrls[0].urls);
  res.status(200).json(serviceDesc);
  res.end();
});

app.ws(`${ENDPOINT}/subscribe`, function(ws, req) {
  console.log("Reached");
  var interval = setInterval(function(inst, arr) {
    if (arr.length >= 1) {
      var data = arr.shift();
      data.geometry.x += getRandomArbitrary(-5,5);
      data.geometry.y += getRandomArbitrary(-5,5);
      data = JSON.stringify(data);
      inst.send(data);
      console.log(`Sending data: ${data}`);
    } else {
      console.log("No more data");
    }
  }, TIME_INTERVAL, ws,[...messagesArr]);



  ws.on("close",function(){
    clearInterval(interval);
  });
});

app.listen(PORT, function() {
    console.log((new Date()) + ` StreamServer is listening on port ${PORT}`);
});

function getRandomArbitrary(min, max) {
    return Math.random() * (max - min) + min;
}
