import { useEffect, useRef, useState } from 'react';
import { useApp } from '../state/useApp';
import { useWordbook } from '../hooks/useWordbook';
import { useSplitLayout } from '../hooks/useSplitLayout';
import { cn } from '../lib/cn';
import { WordCardPanel } from './components/WordCard';
import { TranslationCard } from './components/TranslationCard';
import { Settings } from './components/Settings';
import { BookmarksOver, HistoryOver } from './components/SlideOver';
import { Toolbar } from './components/Toolbar';
import { TokenFlow } from './components/TokenFlow';
import { IconButton } from './components/IconButton';
import { IconBook, IconClock, IconSettings, IconSparkle, IconStar } from './components/Icons';

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

const headerBtnClass = 'w-[30px] h-[30px] hover:bg-paper-sunk relative';

export default function App() {
  const [over, setOver] = useState<Over>(null);
  const { state, loadText, selectToken, translateRange, translateAll, clearTranslation } = useApp();
  const wordbook = useWordbook();
  const wrapperRef = useRef<HTMLDivElement>(null);
  const { split, onHandleDown } = useSplitLayout(wrapperRef);
  const [showFurigana, toggleFurigana] = useLocalToggle('showFurigana', true);
  const [showRomaji, toggleRomaji] = useLocalToggle('showRomaji', false);

  useEffect(() => {
    const handler = (msg: { type: string; text: string; title?: string; url?: string }) => {
      if (msg.type !== 'TEXT_SELECTED') return;
      loadText(msg.text, { title: msg.title ?? '', url: msg.url ?? '' });
    };
    chrome.runtime.onMessage.addListener(handler);
    return () => chrome.runtime.onMessage.removeListener(handler);
  }, [loadText]);

  const { tokens, selectedIdx, selectedRange, history, lookup, translation, readerStatus } = state;
  const selectedToken = selectedIdx !== null ? (tokens[selectedIdx] ?? null) : null;
  const wordCount = tokens.filter((t) => !t.isPunctuation).length;

  // 선택 구간의 원문 (읽기·로마자는 번역 카드에서 Groq 결과로 도출)
  const phraseText = selectedRange
    ? tokens
        .slice(selectedRange.start, selectedRange.end + 1)
        .map((t) => t.surface)
        .join('')
    : '';

  // "전체 번역" 토글: 이미 전체 범위 번역 중이면 닫기
  const isFullTranslation =
    selectedRange !== null && selectedRange.start === 0 && selectedRange.end === tokens.length - 1;
  const handleTranslateAll = () => (isFullTranslation ? clearTranslation() : translateAll());

  // 하단 패널: 번역(드래그) → 단어(클릭) → 안내
  let bottomPanel;
  if (selectedRange) {
    bottomPanel = (
      <TranslationCard
        text={phraseText}
        status={translation.status}
        result={translation.result}
        error={translation.error}
        showRomaji={showRomaji}
        onClose={clearTranslation}
      />
    );
  } else if (selectedToken && lookup.status !== 'idle') {
    bottomPanel = (
      <WordCardPanel
        token={selectedToken}
        result={lookup.entry}
        status={lookup.status}
        error={lookup.error}
        bookmarked={wordbook.wordbook.has(selectedToken.surface)}
        onBookmark={() => wordbook.toggleBookmark(selectedToken, lookup.entry)}
        onClose={() => selectToken(selectedIdx!)}
      />
    );
  } else {
    bottomPanel = (
      <div className="flex-1 flex flex-col items-center justify-center gap-2 p-6">
        <IconSparkle size={16} />
        <span className="text-[11.5px] text-ink-mute">
          단어를 누르면 뜻, 드래그하면 번역이 여기에 표시돼요.
        </span>
      </div>
    );
  }

  return (
    <div className="font-ui text-ink bg-paper text-[13px] h-screen flex flex-col relative overflow-hidden antialiased">
      {/* 헤더 */}
      <header className="px-3 pt-[11px] pb-[9px] border-b border-rule flex items-center justify-between gap-2 bg-paper flex-none">
        <div className="flex items-baseline gap-2">
          <span className="font-semibold text-[13.5px] tracking-[-0.01em] text-ink">SideYomi</span>
          <span className="font-jp text-[11px] text-ink-faint">側読</span>
        </div>
        <div className="flex gap-0.5">
          <IconButton
            label="단어장"
            onClick={() => setOver('bookmarks')}
            badge={wordbook.wordbook.size}
            className={headerBtnClass}
          >
            <IconBook size={15} />
          </IconButton>
          <IconButton
            label="최근 본 단어"
            onClick={() => setOver('history')}
            className={headerBtnClass}
          >
            <IconClock size={15} />
          </IconButton>
          <IconButton label="설정" onClick={() => setOver('settings')} className={headerBtnClass}>
            <IconSettings size={15} />
          </IconButton>
        </div>
      </header>

      {/* 비활성 상태 */}
      {readerStatus !== 'done' && (
        <div className="sy-scroll flex-1 overflow-y-auto px-3.5 py-5">
          {readerStatus === 'idle' && (
            <div className="py-12 px-6 text-center flex flex-col items-center gap-2.5">
              <div className="w-9 h-9 rounded-full border border-rule flex items-center justify-center text-ink-faint">
                <IconStar size={16} />
              </div>
              <div className="text-[12.5px] text-ink-soft">
                일본어 텍스트를 선택하면 분석이 시작돼요.
              </div>
              <div className="text-[11px] text-ink-faint">
                페이지의 일본어 문장을 드래그해 보세요
              </div>
            </div>
          )}
          {readerStatus === 'loading' && (
            <div className="py-3">
              <div className="sy-skel h-[22px] w-4/5 mb-3" />
              <div className="sy-skel h-[22px] w-3/5 mb-3" />
              <div className="sy-skel h-[22px] w-[90%]" />
            </div>
          )}
          {readerStatus === 'error' && (
            <p className="text-xs text-err m-0">분석 실패. 다시 시도해 주세요.</p>
          )}
        </div>
      )}

      {/* Split 레이아웃 */}
      {readerStatus === 'done' && (
        <div ref={wrapperRef} className="flex-1 flex flex-col min-h-0">
          {/* 상단: 툴바 + 토큰 */}
          <section
            className="flex flex-col overflow-hidden"
            style={{ height: `${split}%`, minHeight: 80 }}
          >
            <Toolbar
              showFurigana={showFurigana}
              showRomaji={showRomaji}
              wordCount={wordCount}
              onToggleFurigana={toggleFurigana}
              onToggleRomaji={toggleRomaji}
              translateAllActive={isFullTranslation}
              onTranslateAll={handleTranslateAll}
            />
            <div className="sy-scroll flex-1 overflow-y-auto px-3.5 py-3 pb-2.5">
              <TokenFlow
                tokens={tokens}
                selectedIdx={selectedIdx}
                selectedRange={selectedRange}
                showFurigana={showFurigana}
                showRomaji={showRomaji}
                onTokenClick={selectToken}
                onRangeSelect={translateRange}
              />
            </div>
          </section>

          {/* 드래그 핸들 */}
          <button
            type="button"
            onMouseDown={onHandleDown}
            aria-label="분할 조절"
            className="h-2 w-full cursor-row-resize bg-paper-soft border-y border-rule flex items-center justify-center flex-none p-0"
          >
            <div className="w-7 h-0.5 rounded-sm bg-rule" />
          </button>

          {/* 하단: 단어 상세 */}
          <section
            className={cn('flex-1 flex flex-col bg-paper-soft overflow-hidden min-h-[80px]')}
          >
            {bottomPanel}
          </section>
        </div>
      )}

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
        wordbook={wordbook.wordbook}
        onToggleSave={(entry) => wordbook.toggleSave(entry)}
      />
      {over === 'settings' && <Settings onClose={() => setOver(null)} />}
    </div>
  );
}
