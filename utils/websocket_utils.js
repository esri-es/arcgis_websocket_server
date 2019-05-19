const websocket = require('websocket-stream');
const streamjson = require('stream-json');
const {parser} = require('stream-json/Parser');
const {streamValues} = require('stream-json/streamers/StreamValues');
const {chain}  = require('stream-chain');


module.exports = function(wsUrl) {
  return new Promise((resolve, reject) => {
    try {
      let {hostname,port,protocol} = new URL(wsUrl);
      let ws = websocket(wsUrl);
      const pipemod = chain([
        parser({packValues: true}),
        streamValues(),
        data => {
          ws.unpipe();
          resolve({
            payload : data.value,
            client : {
              host : hostname,
              port : port,
              protocol : protocol,
              wsUrl : wsUrl
            }
          });
        }
      ]);

      ws.on("error", function(err){
        reject(`Cannot connect to [${wsUrl}]`);
      })

      pipemod
        .on("error", function(err){
          reject(err);
        });

      ws.pipe(pipemod);
    } catch(err) {
      reject(err);
    }

  })
}
