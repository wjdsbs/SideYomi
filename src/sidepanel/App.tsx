import { useEffect, useRef, useState } from 'react';
import { useReader } from '../hooks/useReader';
import { useWordLookup } from '../hooks/useWordLookup';
import { useWordbook } from '../hooks/useWordbook';
import { useHistory } from '../hooks/useHistory';
import { useSplitLayout } from '../hooks/useSplitLayout';
import { WordCard } from './components/WordCard';
import { Settings } from './components/Settings';
import { SessionStrip } from './components/SessionStrip';
import { BookmarksOver, HistoryOver } from './components/SlideOver';
import { Toolbar } from './components/Toolbar';
import { SourceCrumb } from './components/SourceCrumb';
import { TokenFlow } from './components/TokenFlow';
import { IconBook, IconClock, IconSettings, IconSparkle, IconStar } from './components/Icons';

type Over = 'bookmarks' | 'history' | 'settings' | null;

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
  const [source, setSource] = useState<{ title: string; url: string } | null>(null);
  const [over, setOver] = useState<Over>(null);

  const reader = useReader();
  const lookup = useWordLookup();
  const wordbook = useWordbook();
  const { history, pushHistory } = useHistory();

  const wrapperRef = useRef<HTMLDivElement>(null);
  const layout = useSplitLayout(wrapperRef);

  // 안정적인 콜백만 구조 분해 — useEffect deps에 직접 사용
  const { load, selectedToken, pushSession } = reader;

  // 텍스트 선택 메시지 수신
  useEffect(() => {
    const handler = (message: { type: string; text: string; title?: string; url?: string }) => {
      if (message.type !== 'TEXT_SELECTED') return;
      load(message.text);
      if (message.title || message.url) {
        setSource({ title: message.title ?? '', url: message.url ?? '' });
      }
    };
    chrome.runtime.onMessage.addListener(handler);
    return () => chrome.runtime.onMessage.removeListener(handler);
  }, [load]);

  // 조회 완료 시 히스토리 + 세션 업데이트
  useEffect(() => {
    if (lookup.status !== 'done' || !selectedToken) return;
    const token = selectedToken;
    if (token.isPunctuation) return;

    const src = source?.url
      ? (() => {
          try {
            return new URL(source.url).hostname;
          } catch {
            return source.url;
          }
        })()
      : 'この画面';

    pushHistory(token, src);
    pushSession(token.surface);
  }, [lookup.status, selectedToken, pushSession, pushHistory, source]);

  const handleTokenClick = (idx: number) => {
    const token = reader.tokens[idx];
    if (!token) return;

    if (reader.selectedIdx === idx) {
      reader.deselectToken();
      lookup.reset();
      return;
    }

    reader.selectToken(idx);
    lookup.reset();

    const prev = reader.tokens[idx - 1];
    const next = reader.tokens[idx + 1];
    lookup.lookup(token, token.getContext(prev, next));
  };

  const handleClose = () => {
    reader.deselectToken();
    lookup.reset();
  };

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
      {/* 헤더 */}
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
          <IconBtn
            label="단어장"
            onClick={() => setOver('bookmarks')}
            badge={wordbook.wordbook.size}
          >
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

      {/* 출처 */}
      {source && <SourceCrumb title={source.title} url={source.url} />}

      {/* 비활성 상태 */}
      {reader.status !== 'done' && (
        <div
          className="sy-scroll"
          style={{ flex: 1, overflowY: 'auto', padding: '16px 14px 20px' }}
        >
          {reader.status === 'idle' && (
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
          {reader.status === 'loading' && (
            <div style={{ padding: '12px 0' }}>
              <div className="sy-skel" style={{ height: 22, width: '80%', marginBottom: 12 }} />
              <div className="sy-skel" style={{ height: 22, width: '60%', marginBottom: 12 }} />
              <div className="sy-skel" style={{ height: 22, width: '90%' }} />
            </div>
          )}
          {reader.status === 'error' && (
            <p style={{ fontSize: 12, color: 'var(--err)', margin: 0 }}>
              분석 실패. 다시 시도해 주세요.
            </p>
          )}
        </div>
      )}

      {/* Split 레이아웃 */}
      {reader.status === 'done' && (
        <div
          ref={wrapperRef}
          style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0 }}
        >
          {/* 상단: 툴바 + 토큰 */}
          <section
            style={{
              height: `${layout.split}%`,
              minHeight: 80,
              display: 'flex',
              flexDirection: 'column',
              overflow: 'hidden',
            }}
          >
            <Toolbar
              showFurigana={reader.showFurigana}
              showRomaji={reader.showRomaji}
              wordCount={reader.wordCount}
              onToggleFurigana={reader.toggleFurigana}
              onToggleRomaji={reader.toggleRomaji}
            />
            <div
              className="sy-scroll"
              style={{ flex: 1, overflowY: 'auto', padding: '12px 14px 10px' }}
            >
              <TokenFlow
                tokens={reader.tokens}
                selectedIdx={reader.selectedIdx}
                showFurigana={reader.showFurigana}
                showRomaji={reader.showRomaji}
                onTokenClick={handleTokenClick}
              />
            </div>
          </section>

          {/* 드래그 핸들 */}
          <button
            type="button"
            onMouseDown={layout.onHandleDown}
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
              border: 'none',
            }}
          >
            <div style={{ width: 28, height: 2, borderRadius: 1, background: 'var(--rule)' }} />
          </button>

          {/* 하단: 단어 상세 */}
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
            {reader.selectedToken && lookup.status !== null ? (
              <WordCard
                flat
                token={reader.selectedToken.toRaw()}
                result={
                  lookup.entry
                    ? {
                        meanings: lookup.entry.meanings,
                        pos: lookup.entry.pos,
                        examples: lookup.entry.examples,
                        related: lookup.entry.related,
                      }
                    : null
                }
                status={lookup.status}
                error={lookup.error}
                bookmarked={wordbook.wordbook.has(reader.selectedToken.surface)}
                onBookmark={() => {
                  if (reader.selectedToken)
                    wordbook.toggleBookmark(reader.selectedToken, lookup.entry);
                }}
                onClose={handleClose}
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

      {/* 세션 스트립 */}
      <SessionStrip
        session={reader.session.toList()}
        onJump={(word) => {
          const idx = reader.tokens.findIndex((t) => t.surface === word);
          if (idx >= 0) {
            setOver(null);
            handleTokenClick(idx);
          }
        }}
        onClear={reader.clearSession}
      />

      {/* 슬라이드오버 */}
      <BookmarksOver
        open={over === 'bookmarks'}
        onClose={() => setOver(null)}
        items={wordbook.wordbook.toList()}
        onRemove={(word) => wordbook.removeBookmark(word)}
      />
      <HistoryOver
        open={over === 'history'}
        onClose={() => setOver(null)}
        items={history.toList()}
      />
      {over === 'settings' && <Settings onClose={() => setOver(null)} />}
    </div>
  );
}
