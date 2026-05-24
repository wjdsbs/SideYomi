import { useEffect, useState } from 'react';
import { IconBack } from './Icons';

type Props = { onClose: () => void };

export function Settings({ onClose }: Props) {
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
    <div
      className="sy-slide"
      style={{
        position: 'absolute',
        inset: 0,
        background: 'var(--paper)',
        display: 'flex',
        flexDirection: 'column',
        zIndex: 10,
      }}
    >
      <header
        style={{
          padding: '12px 14px 10px',
          borderBottom: '1px solid var(--rule)',
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          flex: '0 0 auto',
        }}
      >
        <button
          type="button"
          onClick={onClose}
          title="뒤로"
          style={{
            width: 28,
            height: 28,
            borderRadius: 'var(--r-sm)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'var(--ink-soft)',
            background: 'none',
            border: 'none',
            cursor: 'pointer',
          }}
        >
          <IconBack size={16} />
        </button>
        <h2 style={{ margin: 0, fontSize: 13.5, fontWeight: 600, color: 'var(--ink)' }}>설정</h2>
      </header>

      <div style={{ flex: 1, overflowY: 'auto', padding: '20px 16px' }}>
        <div style={{ marginBottom: 24 }}>
          <div style={{ fontSize: 12.5, fontWeight: 600, color: 'var(--ink)', marginBottom: 4 }}>
            Groq API 키
          </div>
          <p style={{ fontSize: 11.5, color: 'var(--ink-mute)', margin: '0 0 12px' }}>
            단어 뜻(한국어)을 보려면 console.groq.com에서 발급한 키가 필요해요.
          </p>

          {maskedKey && (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                background: 'var(--paper-soft)',
                border: '1px solid var(--rule)',
                borderRadius: 'var(--r-sm)',
                padding: '8px 12px',
                marginBottom: 8,
              }}
            >
              <span
                style={{
                  fontFamily: 'var(--font-mono)',
                  fontSize: 12,
                  color: 'var(--ink-soft)',
                }}
              >
                {maskedKey}
              </span>
              <button
                type="button"
                onClick={handleClear}
                style={{
                  fontSize: 11.5,
                  color: 'var(--err)',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  padding: '0 4px',
                  fontFamily: 'var(--font-ui)',
                }}
              >
                삭제
              </button>
            </div>
          )}

          <div style={{ display: 'flex', gap: 8 }}>
            <input
              type="password"
              value={inputKey}
              onChange={(e) => setInputKey(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSave()}
              placeholder={savedKey ? '새 키로 교체...' : 'gsk_...'}
              style={{
                flex: 1,
                fontFamily: 'var(--font-mono)',
                fontSize: 12,
                border: '1px solid var(--rule)',
                borderRadius: 'var(--r-sm)',
                padding: '7px 10px',
                outline: 'none',
                background: 'var(--paper)',
                color: 'var(--ink)',
              }}
              onFocus={(e) => {
                (e.currentTarget as HTMLElement).style.borderColor = 'var(--accent-line)';
              }}
              onBlur={(e) => {
                (e.currentTarget as HTMLElement).style.borderColor = 'var(--rule)';
              }}
            />
            <button
              type="button"
              onClick={handleSave}
              disabled={!inputKey.trim()}
              style={{
                fontSize: 12,
                padding: '7px 14px',
                background: 'var(--accent)',
                color: 'white',
                border: 'none',
                borderRadius: 'var(--r-sm)',
                cursor: inputKey.trim() ? 'pointer' : 'default',
                opacity: inputKey.trim() ? 1 : 0.4,
                fontFamily: 'var(--font-ui)',
                fontWeight: 500,
                transition: 'opacity .15s',
              }}
            >
              {saved ? '저장됨 ✓' : '저장'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
