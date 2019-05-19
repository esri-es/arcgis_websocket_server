# ArcGIS WebSocket Server

This node server behaves as a [GeoEvent](https://www.esri.com/en-us/arcgis/products/arcgis-geoevent-server) [StreamServer](https://developers.arcgis.com/rest/services-reference/stream-service.htm) layer, so it will emit geographic features in the [Esri JSON](https://developers.arcgis.com/documentation/common-data-types/feature-object.htm) format though a [WebSocket](https://developer.mozilla.org/en-US/docs/Web/API/WebSockets_API). This way we will be able to display a real time layer in ArcGIS without an [ArcGIS Enterprise](https://www.esri.com/en-us/arcgis/products/arcgis-enterprise/overview) stack.

![custom websocket server in arcgis](https://user-images.githubusercontent.com/826965/53808519-bc44bb80-3f52-11e9-9635-8687d5046bc4.gif)

It can be used with any [ArcGIS developer technology](https://developers.arcgis.com/documentation/#sdks) or [any other product](https://esri-es.github.io/awesome-arcgis/arcgis/products/). For example add the StreamServer to a [webmap](https://esri-es.github.io/awesome-arcgis/esri/open-vision/open-specifications/web-map/) and visualize it in Operations Dashboard, ArcGIS Pro, any Storymap, etc.

## Start the app

> *We are assuming you are familiar with NodeJS, if you are not please [read this first](https://nodejs.org/en/docs/guides/getting-started-guide/)*

1. Check [init.js](https://github.com/esri-es/arcgis_websocket_server/blob/feature/dynamic_service/init.js#L4) and fill in **SERVICE_CONF** object properly.

```js
const SERVICE_CONF = {
  name : "twitter",
  out_sr : {
    wkid : 102100,
    latestWkid : 3857
  },
  port : 9000,
  host : process.env["NGROK"]  || "localhost",
  protocol : process.env["NGROK"] ? "https" : "http"
};
```

> Be aware of the **name : "twitter"**. It will be propagated below, in the instructions. If you want to use othe name, change it also along the instructions.

2. Start the real time server: `node init.js "ws://localhost:8888" "4.11"`

> In this example **ws://localhost:8888** is the websocket connection we want to consume data from. This websocket connection it's not the same as the one which will be exposed by **StreamServer**. But don't worry, all will be wired up (luckily)

> It will check the **websocket** connection first. If it's any problem, it will notice it, and it will warn you :-)

> If it's able to connect, it "automagically" set the fields for your **StreamServer** according to the payload received in the websocket connection attempted before.

3. Start a web server: `cd example & http-server -p 9090`
4. Open: [http://localhost:9090/](http://localhost:9090/)
1. Stream service url: `http://localhost:9000/arcgis/rest/services/twitter/StreamServer`

### Using HTTPS (NGROK)

If you want to test this from the [sandbox sample](https://developers.arcgis.com/javascript/latest/sample-code/sandbox/index.html?sample=layers-streamlayer) you can also use [ngrok](https://ngrok.com/)

1) Run: `ngrok http 9000`
2) Stop init.js and run `NGROK=yourid.ngrok.io node init.js "ws://localhost:8888" "4.11"`
3) Use: `https://yourid.ngrok.io/arcgis/rest/services/twitter/StreamServer` instead of `http://localhost:9000/arcgis/rest/services/twitter/StreamServer`

## Known issues

### ArcGIS API for JavaScript version <= v4.8 & v3.x

> UPDATE : Working in a version which can handle any version! Cross your fingers!

Before [this commit](https://github.com/hhkaos/arcgis_websocket_server/commit/22c48299d92e7761e6c718d2c6afa525284fc448) on May 5, 2015 this streamserver was only working with JS API <= v4.8 and v3.x. If you want to know more you can also [check this issue](https://github.com/hhkaos/arcgis_websocket_server/issues/3).

## Documentation

* [ArcGIS Server > Stream services](http://enterprise.arcgis.com/en/server/latest/publish-services/linux/stream-services.htm)
* [ArcGIS REST API > StreamServices](https://developers.arcgis.com/rest/services-reference/stream-service.htm)
* [Awesome ArcGIS > GeoEvent Server](https://esri-es.github.io/awesome-arcgis/arcgis/products/arcgis-enterprise/arcgis-server/geoevent-server/)
* [Awesome ArcGIS > Internet of things (IoT) & Real-time (RT)](https://esri-es.github.io/awesome-arcgis/esri/emerging-technologies/iot-rt/?)
* [Public stream services in ArcGIS Online](https://esri-es.github.io/arcgis-developer-tips-and-tricks/arcgis-online/search/?q=typekeywords%3A%22stream+service%22&numResults=100&sortField=relevance&Thumbnail=generateThumbnail(elem)&Title=elem.title&Details=%27%3Ca+href%3D%22https%3A%2F%2Fwww.arcgis.com%2Fhome%2Fitem.html%3Fid%3D%27%2Belem.id%2B%27%22+target%3D%22_blank%22%3EDetails%3C%2Fa%3E%27&Owner=elem.owner&Type=elem.type&Views=elem.numViews)
  * [Preview several Stream Services simultaneously in a Web Map](http://www.arcgis.com/home/webmap/viewer.html?webmap=55a55a4c08934ba890f7fbd5589cffe6)
* [Pubnub & Esri](https://chrome.google.com/webstore/detail/allow-control-allow-origi/nlfbmbojpeacfghkpbjhddihlkkiljbi)
  * [Mapping and Tracking that Your Users Crave](https://www.youtube.com/watch?v=VWoXSJWgwrU)
  * [Esri DevSummit 2017 Keynote: PubNub CEO Todd Greene](https://www.youtube.com/watch?v=yrbODI7cuAk)
* [Search more about "Stream services"](https://esri-es.github.io/arcgis-search/?amp%3Butm_source=opensearch&search=%22Stream+services%22)
