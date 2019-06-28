document.addEventListener("DOMContentLoaded", handleDomLoaded);
var activePlayer;

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
      console.log("asd", response);
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
            if (response.progress !== undefined
                && response.progress.position
                > 0) {// checking if it's a paused

              console.log('activePlayer, ', activePlayer);
              if (activePlayer !== undefined) {
                if (activePlayer.isPlaying) {
                  createSmPlayer(response, tab);
                } else {
                  createSmPlayer(activePlayer.response,
                      activePlayer.tab);//recreate last tab as a small player
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
  console.log(e);
  if (e.message
      === "Could not establish connection. Receiving end does not exist.") {
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
  console.log("no ym tabs found");
}

function onError(e) {
  console.error("fail", e);
}

function handleMessage(message, sender) {
  if (sender.id === "yamusic@dzhard.github.com") {
    if (message.type === "track") {
      fillPlayerData(message.msg)
    }
  }
}

browser.runtime.onMessage.addListener(handleMessage);

function createBigPlayer(response, tab) {
  activePlayer = {
    response: response,
    tab: tab,
    isPlaying: response.isPlaying
  };
  console.log('create regular player', activePlayer);
  document.getElementById('player').style.display = null;

  fillPlayerData(response)

  let playbtn = document.getElementById('play-pause-btn');
  togglePlayStatusIcon(response.isPlaying, playbtn);
  playbtn.addEventListener("click", () => {
    browser.tabs.sendMessage(tab.id, {action: "pause"})
    .then(rs => {
      togglePlayStatusIcon(rs.isPlaying, playbtn)
    }).catch(onError);
  })

  let bwdbtn = document.getElementById('bwd-btn');
  let fwdbtn = document.getElementById('fwd-btn');
  bwdbtn.addEventListener("click", () => {
    browser.tabs.sendMessage(tab.id, {action: "prev"})
    .then(rs => {
      console.log('bwd');
      fillPlayerData(rs)
    }).catch(onError);
  });
  fwdbtn.addEventListener("click", () => {
    browser.tabs.sendMessage(tab.id, {action: "next"})
    .then(rs => {
      console.log('fwd', rs);
      fillPlayerData(rs)
    }).catch(onError);
  });

  let likebtn = document.getElementById('song-like');
  likebtn.addEventListener("click", () => {
    browser.tabs.sendMessage(tab.id, {action: "like"})
    .then(rs => {
      toggleLikeStatusIcon(rs, likebtn)
    }).catch(onError);
  });
  toggleLikeStatusIcon(response.currentTrack.liked, likebtn);

  let shufflebtn = document.getElementById('song-shuffle');
  shufflebtn.addEventListener("click", () => {
    browser.tabs.sendMessage(tab.id, {action: "shuffle"})
    .then(rs => {
      toggleShuffleStatusIcon(rs, shufflebtn)
    }).catch(onError);
  });
  toggleShuffleStatusIcon(response.shuffle, shufflebtn);

  let repeatbtn = document.getElementById('song-repeat');
  repeatbtn.addEventListener("click", () => {
    browser.tabs.sendMessage(tab.id, {action: "repeat"})
    .then(rs => {
      toggleRepeatStatusIcon(rs, repeatbtn)
    }).catch(onError);
  });
  toggleRepeatStatusIcon(response.repeat, repeatbtn);

  let dislikebtn = document.getElementById('song-dislike');
  dislikebtn.addEventListener("click", () => {
    browser.tabs.sendMessage(tab.id, {action: "dislike"})
    .then(rs => {
      toggleDislikeStatusIcon(rs, dislikebtn)
    }).catch(onError);
  })
  //response.progress
  //response.volume
}

function fillPlayerData(response) {
  document.getElementById('albumcover').setAttribute('src',
      'http://' + response.currentTrack.cover.replace('%%', '200x200'));
  document.getElementById('albumcover-smoke').setAttribute('src',
      'http://' + response.currentTrack.cover.replace('%%', '200x200'));
  let songtitle = document.getElementById('songtitle');
  let albumtitle = document.getElementById('albumtitle');
  let bandtitle = document.getElementById('bandtitle');
  albumtitle.textContent = response.currentTrack.album.title;
  songtitle.textContent = response.currentTrack.title;
  bandtitle.childNodes[0].textContent = response.currentTrack.artists[0].title
      + ' - ';
}

function createSmPlayer(response, tab, undefPlayer) {
  console.log('create sm player', response);
  let player = document.createElement("div");
  player.className = "player-sm";
  let songinfo = document.createElement("div");

  songinfo.className = "song-info";
  let title = document.createElement("h4");
  if (undefPlayer)//navigate to tab to load it
  {
    title.addEventListener("click", () => {
      browser.tabs.update(
          tab.id,
          {active: true}
      );
      close()
    })
  }

  title.className = "song-title";
  title.id = "songtitle" + tab.id;
  title.textContent = response.currentTrack.title;
  let bandwrapper = document.createElement("div");
  bandwrapper.className = "song-band-wrapper";
  let songband = document.createElement("p");
  songband.className = "song-band";
  songband.id = "bandtitle" + tab.id;

  let band = document.createTextNode(
      response.currentTrack.artists[0].title + " - ");

  let album = document.createElement("span");
  album.id = "album" + tab.id;
  album.className = "album";

  album.textContent = response.currentTrack.album.title;

  songband.appendChild(band);
  songband.appendChild(album);
  bandwrapper.appendChild(songband);
  songinfo.appendChild(title);
  songinfo.appendChild(bandwrapper);

  let plButtons = document.createElement("div");
  plButtons.className = "player-buttons-sm";
  let playBtn = document.createElement("div");
  playBtn.className = "playerbtn playToggle";
  let playI = document.createElement("i");
  playI.className = "material-icons";
  playI.textContent = "play_arrow";

  playBtn.appendChild(playI);
  plButtons.appendChild(playBtn);
  player.appendChild(songinfo);
  player.appendChild(plButtons);

  playI.addEventListener("click", () => {
    togglePause(tab, playI)
  });
  document.body.appendChild(player);

}

function togglePause(tab, button) {
  browser.tabs.sendMessage(tab.id, {action: "pause"})
  .then(response => {
    togglePlayStatusIcon(response.isPlaying, button)
  }).catch(onError);
}

function togglePlayStatusIcon(isPlaying, button) {
  if (isPlaying) {
    button.textContent = "pause"
  } else {
    button.textContent = "play_arrow"
  }
}

function toggleLikeStatusIcon(liked, button) {
  if (liked) {
    button.className = "material-icons btn-toggled"
  } else {
    button.className = "material-icons"
  }
}

function toggleShuffleStatusIcon(shuffle, button) {
  if (shuffle) {
    button.className = "material-icons btn-toggled"
  } else {
    button.className = "material-icons"
  }
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
  if (dislike) {
    button.className = "material-icons btn-toggled"
  } else {
    button.className = "material-icons"
  }
}