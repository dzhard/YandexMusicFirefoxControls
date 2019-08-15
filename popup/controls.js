document.addEventListener("DOMContentLoaded", handleDomLoaded);
let activePlayer;
let progressTimer;

//TODO: volume
//TODO: notifications
browser.runtime.onMessage.addListener(handleMessage);

function handleMessage(message, sender) {
  console.log("track change", message)
  if (sender.id === "yamusic@dzhard.github.com") {
    if (message.type === "track") {
      fillPlayerData(message.msg)
    }
  }
}

function handleDomLoaded(e) {
  browser.tabs.query({url: "https://music.yandex.ru/*"})
  .then(
      (ymTabs) => {
        if (ymTabs == null || ymTabs.length === 0) {
          failedToLoadYandexTabs();
        } else {
          loadedYandexTabs(ymTabs);
        }
      }, (error) => {
        failedToLoadYandexTabs(error)
      }
  );
}

function loadedYandexTabs(tabs) {
  if (tabs.length === 1) {
    let tab = tabs[0];
    console.log('requester state for tab:' + tab.id);
    browser.tabs.sendMessage(tab.id, {action: "state"})
    .then(response => {
      createBigPlayer(response, tab)
    }).catch(e => handleUnloadedTab(e, tab));
    return;
  }

  if (tabs.length > 0) {
    tabs.forEach(function (tab) {
      console.log('requester state for tab:' + tab.id);
      browser.tabs.sendMessage(tab.id, {action: "state"})
      .then(response => {

        if (response.currentTrack !== undefined) {
          if (response.isPlaying) {
            console.log('response.isPlaying');
            if (activePlayer !== undefined) {//recreate last tab as a small player
              createSmPlayer(activePlayer.response,
                  activePlayer.tab)
            }
            createBigPlayer(response, tab)
          } else {
            if (response.progress !== undefined && response.progress.position > 0) {// checking if it's a paused
              console.log('activePlayer, ', activePlayer);
              if (activePlayer !== undefined) {
                if (activePlayer.isPlaying) {
                  createSmPlayer(response, tab);
                } else {
                  createSmPlayer(activePlayer.response, activePlayer.tab);//recreate last tab as a small player
                  createBigPlayer(response, tab)
                }
              } else {
                createBigPlayer(response, tab);
              }

            } else {
              createSmPlayer(response, tab);
            }
          }
        }
      }).catch(e => handleUnloadedTab(e, tab));
    });
  }

}

function handleUnloadedTab(e, tab) {
  if (e.message === "Could not establish connection. Receiving end does not exist.") {
    let response = {};
    response.currentTrack = {};
    response.currentTrack.artists = [];
    response.currentTrack.artists[0] = {};
    response.currentTrack.album = {};
    response.currentTrack.artists[0].title = "    ";
    response.currentTrack.title = "    Unknown     ";
    response.currentTrack.album.title = "      ";
    createSmPlayer(response, tab, true);
  }
}

function failedToLoadYandexTabs() {
  console.log("no yandex music tabs found");
}

function onError(e) {
  console.error("fail", e);
}

function createBigPlayer(response, tab) {
  activePlayer = {
    response: response,
    tab: tab,
    isPlaying: response.isPlaying
  };
  console.log('create regular player', activePlayer);
  document.getElementById('player').style.display = null;

  fillPlayerData(response)

  let playBtn = document.getElementById('play-pause-btn');
  togglePlayStatusIcon(response.isPlaying, playBtn);

  playBtn.onclick = () => {
    browser.tabs.sendMessage(tab.id, {action: "pause"})
    .then(rs => {
      if (rs.isPlaying) {
        let songProgress = document.getElementById('songprogress');
        progressTimer = setInterval(handleProgress, 1000, songProgress);
      } else {
        clearInterval(progressTimer);
      }
      togglePlayStatusIcon(rs.isPlaying, playBtn)
    }).catch(onError);
  };

  let bwdBtn = document.getElementById('bwd-btn');
  let fwdBtn = document.getElementById('fwd-btn');
  bwdBtn.onclick = () => {
    browser.tabs.sendMessage(tab.id, {action: "prev"})
    .then(rs => {
      fillPlayerData(rs)
    }).catch(onError);
  };
  fwdBtn.onclick = () => {
    browser.tabs.sendMessage(tab.id, {action: "next"})
    .then(rs => {
      fillPlayerData(rs)
    }).catch(onError);
  };

  let likeBtn = document.getElementById('song-like');
  likeBtn.onclick = () => {
    browser.tabs.sendMessage(tab.id, {action: "like"})
    .then(rs => {
      toggleLikeStatusIcon(rs, likeBtn)
    }).catch(onError);
  };
  toggleLikeStatusIcon(response.currentTrack.liked, likeBtn);

  let shuffleBtn = document.getElementById('song-shuffle');
  shuffleBtn.onclick = () => {
    browser.tabs.sendMessage(tab.id, {action: "shuffle"})
    .then(rs => {
      toggleShuffleStatusIcon(rs, shuffleBtn)
    }).catch(onError);
  };
  toggleShuffleStatusIcon(response.shuffle, shuffleBtn);

  let repeatBtn = document.getElementById('song-repeat');
  repeatBtn.onclick = () => {
    browser.tabs.sendMessage(tab.id, {action: "repeat"})
    .then(rs => {
      toggleRepeatStatusIcon(rs, repeatBtn)
    }).catch(onError);
  };
  toggleRepeatStatusIcon(response.repeat, repeatBtn);

  let dislikeBtn = document.getElementById('song-dislike');
  dislikeBtn.onclick = () => {
    browser.tabs.sendMessage(tab.id, {action: "dislike"})
    .then(rs => {
      toggleDislikeStatusIcon(rs, dislikeBtn)
    }).catch(onError);
  };
  let volumeSelector = document.getElementById('volume_selector');
  volumeSelector.value = response.volume;
  volumeSelector.onchange = () => {
    browser.tabs.sendMessage(tab.id, {action: "volume", volume: volumeSelector.value})
    .then(rs => {
      toggleDislikeStatusIcon(rs, dislikeBtn)
    }).catch(onError);
  }
  //response.volume
}

