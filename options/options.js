const notificationsChk = document.querySelector("#notifications");

function updateUI(restoredSettings) {
  console.log(restoredSettings)
  console.log(restoredSettings.showNotifications)
  notificationsChk.checked = restoredSettings.showNotifications;
}

function onError(e) {
  console.error(e);
}

const gettingStoredSettings = browser.storage.local.get({"showNotifications": false});
gettingStoredSettings.then(updateUI, onError);

notificationsChk.onchange = () => {
  browser.storage.local.set({"showNotifications": notificationsChk.checked});
}