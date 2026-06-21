import { ChromeStorage } from '../api/ChromeStorage';
import { GroqClient } from '../api/GroqClient';
import type {
  LookupRequest,
  LookupResponse,
  TranslateRequest,
  TranslateResponse,
} from '../api/messages';

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

async function handleTranslate(req: TranslateRequest): Promise<TranslateResponse> {
  const apiKey = await ChromeStorage.getApiKey();
  if (!apiKey) return { ok: false, error: 'NO_KEY' };

  const cache = await ChromeStorage.getTranslationCache();
  const cached = cache[req.cacheKey];
  if (cached) return { ok: true, result: cached };

  try {
    const result = await new GroqClient(apiKey).translate(req.text, req.context);
    ChromeStorage.setTranslationCache({ ...cache, [req.cacheKey]: result });
    return { ok: true, result };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : 'API 오류' };
  }
}

chrome.runtime.onMessage.addListener((msg: unknown, _sender, sendResponse) => {
  const { type } = msg as { type?: string };
  if (type === 'LOOKUP') {
    handleLookup(msg as LookupRequest).then(sendResponse);
    return true; // async 응답을 위해 채널 유지
  }
  if (type === 'TRANSLATE') {
    handleTranslate(msg as TranslateRequest).then(sendResponse);
    return true;
  }
  return false;
});
