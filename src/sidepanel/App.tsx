import { useEffect, useRef, useState } from 'react';
import kuromoji from 'kuromoji';
import { tokenize } from '../lib/kuromoji';
import { hasKanji, toHiragana, buildRomaji } from '../lib/japanese';
import { lookupWord } from '../lib/gemini';
import type { WordResult } from '../lib/gemini';
import { WordCard } from './components/WordCard';
import { Settings } from './components/Settings';
import { SessionStrip } from './components/SessionStrip';
import { BookmarksOver, HistoryOver } from './components/SlideOver';
import type { BookmarkItem, HistoryItem } from './components/SlideOver';
import { IconBook, IconClock, IconSettings, IconSparkle, IconStar } from './components/Icons';

type Token = kuromoji.IpadicFeatures;
type Status = 'idle' | 'loading' | 'done' | 'error';
type LookupStatus = 'loading' | 'done' | 'no-key' | 'error';
type Over = 'bookmarks' | 'history' | 'settings' | null;

function useLocalToggle(key: string, defaultValue: boolean) {
  const [value, setValue] = useState(() =>
    localStorage.getItem(key) !== null ? localStorage.getItem(key) === 'true' : defaultValue,
  );
  const toggle = () =>
    setValue((v) => {
      localStorage.setItem(key, String(!v));
      return !v;
    });
  return [value, toggle] as const;
}

function ToggleChip({
  label,
  active,
  onClick,
  icon,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
  icon?: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 4,
        fontSize: 11,
        padding: '3px 9px',
        borderRadius: 999,
        color: active ? 'var(--accent)' : 'var(--ink-mute)',
        background: active ? 'var(--accent-soft)' : 'transparent',
        border: `1px solid ${active ? 'var(--accent-line)' : 'var(--rule)'}`,
        fontWeight: 500,
        cursor: 'pointer',
        transition: 'all .15s',
        fontFamily: 'var(--font-ui)',
      }}
    >
      {icon}
      {label}
    </button>
  );
}

function IconBtn({
  children,
  label,
  onClick,
  badge,
}: {
  children: React.ReactNode;
  label: string;
  onClick?: () => void;
  badge?: number;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={label}
      aria-label={label}
      style={{
        width: 30,
        height: 30,
        borderRadius: 'var(--r-sm)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: 'var(--ink-soft)',
        background: 'transparent',
        border: 'none',
        cursor: 'pointer',
        position: 'relative',
        transition: 'background .12s, color .12s',
      }}
      onMouseEnter={(e) => {
        (e.currentTarget as HTMLElement).style.background = 'var(--paper-sunk)';
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLElement).style.background = 'transparent';
      }}
    >
      {children}
      {badge !== undefined && badge > 0 && (
        <span
          style={{
            position: 'absolute',
            top: 2,
            right: 2,
            background: 'var(--accent)',
            color: 'white',
            fontSize: 8.5,
            padding: '0 4px',
            borderRadius: 999,
            fontWeight: 600,
            minWidth: 12,
            height: 12,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            lineHeight: 1,
          }}
        >
          {badge}
        </span>
      )}
    </button>
  );
}

