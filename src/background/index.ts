chrome.runtime.onInstalled.addListener(() => {
  chrome.sidePanel.setPanelBehavior({ openPanelOnActionClick: true });
});

chrome.runtime.onMessage.addListener((message: { type: string }) => {
  if (message.type === 'TEXT_SELECTED') {
    chrome.runtime.sendMessage(message).catch(() => {});
  }
});
