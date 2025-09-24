chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'languageChanged') {
    return true;
  }
});
