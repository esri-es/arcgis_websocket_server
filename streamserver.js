var express = require('express');
var app = express();
var expressWs = require('express-ws')(app);
var cors = require('express-cors');

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

app.use(cors({
    allowedOrigins: [
        NGROK, 'localhost:8080'
    ]
}));

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
      const data = JSON.stringify(arr.shift());
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
