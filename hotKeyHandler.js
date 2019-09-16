function requestTabsByDomain(domain) {
  return browser.tabs.query({url: domain})
  .then(
      (ymTabs) => {
        return ymTabs == null || ymTabs.length === 0 ? [] : ymTabs;
      }, (error) => [])
}

function findActiveAndCall(responses) {
  let activePlayer = null;
  for (const rs of responses) {
    let response = rs.response;
    let tab = rs.tab;
    if (response == null) {
      continue;
    }
    if (response.currentTrack !== undefined) {
      if (response.isPlaying) {
        activePlayer = {
          response: response,
          tab: tab,
          isPlaying: response.isPlaying
        };
        break;
      } else {
        if ((response.progress !== undefined && response.progress.position > 0)
            || activePlayer === null) {
          activePlayer = {
            response: response,
            tab: tab,
            isPlaying: response.isPlaying
          };
        }
      }
    }
  }
  return new Promise((resolve, reject) => {
    resolve(activePlayer);
  })
}

function requestAllTabs() {
  return Promise.all([
    requestTabsByDomain("https://music.yandex.ru/*"),
    requestTabsByDomain("https://music.yandex.by/*")
  ])
  .then(responses => responses.flat(1))
  .then(resp => {
    return loadAllTabs(resp)
  });
}

function pause(activeTab) {
  sendAction(activeTab, "pause")
}

function next(activeTab) {
  sendAction(activeTab, "next")
}

function prev(activeTab) {
  sendAction(activeTab, "prev")
}

function sendAction(activeTab, action) {
  if (activeTab !== undefined && activeTab !=null) {
    browser.tabs.sendMessage(activeTab.tab.id, {action: action})
  } else {
    requestAllTabs()
    .then(r => {
      browser.tabs.sendMessage(r.tab.id, {action: action})
    })
  }
}

function loadAllTabs(tabs) {
  if (tabs.length === 0) {
    return Promise.reject('no tabs found')
  }
  if (tabs.length === 1) {
    return browser.tabs.sendMessage(tabs[0].id, {action: "state"})
    .then(rs => {
      return {
        response: rs,
        tab: tabs[0]
      }
    })
    .catch(error => {
      return {
        response: null,
        tab: tabs[0],
        error: error
      }
    });
  }

  let promises = [];
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

  return Promise.all(promises)
  .then(rs => findActiveAndCall(rs));

}

function handleHotKey(cmd) {
  switch (cmd) {
    case 'play-pause':
      pause();
      break;
    case 'next':
      next();
      break;
    case 'prev':
      prev();
      break;
  }
}

browser.commands.onCommand.addListener(handleHotKey);