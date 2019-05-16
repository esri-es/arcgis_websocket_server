const WebSocket = require('ws');


module.exports = function(wsUrl) {
  return new Promise((resolve, reject) => {
    const ws = new WebSocket(wsUrl);
    let payloadObj;
    ws
      .on('open', function open() {
        console.log('connected');
      })
      .on('message', function(data) {
        payloadObj = data;
        ws.close();
      })
      .on('close', function(){
        resolve(payloadObj);
      })
      .on('error', function(err){
        reject(err);
      })
  })
}
