# ArcGIS WebSocket

This node server behaves as a GeoEvent StreamServer layer, so it will emit geographic features in the [Esri JSON](https://developers.arcgis.com/documentation/common-data-types/feature-object.htm) format though a WebSocket. This way we will be able to display a real time layer in ArcGIS without an Enterprise stack.

## Start the app

1. Start the WebSocketserver (RealTimeServer): `node index.js`
2. Create a tunnel: `node streamserver.js localhost:8000`
3. Start a web server: `http-server -p 9090`
4. Open: [http://localhost:9090/layers-streamlayer.html](http://localhost:9090/layers-streamlayer.html)
5. Stream service url: `http://localhost:8000/arcgis/rest/services/ASDITrackInformation/StreamServer`

### Using HTTPS (NGROK)

1) Run: `ngrok http 8000`
2) Stop streamserver.js and run `node streamserver.js NGROK_ID.ngrok.io`
3) Use: `https://NGROK_ID.ngrok.io/arcgis/rest/services/ASDITrackInformation/StreamServer` instead of `http://localhost:8000/arcgis/rest/services/ASDITrackInformation/StreamServer`
