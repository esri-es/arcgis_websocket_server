var SERVICE = require('../templates/service.json');
const esriTypes = require('../utils/esri_types.js');


/* obj keys has to be the same as defined on templates/service.json
 {
   streamurls : <wsUrl>,
   fields : payloadObj,
   ...
 }
*/


const RULES = {
  streamUrl : function (wsUrl) {
    return {
        "transport": "ws",
        "urls": [
            //`wss://${wsUrl}`,
            `ws://${wsUrl}`
        ]
    }
  },
  fields : esriTypes.convertToEsriFields
}

function fill(wsUrl) {
    try{
        const wsUtils = require('../utils/websocket_utils.js')(wsUrl)
        wsUtils
          .then((obj) => {
            // TODO validate service schema: https://github.com/tdegrunt/jsonschema
            // JORGE : ajv seems to me better . It also validates  jsonschema
            Object.entries(SERVICE)
              .forEach(([key, value]) => {
                 if(obj.hasOwnProperty(key) && RULES.hasOwnProperty(key)) {
                   SERVICE[key] = RULES[key](obj[key])
                 }
              })

            return SERVICE;
          })
          .catch((err) => {
            throw new Error(err)
          });

    }catch(err){
        return {
            msg: 'Invalid service definition talk to the admin of this service',
            error: err
        };
    }


}

module.exports = fill