export default function App() {
  const [tokens, setTokens] = useState<Token[]>([]);
  const [status, setStatus] = useState<Status>('idle');
  const [source, setSource] = useState<{ title: string; url: string } | null>(null);

  const [showFurigana, toggleFurigana] = useLocalToggle('showFurigana', true);
  const [showRomaji, toggleRomaji] = useLocalToggle('showRomaji', false);

  const [selectedIdx, setSelectedIdx] = useState<number | null>(null);
  const [wordResult, setWordResult] = useState<WordResult | null>(null);
  const [lookupStatus, setLookupStatus] = useState<LookupStatus | null>(null);
  const [lookupError, setLookupError] = useState<string | undefined>(undefined);

  const [session, setSession] = useState<string[]>([]);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [bookmarks, setBookmarks] = useState<Set<string>>(new Set());
  const [bookmarkList, setBookmarkList] = useState<BookmarkItem[]>([]);
  const [over, setOver] = useState<Over>(null);

  const wrapperRef = useRef<HTMLDivElement>(null);
  const [split, setSplit] = useState(42);
  const dragging = useRef(false);

  // Load bookmarks from storage on mount
  useEffect(() => {
    chrome.storage.local.get('wordBookmarks', ({ wordBookmarks }) => {
      if (!wordBookmarks) return;
      const list = wordBookmarks as BookmarkItem[];
      setBookmarkList(list);
      setBookmarks(new Set(list.map((b) => b.word)));
    });
  }, []);

  // Listen for text selection from content script
  useEffect(() => {
    const handler = (message: { type: string; text: string; title?: string; url?: string }) => {
      if (message.type !== 'TEXT_SELECTED') return;
      setStatus('loading');
      setSelectedIdx(null);
      setWordResult(null);
      setLookupStatus(null);
      if (message.title || message.url) {
        setSource({ title: message.title ?? '', url: message.url ?? '' });
      }
      tokenize(message.text)
        .then((result) => {
          setTokens(result);
          setStatus('done');
        })
        .catch((err) => {
          // eslint-disable-next-line no-console
          console.error('[SideYomi] tokenize error', err);
          setStatus('error');
        });
    };
    chrome.runtime.onMessage.addListener(handler);
    return () => chrome.runtime.onMessage.removeListener(handler);
  }, []);

  // Update history and session when a lookup completes
  useEffect(() => {
    if (lookupStatus !== 'done' || selectedIdx === null || !wordResult) return;
    const tok = tokens[selectedIdx];
    if (!tok || tok.pos === '記号') return;
    const word = tok.surface_form;
    const reading = tok.reading ? toHiragana(tok.reading) : tok.surface_form;

    setSession((s) => [word, ...s.filter((w) => w !== word)].slice(0, 8));

    const src = source?.url
      ? (() => {
          try {
            return new URL(source.url).hostname;
          } catch {
            return source.url;
          }
        })()
      : 'この画面';

    setHistory((h) =>
      [{ word, reading, time: '방금', src }, ...h.filter((item) => item.word !== word)].slice(
        0,
        50,
      ),
    );
  }, [lookupStatus, selectedIdx]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleTokenClick = (token: Token, idx: number) => {
    if (selectedIdx === idx) {
      setSelectedIdx(null);
      setWordResult(null);
      setLookupStatus(null);
      return;
    }

    setSelectedIdx(idx);
    setWordResult(null);
    setLookupError(undefined);

    const reading = token.reading ? toHiragana(token.reading) : token.surface_form;
    const cacheKey = `${token.surface_form}|${reading}`;
    const prev = tokens[idx - 1]?.surface_form ?? '';
    const next = tokens[idx + 1]?.surface_form ?? '';
    const context = [prev, token.surface_form, next].filter(Boolean).join(' ');

    chrome.storage.local.get(['groqApiKey', 'wordCache'], ({ groqApiKey, wordCache }) => {
      if (!groqApiKey) {
        setLookupStatus('no-key');
        return;
      }

      const cache = (wordCache ?? {}) as Record<string, WordResult>;
      if (cache[cacheKey]) {
        setWordResult(cache[cacheKey]);
        setLookupStatus('done');
        return;
      }

      setLookupStatus('loading');
      lookupWord(token.surface_form, reading, context, groqApiKey)
        .then((result) => {
          setWordResult(result);
          setLookupStatus('done');
          chrome.storage.local.set({ wordCache: { ...cache, [cacheKey]: result } });
        })
        .catch((err: Error) => {
          setLookupError(err.message);
          setLookupStatus('error');
        });
    });
  };

  const handleBookmark = () => {
    if (selectedIdx === null) return;
    const tok = tokens[selectedIdx];
    if (!tok) return;
    const word = tok.surface_form;
    const reading = tok.reading ? toHiragana(tok.reading) : tok.surface_form;
    const meaning = wordResult?.meanings[0] ?? '';

    setBookmarks((prev) => {
      const next = new Set(prev);
      let nextList: BookmarkItem[];
      if (next.has(word)) {
        next.delete(word);
        nextList = bookmarkList.filter((b) => b.word !== word);
      } else {
        next.add(word);
        nextList = [{ word, reading, meaning, addedAt: Date.now() }, ...bookmarkList];
      }
      setBookmarkList(nextList);
      chrome.storage.local.set({ wordBookmarks: nextList });
      return next;
    });
  };

  const handleRemoveBookmark = (word: string) => {
    setBookmarks((prev) => {
      const next = new Set(prev);
      next.delete(word);
      const nextList = bookmarkList.filter((b) => b.word !== word);
      setBookmarkList(nextList);
      chrome.storage.local.set({ wordBookmarks: nextList });
      return next;
    });
  };

  const jumpToWord = (word: string) => {
    const idx = tokens.findIndex((t) => t.surface_form === word);
    if (idx >= 0) {
      setOver(null);
      handleTokenClick(tokens[idx], idx);
    }
  };

  const onHandleDown = (e: React.MouseEvent) => {
    dragging.current = true;
    e.preventDefault();
    const onMove = (ev: MouseEvent) => {
      if (!dragging.current || !wrapperRef.current) return;
      const rect = wrapperRef.current.getBoundingClientRect();
      const pct = Math.max(20, Math.min(75, ((ev.clientY - rect.top) / rect.height) * 100));
      setSplit(pct);
    };
    const onUp = () => {
      dragging.current = false;
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
    };
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
  };

  const wordCount = tokens.filter((t) => t.pos !== '記号').length;

  const hostname = source?.url
    ? (() => {
        try {
          return new URL(source.url).hostname;
        } catch {
          return '';
        }
      })()
    : '';

  return (
    <div
      style={{
        fontFamily: 'var(--font-ui)',
        color: 'var(--ink)',
        background: 'var(--paper)',
        fontSize: 13,
        height: '100vh',
        display: 'flex',
        flexDirection: 'column',
        position: 'relative',
        overflow: 'hidden',
        WebkitFontSmoothing: 'antialiased',
      }}
    >
      {/* Header */}
      <header
        style={{
          padding: '11px 12px 9px',
          borderBottom: '1px solid var(--rule)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 8,
          background: 'var(--paper)',
          flex: '0 0 auto',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
          <span
            style={{
              fontWeight: 600,
              fontSize: 13.5,
              letterSpacing: '-0.01em',
              color: 'var(--ink)',
            }}
          >
            SideYomi
          </span>
          <span style={{ fontFamily: 'var(--font-jp)', fontSize: 11, color: 'var(--ink-faint)' }}>
            側読
          </span>
        </div>
        <div style={{ display: 'flex', gap: 2 }}>
          <IconBtn label="단어장" onClick={() => setOver('bookmarks')} badge={bookmarks.size}>
            <IconBook size={15} />
          </IconBtn>
          <IconBtn label="최근 본 단어" onClick={() => setOver('history')}>
            <IconClock size={15} />
          </IconBtn>
          <IconBtn label="설정" onClick={() => setOver('settings')}>
            <IconSettings size={15} />
          </IconBtn>
        </div>
      </header>

      {/* Source crumb */}
      {source && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            padding: '5px 14px',
            fontSize: 10.5,
            color: 'var(--ink-mute)',
            borderBottom: '1px solid var(--rule-soft)',
            background: 'var(--paper-soft)',
            flex: '0 0 auto',
            overflow: 'hidden',
          }}
        >
          <span
            style={{
              width: 6,
              height: 6,
              borderRadius: '50%',
              background: 'var(--accent)',
              flex: '0 0 auto',
            }}
          />
          <span
            style={{
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
              flex: 1,
            }}
          >
            {source.title}
          </span>
          {hostname && (
            <span style={{ color: 'var(--ink-faint)', flex: '0 0 auto' }}>{hostname}</span>
          )}
        </div>
      )}

      {/* Non-done states: full height */}
      {status !== 'done' && (
        <div
          className="sy-scroll"
          style={{ flex: 1, overflowY: 'auto', padding: '16px 14px 20px' }}
        >
          {status === 'idle' && (
            <div
              style={{
                padding: '48px 24px',
                textAlign: 'center',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 10,
              }}
            >
              <div
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: '50%',
                  border: '1px solid var(--rule)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'var(--ink-faint)',
                }}
              >
                <IconStar size={16} />
              </div>
              <div style={{ fontSize: 12.5, color: 'var(--ink-soft)' }}>
                일본어 텍스트를 선택하면 분석이 시작돼요.
              </div>
              <div style={{ fontSize: 11, color: 'var(--ink-faint)' }}>
                페이지의 일본어 문장을 드래그해 보세요
              </div>
            </div>
          )}
          {status === 'loading' && (
            <div style={{ padding: '12px 0' }}>
              <div className="sy-skel" style={{ height: 22, width: '80%', marginBottom: 12 }} />
              <div className="sy-skel" style={{ height: 22, width: '60%', marginBottom: 12 }} />
              <div className="sy-skel" style={{ height: 22, width: '90%' }} />
            </div>
          )}
          {status === 'error' && (
            <p style={{ fontSize: 12, color: 'var(--err)', margin: 0 }}>
              분석 실패. 다시 시도해 주세요.
            </p>
          )}
        </div>
      )}

      {/* Split layout — shown only when done */}
      {status === 'done' && (
        <div
          ref={wrapperRef}
          style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0 }}
        >
          {/* Top: toolbar + reading flow */}
          <section
            style={{
              height: `${split}%`,
              minHeight: 80,
              display: 'flex',
              flexDirection: 'column',
              overflow: 'hidden',
            }}
          >
            {/* Toolbar */}
            <div
              style={{
                display: 'flex',
                gap: 6,
                padding: '6px 12px',
                alignItems: 'center',
                borderBottom: '1px solid var(--rule-soft)',
                flex: '0 0 auto',
              }}
            >
              <ToggleChip
                label="후리가나"
                active={showFurigana}
                onClick={toggleFurigana}
                icon={<span style={{ fontFamily: 'var(--font-jp-sans)', fontSize: 9 }}>ふ</span>}
              />
              <ToggleChip
                label="로마자"
                active={showRomaji}
                onClick={toggleRomaji}
                icon={<span style={{ fontFamily: 'var(--font-mono)', fontSize: 9 }}>A</span>}
              />
              <div style={{ flex: 1 }} />
              <span style={{ fontSize: 10.5, color: 'var(--ink-faint)' }}>{wordCount}어</span>
            </div>

            {/* Tokens */}
            <div
              className="sy-scroll"
              style={{ flex: 1, overflowY: 'auto', padding: '12px 14px 10px' }}
            >
              <div style={{ position: 'relative' }}>
                {selectedIdx !== null && (
                  <span
                    style={{
                      position: 'absolute',
                      left: -10,
                      top: 4,
                      bottom: 4,
                      width: 2,
                      background: 'var(--accent-line)',
                      borderRadius: 1,
                      opacity: 0.6,
                    }}
                  />
                )}
                <div
                  style={{
                    fontFamily: 'var(--font-jp)',
                    display: 'flex',
                    flexWrap: 'wrap',
                    gap: '1px 0',
                    alignItems: 'flex-end',
                    lineHeight: 2.2,
                    fontSize: 17,
                  }}
                >
                  {tokens.map((token, i) => {
                    const furigana =
                      showFurigana && hasKanji(token.surface_form) && token.reading
                        ? toHiragana(token.reading)
                        : null;
                    const isPunct = token.pos === '記号';
                    const tokRomaji = showRomaji && !isPunct ? buildRomaji([token]) : null;
                    return (
                      <button
                        key={`${token.word_position}-${token.surface_form}`}
                        type="button"
                        onClick={isPunct ? undefined : () => handleTokenClick(token, i)}
                        style={{
                          display: 'inline-flex',
                          flexDirection: 'column',
                          alignItems: 'center',
                          padding: isPunct ? '2px 1px 3px' : '2px 3px 3px',
                          borderRadius: 'var(--r-xs)',
                          background: selectedIdx === i ? 'var(--mark)' : 'transparent',
                          boxShadow: selectedIdx === i ? 'inset 0 -2px 0 var(--mark-line)' : 'none',
                          cursor: isPunct ? 'default' : 'pointer',
                          border: 'none',
                          transition: 'background .12s, box-shadow .12s',
                        }}
                        onMouseEnter={(e) => {
                          if (!isPunct && selectedIdx !== i) {
                            (e.currentTarget as HTMLElement).style.background = 'var(--paper-sunk)';
                          }
                        }}
                        onMouseLeave={(e) => {
                          if (selectedIdx !== i) {
                            (e.currentTarget as HTMLElement).style.background = 'transparent';
                          }
                        }}
                      >
                        <span
                          style={{
                            fontFamily: 'var(--font-jp-sans)',
                            fontSize: '0.55em',
                            color: 'var(--ink-mute)',
                            letterSpacing: '0.02em',
                            marginBottom: '0.15em',
                            minHeight: furigana ? undefined : '0.7em',
                            fontWeight: 400,
                          }}
                        >
                          {furigana ?? ''}
                        </span>
                        <span
                          style={{
                            fontFamily: 'var(--font-jp)',
                            fontWeight: 500,
                            color:
                              token.pos === '助詞' || token.pos === '助動詞'
                                ? 'var(--ink-mute)'
                                : 'var(--ink)',
                          }}
                        >
                          {token.surface_form}
                        </span>
                        {tokRomaji && (
                          <span
                            style={{
                              fontFamily: 'var(--font-mono)',
                              fontSize: 9,
                              color: 'var(--ink-faint)',
                              marginTop: 2,
                              letterSpacing: '0.02em',
                            }}
                          >
                            {tokRomaji}
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          </section>

          {/* Drag handle */}
          <button
            type="button"
            onMouseDown={onHandleDown}
            aria-label="분할 조절"
            style={{
              height: 8,
              width: '100%',
              cursor: 'row-resize',
              background: 'var(--paper-soft)',
              borderTop: '1px solid var(--rule)',
              borderBottom: '1px solid var(--rule)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flex: '0 0 auto',
              padding: 0,
            }}
          >
            <div style={{ width: 28, height: 2, borderRadius: 1, background: 'var(--rule)' }} />
          </button>

          {/* Bottom: word detail */}
          <section
            style={{
              flex: 1,
              minHeight: 80,
              display: 'flex',
              flexDirection: 'column',
              background: 'var(--paper-soft)',
              overflow: 'hidden',
            }}
          >
            {selectedIdx !== null && lookupStatus !== null ? (
              <WordCard
                flat
                token={tokens[selectedIdx]}
                result={wordResult}
                status={lookupStatus}
                error={lookupError}
                bookmarked={bookmarks.has(tokens[selectedIdx]?.surface_form ?? '')}
                onBookmark={handleBookmark}
                onClose={() => {
                  setSelectedIdx(null);
                  setWordResult(null);
                  setLookupStatus(null);
                }}
              />
            ) : (
              <div
                style={{
                  flex: 1,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 8,
                  padding: '24px',
                }}
              >
                <IconSparkle size={16} />
                <span style={{ fontSize: 11.5, color: 'var(--ink-mute)' }}>
                  위에서 단어를 누르면 뜻이 여기에 표시돼요.
                </span>
              </div>
            )}
          </section>
        </div>
      )}

      {/* Session strip */}
      <SessionStrip session={session} onJump={jumpToWord} onClear={() => setSession([])} />

      {/* Slide-overs */}
      <BookmarksOver
        open={over === 'bookmarks'}
        onClose={() => setOver(null)}
        items={bookmarkList}
        onRemove={handleRemoveBookmark}
      />
      <HistoryOver open={over === 'history'} onClose={() => setOver(null)} items={history} />
      {over === 'settings' && <Settings onClose={() => setOver(null)} />}
    </div>
  );
}
