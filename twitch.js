(function setUpTwitch() {
  "use strict";

  var twitchClientId = "qna9pt8piryxl8wfmitnwdm12lwj41";
  var streamers = [
    "cl0udbourne",
    "echeloner",
    "embody1337",
    "frank_smiles",
    "lassari86", "itshafu"
  ];

  var callToActionElement = document.getElementById("call-to-action");

  // only support browsers with native promises (so no IE?)
  // progressive enhancement, so if you have them, we show the
  // stream section, otherwise we just don't.
  if (!window.Promise) {
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
          preview: stream.preview.template.replace("{width}", "480").replace("{height}", "270"),
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

      return {
        live: data.live,
        notLive: notLive
      };
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
        "<h4>" + getLinkHtml(stream.url, stream.name) + "</h4>" +
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
  };

  var getStreamContainerHtml = function(streams) {
    var html = streams.map(getStreamerHtml).join('\r\n');

    return "<section class='streamers-container'>" +
             html +
           "</section>";
  };

  /* ACTUALLY DO STUFF */

  // add streamer section with live data
  getTwitchStreams(streamers[0]).then(function(streams) {
    var liveHtml = getStreamContainerHtml(streams.live);
    var notLiveHtml = getStreamContainerHtml(streams.notLive);

    var liveStreamCount = streams.live.length;

    var title = "<h3>Watch us Live: " + liveStreamCount + " streaming now</h3>\r\n";

    var containerElement = document.createElement("div");
    containerElement.id = "watch-us-live";
    containerElement.className = "container small loaded";

    containerElement.innerHTML = title + liveHtml + notLiveHtml;

    var previousSibling = document.getElementById("quick-intro");
    previousSibling.parentNode.insertBefore(containerElement, previousSibling.nextSibling);

    if (liveStreamCount) {
      var smallActionButton = document.createElement('section');

      var streamsWord = liveStreamCount + (liveStreamCount === 1 ? " of us is" : " of us are");
      
      smallActionButton.className = "call-to-action streaming-live";
      smallActionButton.innerHTML =
        "<h3>We're live!</h3>" +
        "<p class='message'>" + streamsWord + " streaming now:</p>" +
        "<a class='action-button' href='#" + containerElement.id + "'>View streams</a>";

      var sibling = callToActionElement.children[1];
      callToActionElement.insertBefore(smallActionButton, sibling);

      document.body.className += "has-live-streamers";
    }

    containerElement.className += " loaded";
  });

})();