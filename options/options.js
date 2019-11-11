const notificationsChk = document.querySelector("#notifications");
document.getElementById("notificationsTitle").textContent = browser.i18n.getMessage("notificationsTitle");
document.getElementById("showNotificationsLabel").firstChild.textContent = browser.i18n.getMessage("showNotificationsLabel");
function updateUI(restoredSettings) {
  notificationsChk.checked = restoredSettings.showNotifications;
}

function onError(e) {
  console.error(e);
}

const gettingStoredSettings = browser.storage.local.get({"showNotifications": false});
gettingStoredSettings.then(updateUI, onError);

notificationsChk.onchange = () => {
  browser.storage.local.set({"showNotifications": notificationsChk.checked});
};