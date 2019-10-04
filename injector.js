//inject script into a page to be able to work with externalAPI
var el = document.createElement('script');
el.setAttribute('type', 'text/javascript');
el.src = browser.extension.getURL('handler.js');
document.body.appendChild(el);

if (!browser.runtime.onMessage.hasListener(onRecievedMessage)) {
  browser.runtime.onMessage.addListener(onRecievedMessage);
}

window.addEventListener("message", receiveMessage, false);

/**
 * handle messages from injected script
 * @param event
 */
function receiveMessage(event) {
  if (event.data) {
    if (event.data.type === "track") {
      browser.runtime.sendMessage("yamusic@dzhard.github.com", event.data);
      browser.storage.local.get({"showNotifications": false}).then(
          storage => {
            console.log(storage)
            if (storage.showNotifications) {
              showNotification();
            }
          }
      )
    }
  }
}

function showNotification() {
  if (Notification.permission === "granted") {
    trackNotification();
  } else if (Notification.permission !== 'denied') {
    Notification.requestPermission(function (permission) {
      if (permission === "granted") {
        trackNotification();
      }
    });
  }
}

function trackNotification() {
  let track = window.wrappedJSObject.getTrack().currentTrack;
  let artists = [];
  for (let i = 0; i < track.artists.length; i++) {
    artists.push(track.artists[i].title);
  }

  console.log(artists.join(", ") + " - " + track.title);
  let notification = new Notification(artists.join(", ") + " - " + track.title);
  setTimeout(notification.close.bind(notification), 2500);
}

/**
 * Handle messages from popup.
 * @param message
 * @param sender
 * @param sendResponse
 */
function onRecievedMessage(message, sender, sendResponse) {
  let externalAPI = window.wrappedJSObject.externalAPI;
  console.log('requested event:' + message.action);
  switch (message.action) {
    case "next":
      externalAPI.next();
      sendResponse(window.wrappedJSObject.getTrack());
      break;
    case "prev":
      externalAPI.prev();
      sendResponse(window.wrappedJSObject.getTrack());
      break;
    case "pause":
      externalAPI.togglePause();
      sendResponse(window.wrappedJSObject.getTrack());
      break;
    case "play":
      externalAPI.play();
      sendResponse(window.wrappedJSObject.getTrack());
      break;
    case "state":
      sendResponse(window.wrappedJSObject.getTrack());
      break;
    case "like":
      externalAPI.toggleLike();
      sendResponse(window.wrappedJSObject.isLiked());
      break;
    case "dislike":
      externalAPI.toggleDislike();
      sendResponse(window.wrappedJSObject.isDisliked());
      break;
    case "shuffle":
      externalAPI.toggleShuffle();
      sendResponse(window.wrappedJSObject.getShuffle());
      break;
    case "repeat":
      externalAPI.toggleRepeat();
      sendResponse(window.wrappedJSObject.getRepeat());
      break;
    case "volume":
      externalAPI.setVolume(message.volume);
      break;
    default:
      console.log('unknown action requested');
      break
  }

}