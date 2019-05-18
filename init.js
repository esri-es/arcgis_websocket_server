var CONF;
try {
  let {hostname,port,protocol} = new URL(process.argv[2]);
  console.log(`${protocol.replace(/:/g,"")}://${hostname}${port}`);
  CONF = {
    ws : {
      server : {
        port : 9000
      },
      client : {
        protocol : protocol.replace(/:/g,""),
        host: hostname,
        port : port
      }
    },
    service : {
      fields : []
    }
  };
} catch(err) {
  console.log(`ws initialization failed! reason : [${err}]`);
  process.exit(12);
}



const testConnection = require("./utils/websocket_utils.js");

const streamServer = require('./streamserver_simple.js');

testConnection(CONF.ws.client)
  .then(payload => {
    //console.log(payload);
    streamServer.start(CONF)
  })
  .catch((err) => {
    console.log(`ws initialization failed! reason : [${err}]`);
    process.exit(12);
  })