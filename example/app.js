const PARTY_INDEX = ["PSOE", "PP", "Ciudadanos", "Podemos", "Vox"];
window.$MY = {};

require([
    "esri/Map",
    "esri/views/MapView",
    "esri/layers/VectorTileLayer",
    "esri/layers/StreamLayer",
    // "esri/views/layers/StreamLayerView",
    "esri/tasks/QueryTask",
    "esri/tasks/support/Query",
    "esri/geometry/geometryEngine"
],function(
    Map,
    MapView,
    VectorTileLayer,
    StreamLayer,
    // StreamLayerView,
    QueryTask,
    Query,
    geometryEngine
) {

    var map = new Map();

    var tileLayer = new VectorTileLayer({
        url:
            "https://jsapi.maps.arcgis.com/sharing/rest/content/items/75f4dfdff19e445395653121a95a85db/resources/styles/root.json"
        }
    );

    map.add(tileLayer);

    var mapView = new MapView({
        container: "viewDiv",
        map: map,
        center: [ -3, 40 ],
        zoom: 5
    });

    // OLD: var widget = new RealTimeLayerList(config)
    var config = {
        //  mapView: mapView,
        container: "widgetDiv",
        layer: {
            url: "https://80b04449.ngrok.io/arcgis/rest/services/twitter/StreamServer",
            renderer: {
                "type": "simple",
                "symbol": {
                    "type": "picture-marker",
                    "url": "https://static.arcgis.com/images/Symbols/Firefly/FireflyC2.png",
                }
            },
            definitionExpression: "is_rt = 'false'",
            popupTemplate: {
                title: "@{username}",
                content: [{
                    type: "text",
                    text: `
                        <p>
                            <img src=\"{profile_image_url_https}\" style=\"float:left; margin:0 10px 10px 0;\">
                            Mensaje: {text}
                        </p>
                        <p>
                            is_rt: {is_rt}
                        </p>
                        <p>
                            Desde: {location} (match: {match})
                        </p>
                    `
                }]
            }
        },
        aggregationLayers: [{
            title: "Comunidades Autónomas",
            url: "https://services1.arcgis.com/nCKYwcSONQTkPA4K/ArcGIS/rest/services/CCAA_wgs1984_wm/FeatureServer/0"
        }/*,{
            title: "Provincias",
            url: "https://services1.arcgis.com/nCKYwcSONQTkPA4K/arcgis/rest/services/Prov/FeatureServer/0"
        }*/],
        panel: {
            title: "Tweets: #PP, #PSOE, ... ",
            // container: <string>,
            // maxFeatures: <number>,
            // filters: [
            //    label: <whereClause>
            // ],
            // onclick: {
            //     pan: <true|false>,
            //     zoom: <true|false>,
            //     ...
            // }
        }
    };

    window.$MY = config;
    $MY.messages = [];

    if(config.aggregationLayers && config.aggregationLayers.length > 0){
        // TODO: get all aggregationLayers not only index = 0
        let index = 0
        let qTask = new QueryTask({
                url: config.aggregationLayers[index].url
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
                // console.log("Response: ", response);

                let containerEl = document.getElementById("graphDiv");
                // Set counters to 0
                response.features.forEach((elem, i) => {
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
                    el.style.display = "none";
                    containerEl.appendChild(el);
                    elem.graph = $MY.displayChart(`chartDiv${i}`, elem.attributes.Nombre, elem.counters.parties);
                });

                // Add response to property: aggregationLayers
                config.aggregationLayers[index].response = response;

            })
            .catch(error => {
                console.error("Promise rejected: ", error.message);
            });
    }

    $MY.streamLayer = new StreamLayer(config.layer);

    const that = this;

    mapView.map.add($MY.streamLayer);

    mapView.whenLayerView($MY.streamLayer)
        .then(function(streamLayerView) {
            streamLayerView.on("data-received", function(elem){
                // console.log("elem=",elem)

                var attr = elem.attributes;
                var d = new Date(attr.created_at);
                let i = 0, ccaa, res,
                    numCCAA = $MY.aggregationLayers[0].response.features.length;

                do{
                    ccaa = $MY.aggregationLayers[0].response.features[i];
                    res = geometryEngine.intersect(ccaa.geometry, elem.geometry);
                    if(!res) i++;
                }while(i < numCCAA && !res);

                // Update counters
                if(i < numCCAA){
                    ccaa.counters.tweets++;
                    if(ccaa.counters.tweets == 1){
                        document.getElementById(`chartDiv${i}`).style.display = "block";
                    }
                    if(elem.attributes.psoe) ccaa.counters.parties[PARTY_INDEX.indexOf("PSOE")].tweets++;
                    if(elem.attributes.pp) ccaa.counters.parties[PARTY_INDEX.indexOf("PP")].tweets++;
                    if(elem.attributes.ciudadanos) ccaa.counters.parties[PARTY_INDEX.indexOf("Ciudadanos")].tweets++;
                    if(elem.attributes.podemos) ccaa.counters.parties[PARTY_INDEX.indexOf("Podemos")].tweets++;
                    if(elem.attributes.vox) ccaa.counters.parties[PARTY_INDEX.indexOf("Vox")].tweets++;

                    // console.log(`${ccaa.attributes.Nombre}: ${JSON.stringify(ccaa.counters.parties)}`);

                    // ccaa.elem.counters.parties
                    // ccaa.validateData();
                    ccaa.graph.validateData()
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
                                ${$MY.linkify(attr.text)}
                            </span><br>
                            <span
                                class="place"
                                data-dojo-attach-point="id-${attr.id_str}"
                                data-dojo-attach-event="click: clicked">
                                    ${attr.location}
                            </span>
                            <small>${$MY.formatDate(d)} | <a href="${attr.tweet_url}" target="_blank">View original</a></small>
                        </div>
                    </li>
                `;
                let parent = document.getElementById('tweet-list');
                var el= document.createElement('li');
                el.classList.add("tweet");
                el.innerHTML = tweet.trim();
                parent.insertBefore( el.firstChild, parent.firstChild);

                $MY.messages.push(elem);
            });
        });

    $MY.formatDate = function(d){
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

    $MY.linkify = function(inputText) {
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

    $MY.displayChart = function (domId, chartTitle, data){
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

        var colorSet = new am4core.ColorSet();

        // PSOE: #F80100
        // PP: #009ED9
        // Ciudadanos: #EA8223
        // Podemos: #682A53
        // Vox #57BB33
        colorSet.list = ["#F80100", "#009ED9", "#EA8223", "#682A53", "#57BB33"].map(function(color) {
            return new am4core.color(color);
        });

        pieSeries.colors = colorSet;

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
            // console.log("something happened ", ev);
            // console.log(`ev.target.dataItem.dataContext = ${JSON.stringify(ev.target.dataItem.dataContext)}`);
        });

        // chart.events.on("datavalidated", function () {
        //     console.log("Data validated")
        // });

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
});
