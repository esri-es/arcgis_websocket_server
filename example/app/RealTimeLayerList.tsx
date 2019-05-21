/// <amd-dependency path="esri/core/tsSupport/declareExtendsHelper" name="__extends" />
/// <amd-dependency path="esri/core/tsSupport/decorateHelper" name="__decorate" />

import { subclass, declared, property } from "esri/core/accessorSupport/decorators";

import Widget from "esri/widgets/Widget";
import mapView from "esri/views/MapView";
import StreamLayer from "esri/layers/StreamLayer";
import StreamLayerView from "esri/views/layers/StreamLayerView";


import { renderable, tsx } from "esri/widgets/support/widget";

const CSS = {
    base: "esri-real-time-layer-list",
    emphasis: "esri-hello-world--emphasis"
};

@subclass("esri.widgets.RealTimeLayerList")
class RealTimeLayerList extends declared(Widget) {

    @property()
    @renderable()
    url: string = "https://geoeventsample1.esri.com:6443/arcgis/rest/services/LABus/StreamServer";


    @property()
    @renderable()
    mapView: mapView = null;

    @property()
    @renderable()
    messages: [string] = [''];

    @property()
    @renderable()
    title: string = "";



    constructor(properties: any){
        super();

        interface LooseObject {
            [key: string]: any
        }

        let layerProp: LooseObject = {
            url: properties.url
        }

        if(properties.filter){
            layerProp.filter = properties.filter;
        }

        if(properties.popupTemplate){
            layerProp.popupTemplate = properties.popupTemplate;
        }

        if(properties.renderer){
            layerProp.renderer = properties.renderer;
        }

        const streamLayer = new StreamLayer(layerProp);

        const that = this;

        properties.mapView.map.add(streamLayer);


        properties.mapView.whenLayerView(streamLayer)
            .then(function(streamLayerView: StreamLayerView) {
                streamLayerView.on("data-received", function(elem: any){
                    // console.log("elem=",elem)
                    // that.messages.push(elem);

                    var attr = elem.attributes;
                    var d = new Date(attr.created_at);

                    // $('#').prepend(
                    let tweet = `
                        <li class="tweet">
                            <a href="https://www.twitter.com/${attr.screename}" target="_blank">
                                <img src="${attr.profile_image_url_https}">
                            </a>
                            <div class="block">
                                <span class="usename">
                                    <a href="https://www.twitter.com/${attr.screename}" target="_blank">
                                        ${attr.username}
                                    </a>:<br>
                                    ${that.linkify(attr.text)}
                                </span><br>
                                <span
                                    class="place"
                                    data-dojo-attach-point="id-${attr.id_str}"
                                    data-dojo-attach-event="click: clicked">
                                        ${attr.location}
                                </span>
                                <small>${that.formatDate(d)} | <a href="${attr.tweet_url}" target="_blank">View original</a></small>
                            </div>
                        </li>
                    `;
                    let parent = document.getElementById('tweet-list');
                    var el= document.createElement('li');
                    el.classList.add("tweet");
                    el.innerHTML = tweet.trim();
                    parent.insertBefore( el.firstChild, parent.firstChild);
                });
            });
    }

    render() {
        return (
            <div class="esri-real-time-layer-list">
                <p>{this.title}</p>
                <ul id="tweet-list"></ul>
            </div>
        );
    }

    private formatDate(d: Date){
        var month = d.getMonth()+ 1,
            day = d.getDate(),
            year = d.getFullYear(),

            t = {
            hour: d.getHours(),
            minutes: d.getMinutes(),
            seconds: d.getSeconds()
        };

        ["hour", "minutes", "seconds"].forEach(function(elem, i){

            t[elem] = (t[elem] < 10)? "0" + t[elem] : t[elem];

        });

        return [day, month ,year].join('/')+' '+
        [t.hour, t.minutes, t.seconds].join(':');
    }

    private linkify(inputText: string) {
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
    }
}

export = RealTimeLayerList;
