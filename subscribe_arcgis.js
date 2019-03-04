<html lang="en">
<head>
<title>ASDITrackInformation (StreamServer)</title>
<link href="/arcgis/rest/static/main.css" rel="stylesheet" type="text/css"/>
</head>
<body>
<table width="100%" class="userTable">
<tr>
<td class="titlecell">
ArcGIS REST Services Directory
</td>
<td align="right">
<a href="https://ec2-75-101-155-202.compute-1.amazonaws.com:6443/arcgis/rest/login">Login</a>
| <a href="https://ec2-75-101-155-202.compute-1.amazonaws.com:6443/arcgis/tokens/">Get Token</a>
</td>
</tr>
</table>
<table width="100%" class="navTable">
<tr valign="top">
<td class="breadcrumbs">
<a href="/arcgis/rest/services">Home</a>
&gt; <a href="/arcgis/rest/services">services</a>
&gt; <a href="/arcgis/rest/services/ASDITrackInformation/StreamServer">ASDITrackInformation (StreamServer)</a>
&gt; <a href="/arcgis/rest/services/ASDITrackInformation/StreamServer/subscribe"><i>subscribe</i></a>
</td>
<td align="right">
<a href="http://ec2-75-101-155-202.compute-1.amazonaws.com:6080/arcgis/sdk/rest/02ss/02ss00000057000000.htm" target="_blank">Help</a> | <a href="http://ec2-75-101-155-202.compute-1.amazonaws.com:6080/arcgis/rest/services/ASDITrackInformation/StreamServer/subscribe?f=help" target="_blank">API Reference</a>
</td>
</tr>
</table>
<table>
<tr>
<td class="apiref">
<a href="?f=pjson" target="_blank">JSON</a>
</td>
</tr>
</table>
<h2>ASDITrackInformation (StreamServer)</h2>
<div class="rbody">
<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta http-equiv="X-UA-Compatible" content="IE=edge" />
<meta name="viewport" content="initial-scale=1, maximum-scale=1,user-scalable=no"/>
<style type="text/css">
div {
border: 0px solid black;
}
div#messageBox {
clear: both;
width: 60em;
height: 40ex;
overflow: auto;
background-color: #f0f0f0;
padding: 4px;
border: 1px solid black;
}
div#input {
clear: both;
width: 60em;
padding: 4px;
background-color: #e0e0e0;
border: 1px solid black;
border-top: 0px
}
#status {
                border-bottom-color: #ffffff;
                border-bottom-width: 4px;
                border-bottom-style: solid;
                padding-bottom: 3px;
                white-space: normal;
                float: left;
                width: 50%;
                margin-right: 20px;
            }
#reconnectStatus {
                float: left;
                width: 30%;
                padding-top: 10px;
            }
</style>
<script src="http://js.arcgis.com/3.18/init.js"></script>
<script type="text/javascript">
require(["esri/layers/StreamLayer",
"dojo/on",
"dojo/domReady!"
], function(StreamLayer, on){
                var streamLayer,
                    clientDisconnected;
                function init(){
                    if (!window.WebSocket){
                        alert("WebSockets are not supported by this browser. Stream Services use Websockets for communication and they are not supported on older versions of some browsers.  For Internet Explorer, version 10+ is needed.");
                        document.getElementById("subscribe").disabled = true;
                        document.getElementById("unsubscribe").disabled = true;
                        document.getElementById("status").innerHTML = "WebSockets are not supported by this browser";
                    }
                    else{
                        on(dojo.byId("subscribe"), "click", connectStreamLayer);
                        on(dojo.byId("unsubscribe"), "click", disconnectStreamLayer);
                    }
                }
                function addStreamLayer(url){
                    //console.log("url: ", url);
                    streamLayer = new StreamLayer(url);
                    streamLayer.on("connect", processConnect);
                    streamLayer.on("disconnect", processDisconnect);
                    streamLayer.on("connection-error", function(evt){
                        var fullurl = location.protocol + "//" + location.hostname;
                        if (location.port) {
                            fullurl += ":" + location.port;
                        }
                        fullurl += url;
                        var msg = "A web socket connection to the stream service running at " + fullurl +
                            " could not be established. Please inform the GIS Administrator.",
                            color = "#8b0000";
                        dojo.byId("status").innerHTML = msg;
                        dojo.byId("status").style.borderBottomColor = color;
                    });
                    streamLayer.on("attempt-reconnect", processAttemptReconnect);
                    streamLayer.on("message", function(evt){
                        if(!evt.geometry && !evt.attributes){
                            return false;
                        }
                        var msg = {};
                        if (evt.geometry){
                            msg.geometry = evt.geometry;
                        }
                        if (evt.attributes){
                            msg.attributes = evt.attributes;
                        }
                        var messageBox = dojo.byId("messageBox");
                        var spanText = document.createElement("span");
                        spanText.className = "text";
                        spanText.innerHTML = JSON.stringify(msg);
                        var lineBreak = document.createElement("br");
                        messageBox.appendChild(spanText);
                        messageBox.appendChild(lineBreak);
                        messageBox.scrollTop = messageBox.scrollHeight
                            - messageBox.clientHeight;
                    });
                    streamLayer.on("load", function(evt){
                        setTimeout(function(){
                            streamLayer.connect();
                        }, 100);
                    });
                }
                function connectStreamLayer(){
                    dojo.byId("status").innerHTML = "";
                    //dojo.byId("status").style.borderBottomColor = "#ffffff";
                    dojo.byId("reconnectStatus").innerHTML = "";
                    clientDisconnected = false;
                    disconnectStreamLayer();
                    addStreamLayer("/arcgis/rest/services/ASDITrackInformation/StreamServer");
                }
                function disconnectStreamLayer(){
                    if (streamLayer){
                        clientDisconnected = true;
                        streamLayer.disconnect();
                        streamLayer = null;
                    }
                }
                function processConnect(){
                    dojo.byId("status").innerHTML = "You have subscribed";
                    dojo.byId("status").style.borderBottomColor = "#008000";
                    dojo.byId("reconnectStatus").innerHTML = "";
                }
                function processDisconnect(evt){
                    var color = "#ffffff",
                        msg = "You have unsubscribed";
                    if (evt.willReconnect){
                        msg = "Connection lost. Attempting to reconnect.";
                        color = "#ff8c00";
                    }
                    else{
                        dojo.byId("reconnectStatus").innerHTML = "";
                        if(!clientDisconnected){
                            if (evt.error){
                                color = "#8b0000";
                                msg = evt.error.message;
                            }
                            disconnectStreamLayer();
                        }
                    }
                    if (msg){
                        dojo.byId("status").innerHTML = msg;
                    }
                    dojo.byId("status").style.borderBottomColor = color;
                }
                function processAttemptReconnect(evt){
                    if(evt.count){
                        if (evt.count >= 10){
                            processDisconnect({
                                error: new Error("Cannot reconnect to service")
                            });
                        }
                        else{
                            dojo.byId("reconnectStatus").innerHTML = "  Attempts: " + evt.count;
                        }
                    }
                }
                init();
            });
</script>
</head>
<body>
<div id="messageBox"></div>
<div id="input">
<div>
<input id="subscribe" type="button" value="Subscribe"/>
<input id="unsubscribe" type="button" value="Unsubscribe"/>
</div>
</div>
<br>
<div style="position: relative">
<div id="status"></div>
</div>
<div id="reconnectStatus"></div>
</body>
</html>
</div>
<br/><br/>
</body>
</html>
