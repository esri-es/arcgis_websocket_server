const testConnection = require("./utils/websocket_utils.js");
const streamServer = require('./streamserver/streamserver_twitter.js');

const SERVICE_CONF = {
  name : "twitter",
  out_sr : {
    wkid : 102100,
    latestWkid : 3857
  },
  port : process.env["NGROK"] ? 9000 : 9000,
  host : process.env["NGROK"]  || "localhost",
  protocol : process.env["NGROK"] ? "https" : "http"
};

let CONFIG = {
  client : {
    host : "localhost",
    port : 8888,
    protocol : "ws",
    wsUrl : "ws://localhost:8888"
  },
  payload: require('./streamserver/config/payload.json'),
  service : SERVICE_CONF
};
// start StreamServer
streamServer.start(CONFIG);
