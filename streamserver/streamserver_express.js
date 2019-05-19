var express = require('express');
const expressWebSocket = require('express-ws');
const websocket = require('websocket-stream');
const websocketStream = require('websocket-stream/stream');
const {parser} = require('stream-json/Parser');
const {streamValues} = require('stream-json/streamers/StreamValues');
const {chain} = require('stream-chain');
const uuidv4 = require('uuid/v4');
const proj4 = require('proj4');
const esriTypes = require('./utils/esri_types.js');
const streamServerFilter = require('./src/filter_utils.js');

function setup(serviceName) {
    var CONF;
    try {
        let {
            hostname,
            port,
            protocol
        } = new URL(process.argv[2]);
        CONF = {
            ws: {
                server: {
                    port: process.env["NGROK"] ? null : 9000,
                    protocol: "ws",
                    host: process.env["NGROK"] || "localhost"
                },
                client: {
                    protocol: protocol.replace(/:/g, ""),
                    host: hostname,
                    port: port,
                    geo_fields: null
                }
            },
            service: {
                name: serviceName,
                fieldObj: null,
                out_sr: {
                    wkid: 102100,
                    latestWkid: 3857
                }
            }
        };
    } catch (err) {
        console.log(`ws initialization failed! reason : [${err}]`);
        process.exit(12);
    }
    return CONF;
}

function updateServiceInfo(obj) {
    let service = require('./templates/service.json');
    Object.keys(obj).forEach(k => {
        service[k] = obj[k];
    });
    return service;
}

const JSAPI_VERSION = process.argv[3] || "4.11";

function doChallenge() {
    return !/^(3\.[1-9][0-9]|4\.[1-8]?)$/.test(JSAPI_VERSION);
}

function guessGeoFields(arr) {
    let candidates = arr
        .filter(fieldObj => fieldObj.type === "esriFieldTypeDouble")
        .filter(fieldObj => /\b(latitude|longitude|lat|lon|x|y)\b/.test(fieldObj.name));

    if (candidates.length >= 2) {
        console.log(`found geofields candidates:`);
        candidates.map(e => console.log(e.name))
    }
    return {
        latField: "lat",
        lonField: "lon"
    }
}

function start(conf) {
    // Maybe we can move this to setup()
    const SERVICE_NAME = conf.service.name;
    const BASE_URL = `/arcgis/rest/services/${SERVICE_NAME}/StreamServer`;
    let wsClientPort = conf.ws.client.port ?
        `:${conf.ws.client.port}` :
        "";
    let wsServerPort = conf.ws.server.port ?
        `:${conf.ws.server.port}` :
        "";
    let wsClientUrl = `${conf.ws.client.protocol}://${conf.ws.client.host}${wsClientPort}`;
    let wsServerUrl = `${conf.ws.server.protocol}://${conf.ws.server.host}${wsServerPort}${BASE_URL}`;
    let fields = esriTypes.convertToEsriFields(conf.service.fieldObj);
    let {
        latField,
        lonField
    } = guessGeoFields(fields);

    let serviceRes = updateServiceInfo({
        fields: fields,
        streamUrls: [{
            "transport": "ws",
            "urls": [
                //`wss://${wsUrl}`,
                `${wsServerUrl}`
            ]
        }]
    });

    var app = express();
    // CORS middleware
    app.use(function(req, res, next) {
        res.header("Access-Control-Allow-Origin", "*");
        res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
        next();
    });

    app.get(`${BASE_URL}`, function(req, res, next) {
        res.status(200).json(serviceRes);
        res.end();
    });

    // extend express app with app.ws()
    expressWebSocket(app, null, {
        perMessageDeflate: false,
    });

    let pullStream = websocket(wsClientUrl, {
        perMessageDeflate: false
    });

    app.ws('/subscribe', function(ws, req) {

        // convert ws instance to stream
        const stream = websocketStream(ws, {
            // websocket-stream options here
            binary: true,
        });

        stream.socket.uuid = uuidv4();
        stream.socket.challenge = false;
        var filter = false;
        stream.on('data', function(buf) {
            let data = buf.toString();
            console.log(`${data} from [${stream.socket.uuid}]`);
            if (!connections[stream.socket.uuid].challenge && doChallenge()) {
                // Challenge
                stream.write(JSON.stringify({
                    error: null,
                    ...JSON.parse(data)
                }));
                console.log("Challenge done!");
                connections[stream.socket.uuid].challenge = true;
            } else {
                // Filters
                try {
                    connections[stream.socket.uuid].filter = JSON.parse(data).filter.where;
                    filter = true;
                } catch (err) {
                    console.log(`Invalid filter received from ${stream.socket.uuid}: ${data}`);
                };
            }
        });
        stream.on('close', function() {
            console.log(`client [${stream.socket.uuid}] disconnected`);
            delete connections[stream.socket.uuid];
        })

        let pipeline = chain([
            parser({
                jsonStreaming: true
            }),
            streamValues(),
            data => {
                return filter ?
                    streamServerFilter(data.value, connections[stream.socket.uuid].filter) ?
                    data :
                    null :
                    data;
            },
            data => {
                // Reprojection according to conf.
                let [lon, lat] = proj4(proj4.defs(`EPSG:${serviceRes.service.out_sr.latestWkid}`), [data.value[lonField], data.value[latField]])
                data.value[latField] = lat;
                data.value[lonField] = lon;
                return data;

            },
            data => Buffer.from(JSON.stringify(data.value))
        ]);

        connections[stream.socket.uuid] = stream.socket;
        pullStream
            .pipe(pipeline)
            .pipe(stream)

    });

    app.listen(conf.ws.server.port)
}



module.exports = {
    start: start,
    setup: setup
};
