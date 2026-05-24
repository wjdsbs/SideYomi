import { ChromeStorage } from '../api/ChromeStorage';
import { GroqClient } from '../api/GroqClient';
import type { LookupRequest, LookupResponse } from '../api/messages';

chrome.runtime.onInstalled.addListener(() => {
  chrome.sidePanel.setPanelBehavior({ openPanelOnActionClick: true });
});

async function handleLookup(req: LookupRequest): Promise<LookupResponse> {
  const apiKey = await ChromeStorage.getApiKey();
  if (!apiKey) return { ok: false, error: 'NO_KEY' };

  const cache = await ChromeStorage.getWordCache();
  const cached = cache[req.cacheKey];
  if (cached) return { ok: true, entry: cached };

  try {
    const entry = await new GroqClient(apiKey).lookup(req.surface, req.reading, req.context);
    ChromeStorage.setWordCache({ ...cache, [req.cacheKey]: entry });
    return { ok: true, entry };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : 'API 오류' };
  }
}

chrome.runtime.onMessage.addListener((msg: unknown, _sender, sendResponse) => {
  if ((msg as LookupRequest).type !== 'LOOKUP') return false;
  handleLookup(msg as LookupRequest).then(sendResponse);
  return true; // async 응답을 위해 채널 유지
});
