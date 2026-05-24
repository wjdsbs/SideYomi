import { useEffect, useState } from 'react';

export function Settings() {
  const [savedKey, setSavedKey] = useState('');
  const [inputKey, setInputKey] = useState('');
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    chrome.storage.local.get('groqApiKey', ({ groqApiKey }) => {
      if (groqApiKey) setSavedKey(groqApiKey as string);
    });
  }, []);

  const handleSave = () => {
    const key = inputKey.trim();
    if (!key) return;
    chrome.storage.local.set({ groqApiKey: key }, () => {
      setSavedKey(key);
      setInputKey('');
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    });
  };

  const handleClear = () => {
    chrome.storage.local.remove('groqApiKey', () => {
      setSavedKey('');
      setInputKey('');
    });
  };

  const maskedKey = savedKey ? `${savedKey.slice(0, 6)}••••••••${savedKey.slice(-4)}` : null;

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-sm font-semibold mb-1">Groq API 키</h2>
        <p className="text-xs text-gray-400 mb-3">
          단어 뜻(한국어)을 보려면 console.groq.com에서 발급한 키가 필요해요.
        </p>

        {maskedKey && (
          <div className="flex items-center justify-between bg-gray-50 border rounded px-3 py-2 mb-2">
            <span className="text-xs font-mono text-gray-600">{maskedKey}</span>
            <button
              type="button"
              onClick={handleClear}
              className="text-xs text-red-400 hover:text-red-600 transition-colors"
            >
              삭제
            </button>
          </div>
        )}

        <div className="flex gap-2">
          <input
            type="password"
            value={inputKey}
            onChange={(e) => setInputKey(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSave()}
            placeholder={savedKey ? '새 키로 교체...' : 'AIza...'}
            className="flex-1 text-xs border rounded px-2 py-1.5 outline-none focus:border-blue-400 font-mono"
          />
          <button
            type="button"
            onClick={handleSave}
            disabled={!inputKey.trim()}
            className="text-xs px-3 py-1.5 bg-blue-500 text-white rounded disabled:opacity-40 hover:bg-blue-600 transition-colors"
          >
            {saved ? '저장됨 ✓' : '저장'}
          </button>
        </div>
      </div>
    </div>
  );
}
