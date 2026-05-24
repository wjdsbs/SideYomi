import { useState } from 'react';
import { IconBack, IconSearch, IconClose, IconSpeaker, IconStarFill, IconExport } from './Icons';

export type BookmarkItem = {
  word: string;
  reading: string;
  meaning: string;
  addedAt: number;
};

export type HistoryItem = {
  word: string;
  reading: string;
  time: string;
  src: string;
};

function formatTime(ts: number): string {
  const diff = Date.now() - ts;
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return '방금';
  if (mins < 60) return `${mins}분 전`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}시간 전`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}일 전`;
  return `${Math.floor(days / 7)}주 전`;
}

function SlideOver({
  title,
  count,
  onClose,
  footer,
  children,
}: {
  title: string;
  count?: string;
  onClose: () => void;
  footer?: React.ReactNode;
  children: React.ReactNode;
}) {
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
        <h2 style={{ margin: 0, fontSize: 13.5, fontWeight: 600, color: 'var(--ink)', flex: 1 }}>
          {title}
        </h2>
        {count && <span style={{ fontSize: 11, color: 'var(--ink-faint)' }}>{count}</span>}
      </header>
      <div className="sy-scroll" style={{ flex: 1, overflowY: 'auto' }}>
        {children}
      </div>
      {footer && (
        <footer
          style={{
            borderTop: '1px solid var(--rule)',
            padding: '8px 12px',
            display: 'flex',
            gap: 6,
            background: 'var(--paper-soft)',
            flex: '0 0 auto',
          }}
        >
          {footer}
        </footer>
      )}
    </div>
  );
}

function SpeakerBtn({ word }: { word: string }) {
  const speak = () => {
    const utt = new SpeechSynthesisUtterance(word);
    utt.lang = 'ja-JP';
    speechSynthesis.speak(utt);
  };
  return (
    <button
      type="button"
      onClick={speak}
      title="발음 듣기"
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
      <IconSpeaker size={14} />
    </button>
  );
}

export function BookmarksOver({
  open,
  onClose,
  items,
  onRemove,
}: {
  open: boolean;
  onClose: () => void;
  items: BookmarkItem[];
  onRemove: (word: string) => void;
}) {
  const [q, setQ] = useState('');
  if (!open) return null;

  const filtered = items.filter(
    (b) => !q || b.word.includes(q) || b.reading.includes(q) || b.meaning.includes(q),
  );

  const handleExport = () => {
    const lines = items.map((b) => `${b.word}\t${b.reading}\t${b.meaning}`).join('\n');
    const blob = new Blob([lines], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'sideyomi_wordbook.txt';
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <SlideOver
      title="단어장"
      count={`${items.length}개`}
      onClose={onClose}
      footer={
        <button
          type="button"
          onClick={handleExport}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6,
            padding: '6px 10px',
            borderRadius: 'var(--r-sm)',
            fontSize: 11.5,
            border: '1px solid var(--rule)',
            color: 'var(--ink-soft)',
            background: 'var(--paper)',
            cursor: 'pointer',
            fontFamily: 'var(--font-ui)',
          }}
        >
          <IconExport size={12} />
          Anki 내보내기
        </button>
      }
    >
      {/* search */}
      <div style={{ padding: '10px 12px', borderBottom: '1px solid var(--rule-soft)' }}>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            background: 'var(--paper-soft)',
            border: '1px solid var(--rule)',
            borderRadius: 8,
            padding: '6px 10px',
          }}
        >
          <IconSearch size={13} />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="단어 · 뜻 검색"
            style={{
              flex: 1,
              background: 'transparent',
              border: 'none',
              outline: 'none',
              fontFamily: 'var(--font-ui)',
              color: 'var(--ink)',
              fontSize: 12,
            }}
          />
          {q && (
            <button
              type="button"
              onClick={() => setQ('')}
              style={{
                color: 'var(--ink-mute)',
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                display: 'flex',
              }}
            >
              <IconClose size={12} />
            </button>
          )}
        </div>
      </div>

      {filtered.length === 0 ? (
        <div
          style={{
            padding: '40px 24px',
            textAlign: 'center',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 8,
          }}
        >
          <div style={{ fontSize: 12.5, color: 'var(--ink-soft)' }}>
            {q ? '검색 결과가 없어요' : '저장된 단어가 없어요'}
          </div>
          {!q && (
            <div style={{ fontSize: 11, color: 'var(--ink-faint)' }}>
              단어 카드의 ★ 아이콘으로 저장하세요.
            </div>
          )}
        </div>
      ) : (
        <ul style={{ listStyle: 'none', margin: 0, padding: 0 }}>
          {filtered.map((b) => (
            <li
              key={b.word}
              style={{
                padding: '10px 14px',
                borderBottom: '1px solid var(--rule-soft)',
                display: 'flex',
                gap: 8,
                alignItems: 'flex-start',
              }}
            >
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
                  <span
                    style={{
                      fontFamily: 'var(--font-jp)',
                      fontSize: 15.5,
                      fontWeight: 500,
                      color: 'var(--ink)',
                    }}
                  >
                    {b.word}
                  </span>
                  <span
                    style={{
                      fontFamily: 'var(--font-jp-sans)',
                      fontSize: 11,
                      color: 'var(--ink-mute)',
                    }}
                  >
                    {b.reading}
                  </span>
                </div>
                <div
                  style={{ fontSize: 12, color: 'var(--ink-soft)', marginTop: 2, lineHeight: 1.45 }}
                >
                  {b.meaning}
                </div>
                <div style={{ fontSize: 10, color: 'var(--ink-faint)', marginTop: 3 }}>
                  {formatTime(b.addedAt)}
                </div>
              </div>
              <SpeakerBtn word={b.word} />
              <button
                type="button"
                onClick={() => onRemove(b.word)}
                title="제거"
                style={{
                  width: 28,
                  height: 28,
                  borderRadius: 'var(--r-sm)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'var(--accent)',
                  background: 'var(--accent-soft)',
                  border: 'none',
                  cursor: 'pointer',
                }}
              >
                <IconStarFill size={14} />
              </button>
            </li>
          ))}
        </ul>
      )}
    </SlideOver>
  );
}