//TODO: progress after song changed still 100
//TODO: double speed after unpause
function handleProgress(progressbar) {
  let newWidth = parseInt(progressbar.style.width.replace("%", "")) + 1;
  if (newWidth > 100) {
    newWidth = 100;
    clearInterval(progressTimer);
  }
  progressbar.style.width = newWidth + "%";
}

function fillPlayerData(response) {
  document.getElementById('albumcover').setAttribute('src',
      'http://' + response.currentTrack.cover.replace('%%', '200x200'));
  document.getElementById('albumcover-smoke').setAttribute('src',
      'http://' + response.currentTrack.cover.replace('%%', '200x200'));
  let songTitle = document.getElementById('songtitle');
  let albumTitle = document.getElementById('albumtitle');
  let bandTitle = document.getElementById('bandtitle');
  albumTitle.textContent = response.currentTrack.album.title;
  songTitle.textContent = response.currentTrack.title;
  bandTitle.childNodes[0].textContent = response.currentTrack.artists[0].title + ' - ';

  let songProgress = document.getElementById('songprogress');
  if (response.progress.position !== 0 && response.progress.duration !== 0) {
    songProgress.style.width = Math.round(response.progress.position / response.progress.duration * 100) + "%";
  } else {
    songProgress.style.width = "0%";
  }
  clearInterval(progressTimer);
  progressTimer = setInterval(handleProgress, 1000, songProgress);
}

function createSmPlayer(response, tab, undefPlayer) {
  console.log('create sm player', response);
  let player = document.createElement("div");
  player.className = "player-sm";
  let songInfo = document.createElement("div");

  songInfo.className = "song-info";
  let title = document.createElement("h4");
  if (undefPlayer)//navigate to tab to load it
  {
    title.onclick = () => {
      browser.tabs.update(tab.id, {active: true});
      close()
    }
  }

  title.className = "song-title";
  title.id = "songtitle" + tab.id;
  title.textContent = response.currentTrack.title;
  let bandWrapper = document.createElement("div");
  bandWrapper.className = "song-band-wrapper";
  let songBand = document.createElement("p");
  songBand.className = "song-band";
  songBand.id = "bandtitle" + tab.id;

  let band = document.createTextNode(
      response.currentTrack.artists[0].title + " - ");

  let album = document.createElement("span");
  album.id = "album" + tab.id;
  album.className = "album";

  album.textContent = response.currentTrack.album.title;

  songBand.appendChild(band);
  songBand.appendChild(album);
  bandWrapper.appendChild(songBand);
  songInfo.appendChild(title);
  songInfo.appendChild(bandWrapper);

  let plButtons = document.createElement("div");
  plButtons.className = "player-buttons-sm";
  let playBtn = document.createElement("div");
  playBtn.className = "playerbtn playToggle";
  let playI = document.createElement("i");
  playI.className = "material-icons";
  playI.textContent = "play_arrow";

  playBtn.appendChild(playI);
  plButtons.appendChild(playBtn);
  player.appendChild(songInfo);
  player.appendChild(plButtons);

  playI.onclick = () => {
    togglePause(tab, playI)
  };
  document.body.appendChild(player);

}

function togglePause(tab, button) {
  browser.tabs.sendMessage(tab.id, {action: "pause"})
  .then(response => {
    togglePlayStatusIcon(response.isPlaying, button)
  }).catch(onError);
}

function togglePlayStatusIcon(isPlaying, button) {
  button.textContent = isPlaying ? "pause" : "play_arrow"
}

function toggleLikeStatusIcon(liked, button) {
  button.className = liked ? "material-icons btn-toggled" : "material-icons"
}

function toggleShuffleStatusIcon(shuffle, button) {
  button.className = shuffle ? "material-icons btn-toggled" : "material-icons"
}

function toggleRepeatStatusIcon(repeat, button) {
  if (repeat) {
    button.className = "material-icons btn-toggled";
    if (repeat === 1) {
      button.textContent = "repeat_one"
    } else {
      button.textContent = "repeat"
    }
  } else {
    button.className = "material-icons";
    button.textContent = "repeat"
  }
}

function toggleDislikeStatusIcon(dislike, button) {
  button.className = dislike ? "material-icons btn-toggled" : "material-icons"
}