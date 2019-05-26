const testConnection = require("./utils/websocket_utils.js");
const streamServer = require('./streamserver/streamserver_simple.js');

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

process
  .on('unhandledRejection', (reason, p) => {
    console.error(reason, 'Unhandled Rejection at Promise', p);
  })
  .on('uncaughtException', err => {
    console.error(err, 'Uncaught Exception thrown');
  });

process.setMaxListeners(0);

var wsClientConn = process.argv[2];
testConnection(wsClientConn)
  .then(conf => {
    let CONFIG = {
      client : conf.client,
      payload: conf.payload,
      service : SERVICE_CONF
    };
    // start StreamServer
    streamServer.start(CONFIG);
  })
  .catch((err) => {
    console.log(`ws initialization failed! reason : [${err}]`);
    process.exit(12);
  });