export function HistoryOver({
  open,
  onClose,
  items,
}: {
  open: boolean;
  onClose: () => void;
  items: HistoryItem[];
}) {
  if (!open) return null;

  const groups = items.reduce<Record<string, HistoryItem[]>>((acc, it) => {
    if (!acc[it.src]) acc[it.src] = [];
    acc[it.src].push(it);
    return acc;
  }, {});

  return (
    <SlideOver title="최근 본 단어" count={`${items.length}개`} onClose={onClose}>
      {items.length === 0 ? (
        <div style={{ padding: '40px 24px', textAlign: 'center' }}>
          <div style={{ fontSize: 12.5, color: 'var(--ink-soft)' }}>아직 본 단어가 없어요</div>
        </div>
      ) : (
        Object.entries(groups).map(([src, list]) => (
          <div key={src}>
            <div
              style={{
                padding: '10px 14px 6px',
                fontSize: 10,
                color: 'var(--ink-mute)',
                letterSpacing: '0.06em',
                textTransform: 'uppercase',
                fontWeight: 600,
                background: 'var(--paper-soft)',
              }}
            >
              {src}
            </div>
            {list.map((h) => (
              <div
                key={`${h.word}-${h.src}-${h.time}`}
                style={{
                  width: '100%',
                  padding: '9px 14px',
                  display: 'flex',
                  alignItems: 'baseline',
                  gap: 10,
                  borderBottom: '1px solid var(--rule-soft)',
                }}
              >
                <span
                  style={{
                    fontFamily: 'var(--font-jp)',
                    fontSize: 14.5,
                    fontWeight: 500,
                    minWidth: 60,
                    color: 'var(--ink)',
                  }}
                >
                  {h.word}
                </span>
                <span
                  style={{
                    fontFamily: 'var(--font-jp-sans)',
                    fontSize: 11,
                    color: 'var(--ink-mute)',
                    flex: 1,
                  }}
                >
                  {h.reading}
                </span>
                <span style={{ fontSize: 10.5, color: 'var(--ink-faint)' }}>{h.time}</span>
              </div>
            ))}
          </div>
        ))
      )}
    </SlideOver>
  );
}
