let menuPlayName;
let menuPrevName;
let menuNextName;

browser.commands.getAll()
.then(res => {
  res.forEach(sc => {
    switch (sc.name) {
      case'play-pause':
        menuPlayName = `${sc.description} (${sc.shortcut})`;
        break;
      case'prev':
        menuPrevName = `${sc.description} (${sc.shortcut})`;
        break;
      case'next':
        menuNextName = `${sc.description} (${sc.shortcut})`;
        break
    }
  });
})
.then(() => buildMenu());

function buildMenu() {
  browser.contextMenus.create({
    icons: {
      "48": "/icons/play-arrow-48.png",
      "96": "/icons/play-arrow-96.png"
    },
    id: "play-pause-menu",
    title: menuPlayName,
    contexts: ["browser_action"],
    onclick: () => {
      pause();
    }
  });
  browser.contextMenus.create({
    icons: {
      "48": "/icons/next-48.png",
      "96": "/icons/next-96.png"
    },
    id: "play-next-menu",
    title: menuNextName,
    contexts: ["browser_action"],
    onclick: () => {
      next()
    }
  });
  browser.contextMenus.create({
    icons: {
      "48": "/icons/prev-48.png",
      "96": "/icons/prev-96.png"
    },
    id: "play-prev-menu",
    title: menuPrevName,
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
}