import { useState } from 'react';
import { cn } from '../../lib/cn';
import { IconBack, IconSearch, IconClose, IconStarFill, IconExport } from './Icons';
import { SpeakerButton } from './WordCard';

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
    <div className="sy-slide absolute inset-0 bg-paper flex flex-col z-10">
      <header className="px-3.5 pt-3 pb-2.5 border-b border-rule flex items-center gap-2.5 flex-none">
        <button
          type="button"
          onClick={onClose}
          title="뒤로"
          className="btn-icon w-7 h-7 rounded-sm text-ink-soft"
        >
          <IconBack size={16} />
        </button>
        <h2 className="m-0 text-[13.5px] font-semibold text-ink flex-1">{title}</h2>
        {count && <span className="text-[11px] text-ink-faint">{count}</span>}
      </header>
      <div className="sy-scroll flex-1 overflow-y-auto">{children}</div>
      {footer && (
        <footer className="border-t border-rule px-3 py-2 flex gap-1.5 bg-paper-soft flex-none">
          {footer}
        </footer>
      )}
    </div>
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
          className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-sm text-[11.5px] border border-rule text-ink-soft bg-paper cursor-pointer font-ui"
        >
          <IconExport size={12} />
          Anki 내보내기
        </button>
      }
    >
      {/* search */}
      <div className="px-3 py-2.5 border-b border-rule-soft">
        <div className="flex items-center gap-1.5 bg-paper-soft border border-rule rounded-lg px-2.5 py-1.5">
          <IconSearch size={13} />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="단어 · 뜻 검색"
            className="flex-1 bg-transparent border-0 outline-none font-ui text-ink text-xs"
          />
          {q && (
            <button type="button" onClick={() => setQ('')} className={cn('btn-icon text-ink-mute')}>
              <IconClose size={12} />
            </button>
          )}
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="py-10 px-6 text-center flex flex-col items-center gap-2">
          <div className="text-[12.5px] text-ink-soft">
            {q ? '검색 결과가 없어요' : '저장된 단어가 없어요'}
          </div>
          {!q && (
            <div className="text-[11px] text-ink-faint">단어 카드의 ★ 아이콘으로 저장하세요.</div>
          )}
        </div>
      ) : (
        <ul className="list-none m-0 p-0">
          {filtered.map((b) => (
            <li
              key={b.word}
              className="px-3.5 py-2.5 border-b border-rule-soft flex gap-2 items-start"
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-baseline gap-2">
                  <span className="font-jp text-[15.5px] font-medium text-ink">{b.word}</span>
                  <span className="font-jp-sans text-[11px] text-ink-mute">{b.reading}</span>
                </div>
                <div className="text-xs text-ink-soft mt-0.5 leading-[1.45]">{b.meaning}</div>
                <div className="text-[10px] text-ink-faint mt-0.5">{formatTime(b.addedAt)}</div>
              </div>
              <SpeakerButton word={b.word} />
              <button
                type="button"
                onClick={() => onRemove(b.word)}
                title="제거"
                className="btn-icon w-7 h-7 rounded-sm text-accent bg-accent-soft"
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
        <div className="py-10 px-6 text-center">
          <div className="text-[12.5px] text-ink-soft">아직 본 단어가 없어요</div>
        </div>
      ) : (
        Object.entries(groups).map(([src, list]) => (
          <div key={src}>
            <div className="px-3.5 pt-2.5 pb-1.5 text-[10px] text-ink-mute tracking-[0.06em] uppercase font-semibold bg-paper-soft">
              {src}
            </div>
            {list.map((h) => (
              <div
                key={`${h.word}-${h.src}-${h.time}`}
                className="w-full px-3.5 py-[9px] flex items-baseline gap-2.5 border-b border-rule-soft"
              >
                <span className="font-jp text-[14.5px] font-medium min-w-[60px] text-ink">
                  {h.word}
                </span>
                <span className="font-jp-sans text-[11px] text-ink-mute flex-1">{h.reading}</span>
                <span className="text-[10.5px] text-ink-faint">{h.time}</span>
              </div>
            ))}
          </div>
        ))
      )}
    </SlideOver>
  );
}
