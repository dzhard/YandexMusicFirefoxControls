//inject script into a page to be able to work with externalAPI
var el = document.createElement('script');
el.setAttribute('type', 'text/javascript');
el.src = browser.extension.getURL('handler.js');
document.body.appendChild(el);
console.log('added handler.js to page')

browser.runtime.onMessage.addListener(onRecievedMessage);
window.addEventListener("message", receiveMessage, false);

function receiveMessage(event) {
  if (event.data) {
    if (event.data.type === "track") {
      browser.runtime.sendMessage(
          "yamusic@dzhard.github.com",
          event.data
      )

      browser.notifications.create(cakeNotification, {
        "type": "basic",
        //  "iconUrl": browser.runtime.getURL("icons/cake-96.png"),
        "title": getTrack().currentTrack.title,
        "message": "Something something cake"
      });
    }
  }
}

function onRecievedMessage(message, sender, sendResponse) {
  let externalAPI = window.wrappedJSObject.externalAPI;
  console.log('requested event:' + message.action)
  switch (message.action) {
    case "next":
      externalAPI.next()
      sendResponse(window.wrappedJSObject.getTrack());
      break
    case "prev":
      externalAPI.prev()
      sendResponse(window.wrappedJSObject.getTrack());
      break
    case "pause":
      externalAPI.togglePause();
      sendResponse(window.wrappedJSObject.getTrack())
      break
    case "play":
      externalAPI.play()
      sendResponse(window.wrappedJSObject.getTrack());
      break
    case "state":
      sendResponse(window.wrappedJSObject.getTrack());
      break
    case "like":
      externalAPI.toggleLike();
      sendResponse(window.wrappedJSObject.isLiked());
      break
    case "dislike":
      externalAPI.toggleDislike()
      sendResponse(window.wrappedJSObject.isDisliked());
      break
    case "shuffle":
      externalAPI.toggleShuffle()
      sendResponse(window.wrappedJSObject.getShuffle());
      break
    case "repeat":
      externalAPI.toggleRepeat()
      sendResponse(window.wrappedJSObject.getRepeat());
      break
    default:
      console.log('unknown action requested')
      break
  }

}