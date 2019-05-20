/*
This is where you can customize the transformation of your data from websockets

If you want to add more steps in the final pipeline:

- implement a function like this and add it to the array on the module.exports
function your_step( context ) {
   return data => {
      ...do your stuff here
      return  result  // result has to be an object like data or null to skip it
  }
}

context =
   {
     geo : { lat : fieldLat, lon : fieldLon } || null,
     service : <serviceConf>
   }

data = {
  key : <from the parser>
  value : <your actual payload>
}


*/

const proj4 = require('proj4');

module.exports = [adaptPayload];

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
