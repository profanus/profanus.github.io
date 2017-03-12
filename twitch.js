"use strict";

var twitchClientId = "qna9pt8piryxl8wfmitnwdm12lwj41";
var streamers = [
  "cl0udbourne",
  "echeloner",
  "embody1337",
  "frank_smiles",
  "lassari86"
];

var getJSON

var getJSON = function getJSON(url, callback) {
  function reqListener() {
    callback(JSON.parse(this.responseText));
  }

  var oReq = new XMLHttpRequest();
  oReq.addEventListener("load", reqListener);

  oReq.open("GET", url);
  oReq.send();
};

var getTwitchStreams = function getTwitchStreams(id, callback) {
  var url = "https://api.twitch.tv/kraken/streams?channel=" + streamers.join(',') + "&client_id=" + twitchClientId;

  getJSON(url, function(json) {
    var streams = json.streams;
    var live = streams.map(function(stream) {
      return {
        name: stream.channel.name,
        url: stream.channel.url,
        preview: stream.preview.medium,
        title: stream.channel.status,
        isLive: true
      };
    });

    let notLive = streamers.filter(function(name) {
      return live.filter(function(stream) { return stream.name === name }).length === 0;
    }).map(function(stream) {
      return {
        name: stream,
        url: "https://www.twitch.tv/" + stream,
        preview: null,
        title: "",
        isLive: false
      };
    });

    callback(live.concat(notLive));
  });
};

var getLinkHtml = function getLinkHtml(url, text) {
  var isImgUrl = text.indexOf("<img") !== -1;
  var className = isImgUrl ? " class='img'" : "";
  return "<a href='" + url + "'" + className + ">" + text + "</a>";
};

var getStreamerHtml = function(stream) {
  return (
    "<div class='streamer-overview " + (stream.isLive ? "live" : "not-live") + "'>" +
      "<h4>" + getLinkHtml(stream.url, stream.name) + (stream.isLive ? " (LIVE)" : "") + "</h4>" +
      getLinkHtml(stream.url, "<img src='" + (stream.isLive ? stream.preview : "img/offline.png") + "' alt='Stream preview'>") +
    "</div>"
  );
}

/* ACTUALLY DO STUFF */

// add streamer section with live data
getTwitchStreams(streamers[0], function(streams) {
  var html = streams.map(getStreamerHtml).join("\r\n");

  var title = "<h3><a name='watch-us-live'>Watch us Live</a></h3>\r\n";
  
  let element = document.getElementById("twitch-stream-section");
  element.innerHTML = title + "<section class='streamers-container'>\r\n" + html + "\r\n</section>";
});