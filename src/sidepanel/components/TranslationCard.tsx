import { useEffect, useRef, useState } from 'react';
import { toRomaji } from 'wanakana';
import type { LookupStatus, Translation } from '../../types';
import { cn } from '../../lib/cn';
import { IconButton } from './IconButton';
import { SpeakerButton } from './WordCard';
import { IconClose, IconCopy } from './Icons';

type Props = {
  text: string;
  status: LookupStatus;
  result: Translation | null;
  error?: string | undefined;
  showRomaji: boolean;
  onClose: () => void;
};

export function TranslationCard({ text, status, result, error, showRomaji, onClose }: Props) {
  // 읽기·로마자는 Groq가 문맥 기반으로 반환한 reading에서 도출
  const reading = result?.reading ?? '';
  const romaji = reading ? toRomaji(reading) : '';

  const [toast, setToast] = useState<string | null>(null);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(
    () => () => {
      if (toastTimer.current) clearTimeout(toastTimer.current);
    },
    [],
  );

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(result?.translation ?? text);
    } catch {
      /* ignored */
    }
    setToast('복사됨');
    if (toastTimer.current) clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(null), 1800);
  };

  return (
    <div className="flex flex-col h-full">
      {/* header — 슬림 바 */}
      <header className="px-3.5 pt-3 pb-2 flex-none flex items-center justify-between gap-2">
        <span className="chip">번역</span>
        <div className="flex gap-0 flex-none">
          <SpeakerButton word={text} say={reading || text} />
          <IconButton label="닫기" onClick={onClose} className="w-7 h-7">
            <IconClose size={15} />
          </IconButton>
        </div>
      </header>

      {/* body */}
      <div className="sy-scroll flex-1 overflow-y-auto px-3.5 pb-3">
        {/* 번역 — 주역 */}
        {status === 'loading' && (
          <div>
            <div className="sy-skel" style={{ width: '100%', height: 13, marginBottom: 5 }} />
            <div className="sy-skel" style={{ width: '85%', height: 13, marginBottom: 5 }} />
            <div className="sy-skel" style={{ width: '60%', height: 13 }} />
          </div>
        )}

        {status === 'no-key' && (
          <p className="text-xs text-ink-mute m-0">
            설정에서 Groq API 키를 입력하면 번역을 볼 수 있어요.
          </p>
        )}

        {status === 'error' && (
          <p className="text-xs text-err m-0">{error ?? 'API 오류가 발생했어요.'}</p>
        )}

        {status === 'done' && result && (
          <p className="text-ink text-[14.5px] leading-[1.7] m-0">{result.translation}</p>
        )}

        {/* 원문 — 보조 (로딩 중에도 표시: 무엇을 번역 중인지 보이게) */}
        <div className="mt-3.5 pt-3 border-t border-rule-soft">
          <div className="section-label">원문</div>
          <p className="font-jp text-[13px] text-ink-soft leading-[1.6] m-0 break-words">{text}</p>
          {reading && (
            <p className="font-jp-sans text-[11px] text-ink-mute leading-[1.5] mt-1 m-0 break-words">
              {reading}
            </p>
          )}
          {showRomaji && romaji && (
            <p className="font-mono text-[10px] text-ink-faint leading-[1.45] mt-1 m-0 break-all">
              {romaji}
            </p>
          )}
        </div>
      </div>

      {/* footer */}
      {status === 'done' && result && (
        <footer className="flex gap-0.5 px-2 py-1.5 border-t border-rule-soft bg-paper relative flex-none">
          <button
            type="button"
            onClick={handleCopy}
            className={cn(
              'inline-flex items-center gap-1.5 px-2 py-1 rounded-sm text-[11.5px]',
              'bg-transparent border-0 cursor-pointer transition-colors duration-150 font-ui',
              'hover:bg-paper-sunk hover:text-ink text-ink-soft',
            )}
          >
            <IconCopy size={12} />
            복사
          </button>
          <div className="flex-1" />
          {toast && (
            <span className="sy-toast absolute bottom-[calc(100%+4px)] left-1/2 bg-ink text-paper text-[10.5px] px-2.5 py-1 rounded-full whitespace-nowrap pointer-events-none">
              {toast}
            </span>
          )}
        </footer>
      )}
    </div>
  );
}
