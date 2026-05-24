document.addEventListener('mouseup', () => {
  const text = window.getSelection()?.toString().trim();
  if (!text) return;
  try {
    chrome.runtime
      .sendMessage({
        type: 'TEXT_SELECTED',
        text,
        title: document.title,
        url: window.location.href,
      })
      .catch(() => {});
  } catch {
    // Extension context invalidated — page refresh required
  }
});
