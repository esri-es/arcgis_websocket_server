var express = require('express');
var app = express();
var expressWs = require('express-ws')(app);
var cors = require('express-cors');

const messagesArr = require('./messages.json');
const TIME_INTERVAL = 2000;
const NGROK = process.argv[2];
const ENDPOINT = "/arcgis/rest/services/ASDITrackInformation/StreamServer";

var serviceDesc = require('./service.js')(`ws://${NGROK}${ENDPOINT}`);

app.use(cors({
    allowedOrigins: [
        NGROK,'localhost:8080'
    ]
}));

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

app.listen(8000);
