/// <amd-dependency path="esri/core/tsSupport/declareExtendsHelper" name="__extends" />
/// <amd-dependency path="esri/core/tsSupport/decorateHelper" name="__decorate" />
var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
define(["require", "exports", "esri/core/tsSupport/declareExtendsHelper", "esri/core/tsSupport/decorateHelper", "esri/core/accessorSupport/decorators", "esri/widgets/Widget", "esri/layers/StreamLayer", "esri/tasks/QueryTask", "esri/tasks/support/Query", "esri/geometry/geometryEngine", "esri/widgets/support/widget"], function (require, exports, __extends, __decorate, decorators_1, Widget_1, StreamLayer_1, QueryTask_1, Query_1, geometryEngine_1, widget_1) {
    "use strict";
    Widget_1 = __importDefault(Widget_1);
    StreamLayer_1 = __importDefault(StreamLayer_1);
    QueryTask_1 = __importDefault(QueryTask_1);
    Query_1 = __importDefault(Query_1);
    geometryEngine_1 = __importDefault(geometryEngine_1);
    var CSS = {
        base: "esri-real-time-layer-list",
        emphasis: "esri-hello-world--emphasis"
    };
    var PARTY_INDEX = ["PSOE", "PP", "Ciudadanos", "Podemos", "Vox"];
    var RealTimeLayerList = /** @class */ (function (_super) {
        __extends(RealTimeLayerList, _super);
        function RealTimeLayerList(properties) {
            var _this = _super.call(this) || this;
            _this.url = "https://geoeventsample1.esri.com:6443/arcgis/rest/services/LABus/StreamServer";
            _this.mapView = null;
            // if(properties.panel){
            //     this.panel = properties.panel;
            // }
            var layerProp = {
                url: properties.layer.url
            };
            if (properties.layer.filter) {
                layerProp.filter = properties.layer.filter;
            }
            if (properties.layer.popupTemplate) {
                layerProp.popupTemplate = properties.layer.popupTemplate;
            }
            if (properties.layer.renderer) {
                layerProp.renderer = properties.layer.renderer;
            }
            if (properties.aggregationLayers && properties.aggregationLayers.length > 0) {
                // TODO: get all aggregationLayers not only index = 0
                var index_1 = 0;
                var qTask = new QueryTask_1.default({
                    url: properties.aggregationLayers[index_1].url
                }), params = new Query_1.default({
                    where: '1 = 1',
                    outSpatialReference: {
                        wkid: 102100
                    },
                    returnGeometry: true,
                    outFields: ["*"]
                });
                qTask
                    .execute(params)
                    .then(function (response) {
                    console.log("Response: ", response);
                    var containerEl = document.getElementById("graphDiv");
                    // Set counters to 0
                    response.features.forEach(function (elem, i) {
                        elem.counters = {
                            tweets: 0,
                            parties: [{
                                    "partido": "PSOE",
                                    "tweets": 0,
                                    "ccaa": i //elem.attributes.OBJECTID
                                }, {
                                    "partido": "PP",
                                    "tweets": 0,
                                    "ccaa": i //elem.attributes.OBJECTID
                                }, {
                                    "partido": "Ciudadanos",
                                    "tweets": 0,
                                    "ccaa": i //elem.attributes.OBJECTID
                                }, {
                                    "partido": "Podemos",
                                    "tweets": 0,
                                    "ccaa": i //elem.attributes.OBJECTID
                                }, {
                                    "partido": "Vox",
                                    "tweets": 0,
                                    "ccaa": i //elem.attributes.OBJECTID
                                }
                            ]
                        };
                        var el = document.createElement('div');
                        el.setAttribute("id", "chartDiv" + i);
                        el.className = "flex-item";
                        containerEl.appendChild(el);
                        // elem.graph = this.displayChart(`chartDiv${i}`, elem.attributes.Nombre, elem.counters.parties);
                    });
                    // Add response to property: aggregationLayers
                    properties.aggregationLayers[index_1].response = response;
                })
                    .catch(function (error) {
                    console.error("Promise rejected: ", error.message);
                });
            }
            var streamLayer = new StreamLayer_1.default(layerProp);
            var that = _this;
            properties.mapView.map.add(streamLayer);
            properties.mapView.whenLayerView(streamLayer)
                .then(function (streamLayerView) {
                streamLayerView.on("data-received", function (elem) {
                    // console.log("elem=",elem)
                    var attr = elem.attributes;
                    var d = new Date(attr.created_at);
                    var i = 0, ccaa, res, numCCAA = that.aggregationLayers[0].response.features.length;
                    do {
                        ccaa = that.aggregationLayers[0].response.features[i];
                        res = geometryEngine_1.default.intersect(ccaa.geometry, elem.geometry);
                        if (!res)
                            i++;
                    } while (i < numCCAA && !res);
                    // Update counters
                    if (i < numCCAA) {
                        ccaa.counters.tweets++;
                        if (elem.attributes.psoe)
                            ccaa.counters.parties[PARTY_INDEX.indexOf("PSOE")].tweets++;
                        if (elem.attributes.pp)
                            ccaa.counters.parties[PARTY_INDEX.indexOf("PP")].tweets++;
                        if (elem.attributes.ciudadanos)
                            ccaa.counters.parties[PARTY_INDEX.indexOf("Ciudadanos")].tweets++;
                        if (elem.attributes.podemos)
                            ccaa.counters.parties[PARTY_INDEX.indexOf("Podemos")].tweets++;
                        if (elem.attributes.vox)
                            ccaa.counters.parties[PARTY_INDEX.indexOf("Vox")].tweets++;
                        console.log(ccaa.attributes.Nombre + ": " + JSON.stringify(ccaa.counters.parties));
                        // ccaa.elem.counters.parties
                        ccaa.validateData();
                    }
                    // $('#').prepend(
                    var tweet = "\n                        <li class=\"tweet\">\n                            <a href=\"https://www.twitter.com/" + attr.screename + "\" target=\"_blank\">\n                                <img src=\"" + attr.profile_image_url_https + "\">\n                            </a>\n                            <div class=\"block\">\n                                <span class=\"usename\">\n                                    <a href=\"https://www.twitter.com/" + attr.screename + "\" target=\"_blank\">\n                                        " + attr.username + "\n                                    </a>:<br>\n                                    " + that.linkify(attr.text) + "\n                                </span><br>\n                                <span\n                                    class=\"place\"\n                                    data-dojo-attach-point=\"id-" + attr.id_str + "\"\n                                    data-dojo-attach-event=\"click: clicked\">\n                                        " + attr.location + "\n                                </span>\n                                <small>" + that.formatDate(d) + " | <a href=\"" + attr.tweet_url + "\" target=\"_blank\">View original</a></small>\n                            </div>\n                        </li>\n                    ";
                    var parent = document.getElementById('tweet-list');
                    var el = document.createElement('li');
                    el.classList.add("tweet");
                    el.innerHTML = tweet.trim();
                    parent.insertBefore(el.firstChild, parent.firstChild);
                    that.messages.push(elem);
                });
            });
            return _this;
        }
        RealTimeLayerList.prototype.render = function () {
            return (widget_1.tsx("div", { class: "esri-real-time-layer-list" },
                widget_1.tsx("div", { class: "header" },
                    widget_1.tsx("p", null, this.panel.title)),
                widget_1.tsx("ul", { id: "tweet-list" })));
        };
        RealTimeLayerList.prototype.formatDate = function (d) {
            var month = d.getMonth() + 1, day = d.getDate(), year = d.getFullYear(), t = {
                hour: d.getHours(),
                minutes: d.getMinutes(),
                seconds: d.getSeconds()
            };
            ["hour", "minutes", "seconds"].forEach(function (elem, i) {
                t[elem] = (t[elem] < 10) ? "0" + t[elem] : t[elem];
            });
            return [day, month, year].join('/') + ' ' +
                [t.hour, t.minutes, t.seconds].join(':');
        };
        RealTimeLayerList.prototype.linkify = function (inputText) {
            var replacedText, replacePattern1, replacePattern2, replacePattern3;
            //URLs starting with http://, https://, or ftp://
            replacePattern1 = /(\b(https?|ftp):\/\/[-A-Z0-9+&@#\/%?=~_|!:,.;]*[-A-Z0-9+&@#\/%=~_|])/gim;
            replacedText = inputText.replace(replacePattern1, '<a href="$1" target="_blank">$1</a>');
            //URLs starting with "www." (without // before it, or it'd re-link the ones done above).
            replacePattern2 = /(^|[^\/])(www\.[\S]+(\b|$))/gim;
            replacedText = replacedText.replace(replacePattern2, '$1<a href="http://$2" target="_blank">$2</a>');
            //Change email addresses to mailto:: links.
            replacePattern3 = /(([a-zA-Z0-9\-\_\.])+@[a-zA-Z\_]+?(\.[a-zA-Z]{2,6})+)/gim;
            replacedText = replacedText.replace(replacePattern3, '<a href="mailto:$1">$1</a>');
            return replacedText;
        };
        RealTimeLayerList.prototype.displayChart = function (domId, chartTitle, data) {
            am4core.useTheme(am4themes_animated);
            var chart = am4core.create(domId, am4charts.PieChart);
            var title = chart.titles.create();
            title.text = chartTitle;
            title.fontSize = 15;
            title.marginBottom = 0;
            // Add and configure Series
            var pieSeries = chart.series.push(new am4charts.PieSeries());
            pieSeries.dataFields.value = "tweets";
            pieSeries.dataFields.category = "partido";
            // var colorSet = new am4core.ColorSet();
            // PSOE: #F80100
            // PP: #009ED9
            // Ciudadanos: #EA8223
            // Podemos: #682A53
            // Vox #57BB33
            // colorSet.list = ["#F80100", "#009ED9", "#EA8223", "#682A53", "#57BB33"].map(function(color): am4core.Color {
            //     return new am4core.color(color);
            // });
            // pieSeries.colors = colorSet;
            // Let's cut a hole in our Pie chart the size of 30% the radius
            chart.innerRadius = am4core.percent(30);
            // Put a thick white border around each Slice
            pieSeries.slices.template.stroke = am4core.color("#fff");
            pieSeries.slices.template.strokeWidth = 2;
            pieSeries.slices.template.strokeOpacity = 1;
            // change the cursor on hover to make it apparent the object can be interacted with
            pieSeries.slices.template.cursorOverStyle = [
                {
                    "property": "cursor",
                    "value": "pointer"
                }
            ];
            // pieSeries.alignLabels = false;
            pieSeries.ticks.template.disabled = true;
            pieSeries.alignLabels = false;
            pieSeries.labels.template.text = "";
            pieSeries.slices.template.events.on("down", function (ev) {
                var series = ev.target.dataItem.component;
                console.log("something happened ", ev);
                console.log("ev.target.dataItem.dataContext = " + JSON.stringify(ev.target.dataItem.dataContext));
            });
            chart.events.on("datavalidated", function () {
                console.log("Data validated");
            });
            // Create a base filter effect (as if it's not there) for the hover to return to
            var shadow = pieSeries.slices.template.filters.push(new am4core.DropShadowFilter);
            shadow.opacity = 0;
            // Create hover state
            var hoverState = pieSeries.slices.template.states.getKey("hover"); // normally we have to create the hover state, in this case it already exists
            // Slightly shift the shadow and make it more prominent on hover
            var hoverShadow = hoverState.filters.push(new am4core.DropShadowFilter);
            hoverShadow.opacity = 0.7;
            hoverShadow.blur = 5;
            chart.data = data;
            return chart;
        };
        __decorate([
            decorators_1.property(),
            widget_1.renderable()
        ], RealTimeLayerList.prototype, "url", void 0);
        __decorate([
            decorators_1.property(),
            widget_1.renderable()
        ], RealTimeLayerList.prototype, "mapView", void 0);
        __decorate([
            decorators_1.property(),
            widget_1.renderable()
        ], RealTimeLayerList.prototype, "messages", void 0);
        __decorate([
            decorators_1.property(),
            widget_1.renderable()
        ], RealTimeLayerList.prototype, "panel", void 0);
        __decorate([
            decorators_1.property(),
            widget_1.renderable()
        ], RealTimeLayerList.prototype, "aggregationLayers", void 0);
        RealTimeLayerList = __decorate([
            decorators_1.subclass("esri.widgets.RealTimeLayerList")
        ], RealTimeLayerList);
        return RealTimeLayerList;
    }(decorators_1.declared(Widget_1.default)));
    return RealTimeLayerList;
});
//# sourceMappingURL=RealTimeLayerList.js.map