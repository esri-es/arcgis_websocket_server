const testConnection = require("./utils/websocket_utils.js");
const streamServer = require('./streamserver_simple.js');

var CONFIG = streamServer.setup("twitter");
testConnection(CONFIG.ws.client)
  .then(payload => {
    // Update service conf with payload retrieved from ws connection
    CONFIG.service.fieldObj = JSON.parse(payload);
    // start StreamServer
    streamServer.start(CONFIG);
  })
  .catch((err) => {
    console.log(`ws initialization failed! reason : [${err}]`);
    process.exit(12);
  });
