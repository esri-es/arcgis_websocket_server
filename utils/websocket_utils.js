const websocket = require('websocket-stream');
const streamjson = require('stream-json');
const {parser} = require('stream-json/Parser');
const {streamValues} = require('stream-json/streamers/StreamValues');
const {chain}  = require('stream-chain');


module.exports = function(obj) {
  let wsPort = obj.port
    ? `:${obj.port}`
    : "";
  let wsUrl = `${obj.protocol}://${obj.host}${wsPort}`;
  return new Promise((resolve, reject) => {
    const ws = websocket(wsUrl);

    const pipemod = chain([
      parser({packValues: true}),
      streamValues(),
      data => {
        ws.unpipe();
        resolve(JSON.stringify(data.value));
      }
    ]);


    pipemod
      .on("error", function(err){
        reject(err);
      });

    ws.pipe(pipemod);

  })
}
