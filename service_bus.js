var SERVICE = {
 "description": null,
 "objectIdField": null,
 "displayField": "id",
 "timeInfo": {
  "trackIdField": "id",
  "startTimeField": "received_time",
  "endTimeField": null
 },
 "geometryType": "esriGeometryPoint",
 "geometryField": "position",
 "spatialReference": {
  "wkid": 4326,
  "latestWkid": 4326
 },
 "drawingInfo": {
  "renderer": {
   "type": "simple",
   "description": "",
   "symbol": {
    "type": "esriSMS",
    "style": "esriSMSCircle",
    "color": [
     5,
     112,
     176,
     204
    ],
    "size": 10,
    "angle": 0,
    "xoffset": 0,
    "yoffset": 0,
    "outline": {
     "color": [
      255,
      255,
      255,
      255
     ],
     "width": 1
    }
   }
  }
 },
 "fields": [
  {
   "name": "seconds_since_report",
   "type": "esriFieldTypeDouble",
   "alias": "seconds_since_report",
   "nullable": true
  },
  {
   "name": "run_id",
   "type": "esriFieldTypeString",
   "alias": "run_id",
   "nullable": true
  },
  {
   "name": "longitude",
   "type": "esriFieldTypeDouble",
   "alias": "longitude",
   "nullable": true
  },
  {
   "name": "heading",
   "type": "esriFieldTypeDouble",
   "alias": "heading",
   "nullable": true
  },
  {
   "name": "route_id",
   "type": "esriFieldTypeString",
   "alias": "route_id",
   "nullable": true
  },
  {
   "name": "predictable",
   "type": "esriFieldTypeString",
   "alias": "predictable",
   "nullable": true
  },
  {
   "name": "latitude",
   "type": "esriFieldTypeDouble",
   "alias": "latitude",
   "nullable": true
  },
  {
   "name": "id",
   "type": "esriFieldTypeString",
   "alias": "id",
   "nullable": true
  },
  {
   "name": "received_time",
   "type": "esriFieldTypeDate",
   "alias": "received_time",
   "nullable": true
  }
 ],
 "currentVersion": "10.5",
 "streamUrls": [],
 "capabilities": "broadcast,subscribe"
};

function fill(wsUrl) {
  SERVICE.streamUrls.push({
     "transport": "ws",
     "token": "AcQCmP6xNZXhZfYI374if5otLIqcjb-LCxbidoh6uvAWjnyZ2emNc3M1CHavZBJqURdPedNaU8Jye7xdlKukeg..",
     "urls": [wsUrl]
    });
  return SERVICE;
}

module.exports = fill
