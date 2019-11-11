document.addEventListener("DOMContentLoaded", handleDomLoaded);
let activePlayer;
let progressTimer;
let showNotifications;

browser.runtime.onMessage.addListener(handleMessage);

function handleMessage(message, sender) {
  if (sender.id === "yamusic@dzhard.github.com") {
    if (message.type === "track") {
      fillPlayerData(message.msg)
    }
  }
}

function requestTabsByDomain(domain) {
  return browser.tabs.query({url: domain})
  .then(
      (ymTabs) => {
        return ymTabs == null || ymTabs.length === 0 ? [] : ymTabs;
      }, () => [])
  .catch(() => {
    return [];
  })
}

function requestAllTabs() {
  return Promise.all([
    requestTabsByDomain("https://music.yandex.ru/*"),
    requestTabsByDomain("https://music.yandex.by/*")
  ])
  .then(responses => responses.flat(1));
}

function handleDomLoaded(e) {
  document.getElementById('player').style.display = 'none';
  requestAllTabs()
  .then(resp => loadedYandexTabs(resp))
}

function loadedYandexTabs(tabs) {
  if (tabs.length === 1) {
    let tab = tabs[0];
    browser.tabs.sendMessage(tab.id, {action: "state"})
    .then(response => {
      createBigPlayer(response, tab)
    }).catch(e => handleUnloadedTab(e, tab));
    return;
  }

  let promises = [];
  if (tabs.length > 0) {
    for (const tab of tabs) {
      let promise = browser.tabs.sendMessage(tab.id, {action: "state"})
      .then(rs => {
        return {
          response: rs,
          tab: tab
        }
      }, error => {
        return {
          response: null,
          tab: tab,
          error: error
        }
      });

      promises.push(promise);
    }

    Promise.all(promises)
    .then(rs => fillPlayers(rs));
  } else {
    let openYaMusicPanel = document.getElementById("welcome");
    let openYaMusicMessage = document.getElementById("openYaMessage");
    openYaMusicMessage.innerText = browser.i18n.getMessage("openYaMusicMessage");
    openYaMusicPanel.style.display = "flex";
    document.getElementById("openYaMessage").onclick = () => {
      browser.tabs.create({"url": "https://music.yandex.ru/"})
      window.close();
    }
  }

  function fillPlayers(responses) {
    for (const rs of responses) {
      let response = rs.response;
      let tab = rs.tab;
      if (response == null) {
        handleUnloadedTab(rs.error, tab);
        continue;
      }

      if (response.currentTrack !== undefined) {
        if (response.isPlaying) {
          if (activePlayer !== undefined) {//recreate last tab as a small player
            createSmPlayer(activePlayer.response, activePlayer.tab)
          }
          createBigPlayer(response, tab)
        } else {
          if (response.progress !== undefined && response.progress.position > 0) {// checking if it's a paused
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
    }
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
    createSmPlayer(response, tab);
  }
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
  document.getElementById('player').style.display = null;

  fillPlayerData(response, tab.id);

  let playI = document.getElementById('play-pause-btn');
  playI.parentElement.id = 'playI' + tab.id;
  togglePlayStatusIcon(response.isPlaying, playI);

  playI.onclick = () => {
    browser.tabs.sendMessage(tab.id, {action: "pause"})
    .then(rs => {
      if (rs.isPlaying) {
        let songProgress = document.getElementById('songprogress');
        progressTimer = setInterval(handleProgress, 1000, songProgress);
      } else {
        stopProgress();
      }
      updatePlayButtonsState(playI, rs.isPlaying)
    }).catch(onError);
  };

  let bwdBtn = document.getElementById('bwd-btn');
  let fwdBtn = document.getElementById('fwd-btn');
  bwdBtn.title = browser.i18n.getMessage("prev");
  fwdBtn.title = browser.i18n.getMessage("next");

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
  likeBtn.title = browser.i18n.getMessage("like");

  likeBtn.onclick = () => {
    browser.tabs.sendMessage(tab.id, {action: "like"})
    .then(rs => {
      toggleLikeStatusIcon(rs, likeBtn)
    }).catch(onError);
  };
  toggleLikeStatusIcon(response.currentTrack.liked, likeBtn);

  let shuffleBtn = document.getElementById('song-shuffle');
  shuffleBtn.title = browser.i18n.getMessage("shuffle");
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
  dislikeBtn.title = browser.i18n.getMessage("dislike");
  dislikeBtn.onclick = () => {
    browser.tabs.sendMessage(tab.id, {action: "dislike"})
    .then(rs => {
      toggleDislikeStatusIcon(rs, dislikeBtn)
    }).catch(onError);
  };

  let volumeSelector = document.getElementById('volume_selector');
  volumeSelector.value = response.volume;
  volumeSelector.oninput = () => {
    browser.tabs.sendMessage(tab.id, {action: "volume", volume: volumeSelector.value})
    .then(rs => {
      toggleDislikeStatusIcon(rs, dislikeBtn)
    }).catch(onError);
  };

  let volumeBtn = document.getElementById('volume');
  volumeBtn.title = browser.i18n.getMessage("volume");
  volumeBtn.onwheel = (event) => {
    onWheelVolume(volumeSelector, tab, event);
  };
  volumeSelector.onwheel = (event) => {
    onWheelVolume(volumeSelector, tab, event);
  };

  let notifBtn = document.getElementById('song-notifications');
  notifBtn.title = browser.i18n.getMessage("notificationsTitle");
  browser.storage.local.get({"showNotifications": false}).then(
      storage => {
        showNotifications = storage.showNotifications;

        toggleNotificationsIcon(showNotifications, notifBtn);
        notifBtn.onclick = () => {
          showNotifications = !showNotifications;
          browser.storage.local.set({"showNotifications": showNotifications})
          .then(() => {
            toggleNotificationsIcon(showNotifications, notifBtn);
          }).catch(onError);
        };
      }
  )

}

function onWheelVolume(volumeSelector, tab, event) {
  let vol = parseFloat(volumeSelector.value);
  event.deltaY < 0 ? vol = vol + 0.05 : vol = vol - 0.05;
  if (vol > 1) {
    vol = 1;
  }
  if (vol < 0) {
    vol = 0;
  }
  volumeSelector.value = vol;
  browser.tabs.sendMessage(tab.id, {action: "volume", volume: vol})
}

function updatePlayButtonsState(pressedI, isPlaying) {
  let elementsByClassName = document.getElementsByClassName("playToggle");
  for (let i = 0; i < elementsByClassName.length; i++) {
    let item = elementsByClassName.item(i);
    togglePlayStatusIcon(isPlaying && pressedI.parentElement.id === item.id, item.firstElementChild)
  }
}

function handleProgress(progressbar) {
  let newWidth = parseInt(progressbar.style.width.replace("%", "")) + 1;
  if (newWidth > 100) {
    newWidth = 100;
    stopProgress();
  }
  progressbar.style.width = newWidth + "%";
}

function fillPlayerData(response, tabId) {
  document.getElementById('albumcover').setAttribute('src',
      'http://' + response.currentTrack.cover.replace('%%', '200x200'));
  document.getElementById('albumcover-smoke').setAttribute('src',
      'http://' + response.currentTrack.cover.replace('%%', '200x200'));
  let songTitle = document.getElementById('songtitle');
  let albumTitle = document.getElementById('albumtitle');
  let bandTitle = document.getElementById('bandtitle');
  albumTitle.textContent = response.currentTrack.album.title;
  songTitle.textContent = response.currentTrack.title;
  bandTitle.childNodes[0].textContent = response.currentTrack.artists.length > 0
      ? response.currentTrack.artists[0].title + ' - ' : "";

  if (tabId !== undefined) {
    //popup opened, add events to navigate to the tab
    let navigateToTab = () => {
      browser.tabs.update(tabId, {active: true});
      close()
    };
    songTitle.onclick = navigateToTab;
    albumTitle.onclick = navigateToTab;
    bandTitle.onclick = navigateToTab;
  }
  let songProgress = document.getElementById('songprogress');

  if (response.progress.position !== 0 && response.progress.duration !== 0) {
    let currentPos = response.progress.position / response.progress.duration * 100;
    songProgress.style.width = Math.round(currentPos) + "%";
  } else {
    songProgress.style.width = "0%";
  }
  stopProgress();
  let timeout = response.currentTrack.duration / 100 * 1000;
  if (response.isPlaying) {
    progressTimer = setInterval(handleProgress, timeout, songProgress);
  }
}

function createSmPlayer(response, tab) {
  let player = document.createElement("div");
  player.className = "player-sm";
  let songInfo = document.createElement("div");

  songInfo.className = "song-info";
  let title = document.createElement("h4");

  let currentTrack = response.currentTrack;
  title.className = "song-title";
  title.id = "songtitle" + tab.id;
  title.textContent = currentTrack.title;
  let bandWrapper = document.createElement("div");
  bandWrapper.className = "song-band-wrapper";
  let songBand = document.createElement("p");
  songBand.className = "song-band";
  songBand.id = "bandtitle" + tab.id;

  let bandName = currentTrack.artists.length > 0 ? currentTrack.artists[0].title + " - " : "";
  let band = document.createTextNode(bandName);
  let album = document.createElement("span");
  album.id = "album" + tab.id;
  album.className = "album";

  album.textContent = currentTrack.album.title;

  songBand.appendChild(band);
  songBand.appendChild(album);
  bandWrapper.appendChild(songBand);
  songInfo.appendChild(title);
  songInfo.appendChild(bandWrapper);

  let plButtons = document.createElement("div");
  plButtons.className = "player-buttons-sm";
  let playBtn = document.createElement("div");
  playBtn.id = 'playBtn' + tab.id;
  playBtn.className = "playerbtn playToggle";
  let playI = document.createElement("i");
  playI.className = "material-icons";
  playI.textContent = "play_arrow";
  playBtn.appendChild(playI);
  plButtons.appendChild(playBtn);
  player.appendChild(songInfo);
  player.appendChild(plButtons);

  let navigateToTab = () => {
    browser.tabs.update(tab.id, {active: true});
    close()
  };
  title.onclick = navigateToTab;
  songBand.onclick = navigateToTab;

  playI.onclick = () => {
    browser.tabs.sendMessage(tab.id, {action: "pause"})
    .then(rs => {
      togglePlayStatusIcon(rs.isPlaying, playI);
      updatePlayButtonsState(playI, rs.isPlaying);
      stopProgress();
    }).catch(onError);
  };
  document.body.appendChild(player);

}

function togglePlayStatusIcon(isPlaying, button) {
  if (isPlaying) {
    button.textContent = "pause";
    button.title = browser.i18n.getMessage("pause");
  } else {
    button.textContent = "play_arrow";
    button.title = browser.i18n.getMessage("play");
  }
}

function toggleLikeStatusIcon(liked, button) {
  button.className = liked ? "material-icons btn-toggled" : "material-icons"
}

function toggleNotificationsIcon(show, button) {
  button.className = show ? "material-icons btn-toggled" : "material-icons"
}

function toggleShuffleStatusIcon(shuffle, button) {
  button.className = shuffle ? "material-icons btn-toggled" : "material-icons"
}

function toggleDislikeStatusIcon(dislike, button) {
  button.className = dislike ? "material-icons btn-toggled" : "material-icons"
}

function toggleRepeatStatusIcon(repeat, button) {
  if (repeat) {
    button.className = "material-icons btn-toggled";
    if (repeat === 1) {
      button.title = browser.i18n.getMessage("repeat_one");
      button.textContent = "repeat_one"
    } else {
      button.title = browser.i18n.getMessage("repeat");
      button.textContent = "repeat"
    }
  } else {
    button.title = browser.i18n.getMessage("repeat");
    button.className = "material-icons";
    button.textContent = "repeat"
  }
}

function stopProgress() {
  if (progressTimer !== undefined && progressTimer != null) {
    clearInterval(progressTimer);
  }
}