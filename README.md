# ArcGIS WebSocket

This node server behaves as a GeoEvent StreamServer layer, so it will emit geographic features in the [Esri JSON](https://developers.arcgis.com/documentation/common-data-types/feature-object.htm) format though a WebSocket. This way we will be able to display a real time layer in ArcGIS without an ArcGIS Enterprise stack.

![custom websocket server in arcgis](https://user-images.githubusercontent.com/826965/53808519-bc44bb80-3f52-11e9-9635-8687d5046bc4.gif)

It can be used with any SDK, API or product. For example add the StreamServer to a webmap and visualize it in Operations Dashboard, ArcGIS Pro, any Storymap, etc.

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

## Known issues

The WebSocket Server seems to be working properly with JavaScript 3.x version and JavaScript <= v4.8. If you want to know more please [check the issues](https://github.com/hhkaos/arcgis_websockets/issues).

## Documentation

* [ArcGIS Server > Stream services](http://enterprise.arcgis.com/en/server/latest/publish-services/linux/stream-services.htm)
* [ArcGIS REST API > StreamServices](https://developers.arcgis.com/rest/services-reference/stream-service.htm)
* [Awesome ArcGIS > GeoEvent Server](https://esri-es.github.io/awesome-arcgis/arcgis/products/arcgis-enterprise/arcgis-server/geoevent-server/)
* [Awesome ArcGIS > Internet of things (IoT) & Real-time (RT)](https://esri-es.github.io/awesome-arcgis/esri/emerging-technologies/iot-rt/?)
* [Public stream services in ArcGIS Online](https://esri-es.github.io/arcgis-developer-tips-and-tricks/arcgis-online/search/?q=typekeywords%3A%22stream+service%22&numResults=100&sortField=relevance&Thumbnail=generateThumbnail(elem)&Title=elem.title&Details=%27%3Ca+href%3D%22https%3A%2F%2Fwww.arcgis.com%2Fhome%2Fitem.html%3Fid%3D%27%2Belem.id%2B%27%22+target%3D%22_blank%22%3EDetails%3C%2Fa%3E%27&Owner=elem.owner&Type=elem.type&Views=elem.numViews)
  * [Preview several Stream Services simultaneously in a Web Map](http://www.arcgis.com/home/webmap/viewer.html?webmap=55a55a4c08934ba890f7fbd5589cffe6)
* [Search more about "Stream services"](https://esri-es.github.io/arcgis-search/?amp%3Butm_source=opensearch&search=%22Stream+services%22)
