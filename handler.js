function onTrackChanged() {
  window.postMessage({type: "track", msg:  getTrack()});
}

externalAPI.on(externalAPI.EVENT_TRACK, onTrackChanged);

function getTrack() {
  return {
    isPlaying: externalAPI.isPlaying(),
    currentTrack: externalAPI.getCurrentTrack(),
    controlState: externalAPI.getControls(),
    progress: externalAPI.getProgress(),
    volume: externalAPI.getVolume(),
    repeat: externalAPI.getRepeat(),
    shuffle: externalAPI.getShuffle(),
  };
}

function isLiked() {
  return externalAPI.getCurrentTrack().liked
}

function isDisliked() {
  return externalAPI.getCurrentTrack().disliked
}

function getShuffle() {
  return externalAPI.getShuffle()
}

function getRepeat() {
  return externalAPI.getRepeat()
}