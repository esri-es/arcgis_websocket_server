var SERVICE = {
 "description": null,
 "objectIdField": null,
 "displayField": "FltId",
 "timeInfo": {
  "trackIdField": "FltId",
  "startTimeField": "MsgTime",
  "endTimeField": null
 },
 "geometryType": "esriGeometryPoint",
 "geometryField": "Location",
 "spatialReference": {
  "wkid": 4326,
  "latestWkid": 4326
 },
 "drawingInfo": {
  "renderer": {
      "type": "simple",
                           "description": "",
                           "symbol": {
                               "color": [
                                   0,
                                   169,
                                   230,
                                   131
                               ],
                               "size": 9,
                               "angle": 0,
                               "xoffset": 0,
                               "yoffset": 0,
                               "type": "esriSMS",
                               "style": "esriSMSCircle",
                               "outline": {
                                   "color": [
                                       255,
                                       255,
                                       255,
                                       255
                                   ],
                                   "width": 1.125,
                                   "type": "esriSLS",
                                   "style": "esriSLSSolid"
                               }
                           }
   }

 },
 "fields": [
  {
   "name": "MsgTime",
   "type": "esriFieldTypeDate",
   "alias": "MsgTime",
   "nullable": true
  },
  {
   "name": "DepArpt",
   "type": "esriFieldTypeString",
   "alias": "DepArpt",
   "nullable": true
  },
  {
   "name": "FltId",
   "type": "esriFieldTypeString",
   "alias": "FltId",
   "nullable": true
  },
  {
   "name": "Heading",
   "type": "esriFieldTypeInteger",
   "alias": "Heading",
   "nullable": true
  },
  {
   "name": "AltitudeFeet",
   "type": "esriFieldTypeInteger",
   "alias": "AltitudeFeet",
   "nullable": true
  },
  {
   "name": "FID",
   "type": "esriFieldTypeInteger",
   "alias": "FID",
   "nullable": true
  }
 ],
 "currentVersion": "10.5",
 "streamUrls": [

 ],
 "capabilities": "broadcast,subscribe"
}

function fill(wsUrl) {
  SERVICE.streamUrls.push({
     "transport": "ws",
     "urls": [
         `wss://${wsUrl}`,
         `ws://${wsUrl}`
     ]
    });
  return SERVICE;
}

module.exports = fill
