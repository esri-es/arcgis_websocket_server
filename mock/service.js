var jsonlint = require("jsonlint");

var SERVICE = `{
    "description": null,
    "objectIdField": null,
    "displayField": "id_str",
    "timeInfo": {
        "trackIdField": "id_str",
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
            "name": "username",
            "type": "esriFieldTypeString",
            "alias": "username",
            "nullable": true
        },
        {
            "name": "screename",
            "type": "esriFieldTypeString",
            "alias": "screename",
            "nullable": true
        },
        {
            "name": "text",
            "type": "esriFieldTypeString",
            "alias": "text",
            "nullable": true
        },
        {
            "name": "profile_image_url_https",
            "type": "esriFieldTypeString",
            "alias": "profile_image_url_https",
            "nullable": true
        },
        {
            "name": "location",
            "type": "esriFieldTypeString",
            "alias": "location",
            "nullable": true
        },
        {
            "name": "created_at",
            "type": "esriFieldTypeDate",
            "alias": "created_at",
            "nullable": true
        },
        {
            "name": "id_str",
            "type": "esriFieldTypeString",
            "alias": "id_str",
            "nullable": true
        },
        {
            "name": "reply_count",
            "type": "esriFieldTypeString",
            "alias": "reply_count",
            "nullable": true
        },
        {
            "name": "retweet_count",
            "type": "esriFieldTypeString",
            "alias": "retweet_count",
            "nullable": true
        },
        {
            "name": "favorite_count",
            "type": "esriFieldTypeString",
            "alias": "favorite_count",
            "nullable": true
        },
        {
            "name": "tweet_url",
            "type": "esriFieldTypeString",
            "alias": "tweet_url",
            "nullable": true
        },
        {
            "name": "is_rt",
            "type": "esriFieldTypeString",
            "alias": "is_rt",
            "nullable": true
        },
        {
            "name": "pp",
            "type": "esriFieldTypeString",
            "alias": "pp",
            "nullable": true
        },
        {
            "name": "psoe",
            "type": "esriFieldTypeString",
            "alias": "psoe",
            "nullable": true
        },
        {
            "name": "podemos",
            "type": "esriFieldTypeString",
            "alias": "podemos",
            "nullable": true
        },
        {
            "name": "ciudadanos",
            "type": "esriFieldTypeString",
            "alias": "ciudadanos",
            "nullable": true
        },
        {
            "name": "vox",
            "type": "esriFieldTypeString",
            "alias": "vox",
            "nullable": true
        }

    ],
    "currentVersion": "10.5",
    "streamUrls": [

    ],
    "capabilities": "broadcast,subscribe"
}`;

function fill(wsUrl) {
    try{
        jsonlint.parse(SERVICE);
        SERVICE = JSON.parse(SERVICE);
        // TODO validate service schema: https://github.com/tdegrunt/jsonschema
        SERVICE.streamUrls.push({
            "transport": "ws",
            "urls": [
                `wss://${wsUrl}`,
                `ws://${wsUrl}`
            ]
        });
        return SERVICE;
    }catch(err){
        return {
            msg: 'Invalid service definition talk to the admin of this service',
            error: err
        };
    }


}

module.exports = fill
