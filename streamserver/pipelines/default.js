const {parser} = require('stream-json/Parser');
const {streamValues} = require('stream-json/streamers/StreamValues');
const {chain}  = require('stream-chain');
const streamServerFilter = require('../utils/filter_utils.js');
const proj4 = require('proj4');

function adaptPayload (context) {

   return data => {
    if(context.geo !== null) {
      let data_lat = data.value[context.geo.lat];
      let data_lon = data.value[context.geo.lon];
      if (data_lat !== 0 && data_lon !== 0 ) {
      // Reprojection according to conf.
        try {
          let [lon,lat] = proj4(proj4.defs(`EPSG:${context.service.out_sr.latestWkid}`),[data_lon,data_lat])
          let fixed = {
              geometry : {
                x : lon, y : lat,
                spatialReference : context.service.out_sr
              },
              attributes : data.value
          };
          fixed.attributes.FltId = data.value.id_str;
          data.value = fixed;

          return data;
        } catch(err) {
          console.error(`Failed re-projection [${err}]`);
          console.log(`${data_lat} || ${data_lon}`);
          return null;
        }
      } else {
        return null
      }
    } else {
      return null
    }
  };
}

const CUSTOM_PIPELINE = [
  adaptPayload
];

function _injectCtx (arr,ctx) {
  return arr.map(fn => fn(ctx));
}

function compose(ctx) {
  let pipeline = [
    parser({jsonStreaming: true}),
    streamValues()
  ];
  if (CUSTOM_PIPELINE.length > 0) {
    pipeline.push(..._injectCtx(CUSTOM_PIPELINE,ctx));
  }

  return pipeline;
}

module.exports = compose;
