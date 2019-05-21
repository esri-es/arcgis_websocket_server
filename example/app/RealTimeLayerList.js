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
define(["require", "exports", "esri/core/tsSupport/declareExtendsHelper", "esri/core/tsSupport/decorateHelper", "esri/core/accessorSupport/decorators", "esri/widgets/Widget", "esri/layers/StreamLayer", "esri/widgets/support/widget"], function (require, exports, __extends, __decorate, decorators_1, Widget_1, StreamLayer_1, widget_1) {
    "use strict";
    Widget_1 = __importDefault(Widget_1);
    StreamLayer_1 = __importDefault(StreamLayer_1);
    var CSS = {
        base: "esri-real-time-layer-list",
        emphasis: "esri-hello-world--emphasis"
    };
    var RealTimeLayerList = /** @class */ (function (_super) {
        __extends(RealTimeLayerList, _super);
        function RealTimeLayerList(properties) {
            var _this = _super.call(this) || this;
            _this.url = "https://geoeventsample1.esri.com:6443/arcgis/rest/services/LABus/StreamServer";
            _this.mapView = null;
            _this.messages = [''];
            _this.title = "";
            var layerProp = {
                url: properties.url
            };
            if (properties.filter) {
                layerProp.filter = properties.filter;
            }
            if (properties.popupTemplate) {
                layerProp.popupTemplate = properties.popupTemplate;
            }
            if (properties.renderer) {
                layerProp.renderer = properties.renderer;
            }
            var streamLayer = new StreamLayer_1.default(layerProp);
            var that = _this;
            properties.mapView.map.add(streamLayer);
            properties.mapView.whenLayerView(streamLayer)
                .then(function (streamLayerView) {
                streamLayerView.on("data-received", function (elem) {
                    // console.log("elem=",elem)
                    // that.messages.push(elem);
                    var attr = elem.attributes;
                    var d = new Date(attr.created_at);
                    // $('#').prepend(
                    var tweet = "\n                        <li class=\"tweet\">\n                            <a href=\"https://www.twitter.com/" + attr.screename + "\" target=\"_blank\">\n                                <img src=\"" + attr.profile_image_url_https + "\">\n                            </a>\n                            <div class=\"block\">\n                                <span class=\"usename\">\n                                    <a href=\"https://www.twitter.com/" + attr.screename + "\" target=\"_blank\">\n                                        " + attr.username + "\n                                    </a>:<br>\n                                    " + that.linkify(attr.text) + "\n                                </span><br>\n                                <span\n                                    class=\"place\"\n                                    data-dojo-attach-point=\"id-" + attr.id_str + "\"\n                                    data-dojo-attach-event=\"click: clicked\">\n                                        " + attr.location + "\n                                </span>\n                                <small>" + that.formatDate(d) + " | <a href=\"" + attr.tweet_url + "\" target=\"_blank\">View original</a></small>\n                            </div>\n                        </li>\n                    ";
                    var parent = document.getElementById('tweet-list');
                    var el = document.createElement('li');
                    el.classList.add("tweet");
                    el.innerHTML = tweet.trim();
                    parent.insertBefore(el.firstChild, parent.firstChild);
                });
            });
            return _this;
        }
        RealTimeLayerList.prototype.render = function () {
            return (widget_1.tsx("div", { class: "esri-real-time-layer-list" },
                widget_1.tsx("p", null, this.title),
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
        ], RealTimeLayerList.prototype, "title", void 0);
        RealTimeLayerList = __decorate([
            decorators_1.subclass("esri.widgets.RealTimeLayerList")
        ], RealTimeLayerList);
        return RealTimeLayerList;
    }(decorators_1.declared(Widget_1.default)));
    return RealTimeLayerList;
});
//# sourceMappingURL=RealTimeLayerList.js.map