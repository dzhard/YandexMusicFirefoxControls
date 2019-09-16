browser.contextMenus.create({
  id: "play-pause-menu",
  title: 'Play/Pause',
  contexts: ["browser_action"],
  onclick: () => {
    pause();
  }
});
browser.contextMenus.create({
  id: "play-next-menu",
  title: 'Next',
  contexts: ["browser_action"],
  onclick: () => {
    next()
  }
});
browser.contextMenus.create({
  id: "play-prev-menu",
  title: 'Previous',
  contexts: ["browser_action"],
  onclick: () => {
    prev()
  }
});
browser.contextMenus.create({
  id: "options-menu",
  title: 'Options',
  contexts: ["browser_action"],
  onclick: () => browser.runtime.openOptionsPage()
});