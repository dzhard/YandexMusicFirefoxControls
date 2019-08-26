function saveOptions(e) {
  e.preventDefault();
  browser.storage.sync.set({
    notifications: document.querySelector("#notifications").value
  });
}

function restoreOptions() {

  function setCurrentChoice(result) {
    document.querySelector("#notifications").value = result.notifications || false;
  }

  function onError(error) {
    console.log(`Error: ${error}`);
  }

  var getting = browser.storage.sync.get("notifications");
  getting.then(setCurrentChoice, onError);
}

document.addEventListener("DOMContentLoaded", restoreOptions);
document.querySelector("form").addEventListener("submit", saveOptions);