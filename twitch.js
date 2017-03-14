(function setUpTwitch() {
  "use strict";

  var twitchClientId = "qna9pt8piryxl8wfmitnwdm12lwj41";
  var streamers = [
    "cl0udbourne",
    "echeloner",
    "embody1337",
    "frank_smiles",
    "lassari86"
  ];

  var containerElement = document.getElementById("twitch-stream-section");

  // only support browsers with native promises (so no IE?)
  // progressive enhancement, so if you have them, we show the
  // stream section, otherwise we just don't.
  if (!window.Promise) {
    if(containerElement) {
      containerElement.parentNode.removeChild(containerElement);
    }

    return;
  }

  var getJSON = function getJSON(url) {
    return new Promise(function (resolve) {
      function reqListener() {
        resolve(JSON.parse(this.responseText));
      }      

      var oReq = new XMLHttpRequest();
      oReq.addEventListener("load", reqListener);

      oReq.open("GET", url);
      oReq.send();
    });
  };

  var getTwitchStreams = function getTwitchStreams(id) {
    var url = "https://api.twitch.tv/kraken/streams?channel=" + streamers.join(',') + "&client_id=" + twitchClientId;

    return getJSON(url).then(function(json) {
      var streams = json.streams;
      var live = streams.map(function(stream) {
        return {
          id: stream.channel.name,
          name: stream.channel.display_name,
          url: stream.channel.url,
          preview: stream.preview.medium,
          title: stream.channel.status,
          isLive: true
        };
      });

      var notLive = streamers.filter(function(name) {
        return live.filter(function(stream) { return stream.id === name }).length === 0;
      }).map(function(streamName) {
        var url = "https://api.twitch.tv/kraken/channels/" + streamName + "?client_id=" + twitchClientId;
        return getJSON(url);
      });

      return Promise.all(notLive).then(function(data) {
        return {
          live: live,
          notLive: data
        };
      });
    }).then(function (data) {
      var notLive = data.notLive.map(function(channel) {
        var offlineImg = channel.video_banner || "img/offline.png";
        offlineImg = offlineImg.replace("1920x1080", "320x180");

        return {
          id: channel.name,
          name: channel.display_name,
          url: channel.url,
          preview: offlineImg,
          title: channel.status,
          isLive: false
        };
      });

      return data.live.concat(notLive);
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
        "<p>" + 
          getLinkHtml(stream.url, "<img src='" + stream.preview + "' alt='Stream preview'>") + 
        "</p>" +
        (stream.isLive
        ? "<p class='stream-title'>" + 
            stream.title + 
          "</p>"
        : "") +
      "</div>"
    );
  }

  /* ACTUALLY DO STUFF */

  // add streamer section with live data
  getTwitchStreams(streamers[0]).then(function(streams) {
    var html = streams.map(getStreamerHtml).join("\r\n");

    var title = "<h3><a name='watch-us-live'>Watch us Live</a></h3>\r\n";
    
    containerElement.innerHTML = title + "<section class='streamers-container'>\r\n" + html + "\r\n</section>";
  });

})();