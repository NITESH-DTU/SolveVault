function openDashboard() {
  chrome.tabs.create({ url: chrome.runtime.getURL("dashboard.html") });
}

chrome.runtime.onMessage.addListener((msg, sender) => {
  if (msg.type === "openDashboard") {
    openDashboard();
    return;
  }

  if (msg.type === "goDashboard" && sender.tab?.id !== undefined) {
    chrome.tabs.update(sender.tab.id, {
      url: chrome.runtime.getURL("dashboard.html")
    });
  }
});

chrome.action.onClicked.addListener(openDashboard);
