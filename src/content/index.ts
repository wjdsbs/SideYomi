document.addEventListener('mouseup', () => {
  const text = window.getSelection()?.toString().trim();
  if (text) {
    chrome.runtime.sendMessage({ type: 'TEXT_SELECTED', text }).catch(() => {});
  }
});
