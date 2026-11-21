function openDashboard() {
  chrome.tabs.create({ url: chrome.runtime.getURL("dashboard.html") });
}

chrome.runtime.onMessage.addListener((msg) => {
  if (msg.type === "openDashboard") openDashboard();
});

chrome.action.onClicked.addListener(openDashboard);