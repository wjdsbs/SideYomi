import { useState } from 'react';
import { cn } from '../../lib/cn';
import { groupBySrc } from '../../lib/groupBySrc';
import { formatTime } from '../../lib/formatTime';
import type { Bookmark, Example, HistoryEntry } from '../../types';
import type { Wordbook } from '../../models/Wordbook';
import { IconBack, IconSearch, IconClose, IconStar, IconStarFill, IconExport } from './Icons';
import { SpeakerButton } from './WordCard';

// 일/한 예문 표시 — WordCard 본문 패턴과 동일
function ExampleList({ examples }: { examples: Example[] }) {
  return (
    <div className="flex flex-col gap-1.5 mt-1.5">
      {examples.map((ex) => (
        <div key={ex.jp} className="border-l-2 border-rule pl-2.5">
          <div className="font-jp text-[12.5px] text-ink leading-[1.6]">{ex.jp}</div>
          <div className="text-[11px] text-ink-mute mt-0.5">{ex.kr}</div>
        </div>
      ))}
    </div>
  );
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
  items: Bookmark[];
  onRemove: (word: string) => void;
}) {
  const [q, setQ] = useState('');
  const [reviewMode, setReviewMode] = useState(false);
  const [revealed, setRevealed] = useState<Set<string>>(new Set());
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  if (!open) return null;

  const filtered = items.filter(
    (b) => !q || b.word.includes(q) || b.reading.includes(q) || b.meaning.includes(q),
  );

  const toggleIn = (word: string, setter: typeof setRevealed) =>
    setter((prev) => {
      const next = new Set(prev);
      if (next.has(word)) next.delete(word);
      else next.add(word);
      return next;
    });

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
      {/* search + 복습 모드 */}
      <div className="px-3 py-2.5 border-b border-rule-soft flex items-center gap-2">
        <div className="flex-1 flex items-center gap-1.5 bg-paper-soft border border-rule rounded-lg px-2.5 py-1.5">
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
        <button
          type="button"
          onClick={() => {
            setReviewMode((v) => !v);
            setRevealed(new Set());
          }}
          title="뜻을 가리고 떠올려 보세요"
          className={cn(
            'flex-none px-2.5 py-1.5 rounded-lg text-[11px] font-ui font-medium border cursor-pointer transition-colors',
            reviewMode
              ? 'bg-accent text-white border-accent'
              : 'bg-paper text-ink-soft border-rule',
          )}
        >
          복습
        </button>
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
          {filtered.map((b) => {
            const hidden = reviewMode && !revealed.has(b.word);
            const examples = b.examples ?? [];
            const isExpanded = expanded.has(b.word);
            return (
              <li
                key={b.word}
                className="px-3.5 py-2.5 border-b border-rule-soft flex gap-2 items-start"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-baseline gap-2">
                    <span className="font-jp text-[15.5px] font-medium text-ink">{b.word}</span>
                    <span className="font-jp-sans text-[11px] text-ink-mute">{b.reading}</span>
                  </div>

                  {hidden ? (
                    <button
                      type="button"
                      onClick={() => toggleIn(b.word, setRevealed)}
                      className="mt-1 text-[11px] text-ink-faint bg-paper-sunk rounded px-2 py-1 cursor-pointer border-0 font-ui"
                    >
                      탭하여 뜻 보기
                    </button>
                  ) : (
                    <>
                      <div className="text-xs text-ink-soft mt-0.5 leading-[1.45]">{b.meaning}</div>
                      {examples.length > 0 && (
                        <>
                          <button
                            type="button"
                            onClick={() => toggleIn(b.word, setExpanded)}
                            className="mt-1 text-[10.5px] text-ink-mute bg-transparent border-0 cursor-pointer font-ui p-0"
                          >
                            예문 {isExpanded ? '접기' : `${examples.length}개 보기`}
                          </button>
                          {isExpanded && <ExampleList examples={examples} />}
                        </>
                      )}
                      <div className="text-[10px] text-ink-faint mt-0.5">
                        {formatTime(b.addedAt)}
                      </div>
                    </>
                  )}
                </div>
                <SpeakerButton word={b.word} say={b.reading} />
                <button
                  type="button"
                  onClick={() => onRemove(b.word)}
                  title="제거"
                  className="btn-icon w-7 h-7 rounded-sm text-accent bg-accent-soft"
                >
                  <IconStarFill size={14} />
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </SlideOver>
  );
}

export function HistoryOver({
  open,
  onClose,
  items,
  wordbook,
  onToggleSave,
}: {
  open: boolean;
  onClose: () => void;
  items: HistoryEntry[];
  wordbook: Wordbook;
  onToggleSave: (entry: HistoryEntry) => void;
}) {
  if (!open) return null;

  const groups = groupBySrc(items);

  return (
    <SlideOver title="최근 본 단어" count={`${items.length}개`} onClose={onClose}>
      {items.length === 0 ? (
        <div className="py-10 px-6 text-center">
          <div className="text-[12.5px] text-ink-soft">아직 본 단어가 없어요</div>
          <div className="text-[11px] text-ink-faint mt-1.5">단어를 누르면 여기에 모여요.</div>
        </div>
      ) : (
        Object.entries(groups).map(([src, list]) => (
          <div key={src}>
            <div className="px-3.5 pt-2.5 pb-1.5 text-[10px] text-ink-mute tracking-[0.06em] uppercase font-semibold bg-paper-soft">
              {src}
            </div>
            {list.map((h) => {
              const saved = wordbook.has(h.word);
              return (
                <div
                  key={h.word}
                  className="w-full px-3.5 py-2.5 flex gap-2 items-start border-b border-rule-soft"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-baseline gap-2">
                      <span className="font-jp text-[14.5px] font-medium text-ink">{h.word}</span>
                      <span className="font-jp-sans text-[11px] text-ink-mute">{h.reading}</span>
                    </div>
                    <div className="text-xs text-ink-soft mt-0.5 leading-[1.45]">{h.meaning}</div>
                    <div className="text-[10px] text-ink-faint mt-0.5">{formatTime(h.addedAt)}</div>
                  </div>
                  <SpeakerButton word={h.word} say={h.reading} />
                  <button
                    type="button"
                    onClick={() => onToggleSave(h)}
                    title={saved ? '단어장에서 제거' : '단어장에 저장'}
                    className={cn(
                      'btn-icon w-7 h-7 rounded-sm',
                      saved ? 'text-accent bg-accent-soft' : 'text-ink-mute',
                    )}
                  >
                    {saved ? <IconStarFill size={14} /> : <IconStar size={14} />}
                  </button>
                </div>
              );
            })}
          </div>
        ))
      )}
    </SlideOver>
  );
}
