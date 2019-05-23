/// <amd-dependency path="esri/core/tsSupport/declareExtendsHelper" name="__extends" />
/// <amd-dependency path="esri/core/tsSupport/decorateHelper" name="__decorate" />

import { subclass, declared, property } from "esri/core/accessorSupport/decorators";

import Widget from "esri/widgets/Widget";
import mapView from "esri/views/MapView";
import StreamLayer from "esri/layers/StreamLayer";
import StreamLayerView from "esri/views/layers/StreamLayerView";
import QueryTask from "esri/tasks/QueryTask";
import Query from "esri/tasks/support/Query";
import geometryEngine from "esri/geometry/geometryEngine";

// import * as am4core from "../node_modules/@amcharts/amcharts4/core";
// import * as am4charts from "../node_modules/@amcharts/amcharts4/charts";
// import am4themes_animated from "../node_modules/@amcharts/amcharts4/themes/animated";

import { renderable, tsx } from "esri/widgets/support/widget";

const CSS = {
    base: "esri-real-time-layer-list",
    emphasis: "esri-hello-world--emphasis"
};

interface LooseObject {
    [key: string]: any
}

const PARTY_INDEX = ["PSOE", "PP", "Ciudadanos", "Podemos", "Vox"];

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
    messages: [LooseObject];

    @property()
    @renderable()
    panel: LooseObject;

    @property()
    @renderable()
    aggregationLayers: [LooseObject];

    constructor(properties: any){
        super();

        // if(properties.panel){
        //     this.panel = properties.panel;
        // }

        let layerProp: LooseObject = {
            url: properties.layer.url
        }

        if(properties.layer.filter){
            layerProp.filter = properties.layer.filter;
        }

        if(properties.layer.popupTemplate){
            layerProp.popupTemplate = properties.layer.popupTemplate;
        }

        if(properties.layer.renderer){
            layerProp.renderer = properties.layer.renderer;
        }

        if(properties.aggregationLayers && properties.aggregationLayers.length > 0){
            // TODO: get all aggregationLayers not only index = 0
            let index = 0
            let qTask = new QueryTask({
                    url: properties.aggregationLayers[index].url
                }),
                params = new Query({
                    where: '1 = 1',
                    outSpatialReference: {
                        wkid: 102100
                    },
                    returnGeometry: true,
                    outFields: ["*"]
                });

            qTask
                .execute(params)
                .then(response => {
                    console.log("Response: ", response);

                    let containerEl = document.getElementById("graphDiv");
                    // Set counters to 0
                    response.features.forEach((elem: any, i: number) => {
                        elem.counters = {
                            tweets: 0,
                            parties:[{
                                    "partido": "PSOE",
                                    "tweets": 0,
                                    "ccaa": i//elem.attributes.OBJECTID
                                },{
                                    "partido": "PP",
                                    "tweets": 0,
                                    "ccaa": i//elem.attributes.OBJECTID
                                },{
                                    "partido": "Ciudadanos",
                                    "tweets": 0,
                                    "ccaa": i//elem.attributes.OBJECTID
                                },{
                                    "partido": "Podemos",
                                    "tweets": 0,
                                    "ccaa": i//elem.attributes.OBJECTID
                                },{
                                    "partido": "Vox",
                                    "tweets": 0,
                                    "ccaa": i//elem.attributes.OBJECTID
                                }
                            ]
                        }
                        var el = document.createElement('div');
                        el.setAttribute("id", `chartDiv${i}`);
                        el.className = "flex-item";
                        containerEl.appendChild(el);
                        // elem.graph = this.displayChart(`chartDiv${i}`, elem.attributes.Nombre, elem.counters.parties);
                    });

                    // Add response to property: aggregationLayers
                    properties.aggregationLayers[index].response = response;

                })
                .catch(error => {
                    console.error("Promise rejected: ", error.message);
                });
        }

        const streamLayer = new StreamLayer(layerProp);

        const that = this;

        properties.mapView.map.add(streamLayer);


        properties.mapView.whenLayerView(streamLayer)
            .then(function(streamLayerView: StreamLayerView) {
                streamLayerView.on("data-received", function(elem: any){
                    // console.log("elem=",elem)


                    var attr = elem.attributes;
                    var d = new Date(attr.created_at);
                    let i = 0, ccaa, res,
                        numCCAA = that.aggregationLayers[0].response.features.length;

                    do{
                        ccaa = that.aggregationLayers[0].response.features[i];
                        res = geometryEngine.intersect(ccaa.geometry, elem.geometry);
                        if(!res) i++;
                    }while(i < numCCAA && !res);

                    // Update counters
                    if( i < numCCAA){
                        ccaa.counters.tweets++;
                        if(elem.attributes.psoe) ccaa.counters.parties[PARTY_INDEX.indexOf("PSOE")].tweets++;
                        if(elem.attributes.pp) ccaa.counters.parties[PARTY_INDEX.indexOf("PP")].tweets++;
                        if(elem.attributes.ciudadanos) ccaa.counters.parties[PARTY_INDEX.indexOf("Ciudadanos")].tweets++;
                        if(elem.attributes.podemos) ccaa.counters.parties[PARTY_INDEX.indexOf("Podemos")].tweets++;
                        if(elem.attributes.vox) ccaa.counters.parties[PARTY_INDEX.indexOf("Vox")].tweets++;

                        console.log(`${ccaa.attributes.Nombre}: ${JSON.stringify(ccaa.counters.parties)}`);

                        // ccaa.elem.counters.parties
                        ccaa.validateData();
                    }

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

                    that.messages.push(elem);
                });
            });
    }

    render() {
        return (
            <div class="esri-real-time-layer-list">
                <div class="header">
                    <p>{this.panel.title}</p>
                </div>
                <ul id="tweet-list" >

                </ul>

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

    private displayChart(domId: string, chartTitle: string, data: any){
        am4core.useTheme(am4themes_animated);

        let chart = am4core.create(domId, am4charts.PieChart);

        var title = chart.titles.create();
        title.text = chartTitle;
        title.fontSize = 15;
        title.marginBottom = 0;

        // Add and configure Series
        let pieSeries = chart.series.push(new am4charts.PieSeries());
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
        pieSeries.labels.template.text = ""

        pieSeries.slices.template.events.on("down", function(ev) {
            var series = ev.target.dataItem.component;
            console.log("something happened ", ev);
            console.log(`ev.target.dataItem.dataContext = ${JSON.stringify(ev.target.dataItem.dataContext)}`);
        });

        chart.events.on("datavalidated", function () {
            console.log("Data validated")
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

    }
}

export = RealTimeLayerList;
