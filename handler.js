function onTrackChanged() {
  window.postMessage({type: "track", msg: getTrack()});
}

function onControlsChanged() {
  window.postMessage({type: "controls", msg:  externalAPI.getControls()});
}

function onProgressChanged() {
  window.postMessage({type: "progress", msg:  externalAPI.getProgress()});
}

externalAPI.on(externalAPI.EVENT_TRACK, onTrackChanged);
externalAPI.on(externalAPI.EVENT_CONTROLS, onControlsChanged);
externalAPI.on(externalAPI.EVENT_PROGRESS, onProgressChanged);

function getTrack() {
  return {
    isPlaying: externalAPI.isPlaying(),
    currentTrack: externalAPI.getCurrentTrack(),
    controlState: externalAPI.getControls(),
    progress: externalAPI.getProgress(),
    volume: externalAPI.getVolume(),
    repeat: externalAPI.getRepeat(),
    shuffle: externalAPI.getShuffle()
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