import { useState, useEffect, useRef } from 'react';
import type { JapaneseToken } from '../../models/JapaneseToken';
import type { WordEntry } from '../../models/WordEntry';
import { cn } from '../../lib/cn';
import { IconSpeaker, IconStar, IconStarFill, IconClose, IconPlus, IconCopy } from './Icons';

type LookupStatus = 'loading' | 'done' | 'no-key' | 'error';

type Props = {
  token: JapaneseToken;
  result: WordEntry | null;
  status: LookupStatus;
  error?: string;
  bookmarked: boolean;
  onBookmark: () => void;
  onClose: () => void;
  flat?: boolean;
};

export function SpeakerButton({ word }: { word: string }) {
  const [playing, setPlaying] = useState(false);

  const speak = () => {
    setPlaying(true);
    const utt = new SpeechSynthesisUtterance(word);
    utt.lang = 'ja-JP';
    utt.onend = () => setPlaying(false);
    speechSynthesis.speak(utt);
    setTimeout(() => setPlaying(false), 2000);
  };

  return (
    <button
      type="button"
      onClick={speak}
      title="발음 듣기"
      aria-label="발음 듣기"
      className={cn(
        'btn-icon w-7 h-7 rounded-sm relative',
        playing ? 'text-accent bg-accent-soft' : 'text-ink-soft',
      )}
    >
      <IconSpeaker size={15} />
      {playing && (
        <span
          className="absolute inset-0 rounded-sm border-[1.5px] border-accent"
          style={{ animation: 'sy-tts 1.2s ease-out infinite' }}
        />
      )}
    </button>
  );
}

function IconBtn({
  children,
  label,
  onClick,
  active,
}: {
  children: React.ReactNode;
  label: string;
  onClick?: () => void;
  active?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={label}
      aria-label={label}
      className={cn(
        'btn-icon w-7 h-7 rounded-sm',
        active ? 'text-accent bg-accent-soft' : 'text-ink-soft',
      )}
    >
      {children}
    </button>
  );
}

function FooterBtn({
  children,
  icon,
  onClick,
  subtle,
}: {
  children: React.ReactNode;
  icon: React.ReactNode;
  onClick?: () => void;
  subtle?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'inline-flex items-center gap-1.5 px-2 py-1 rounded-sm text-[11.5px]',
        'bg-transparent border-0 cursor-pointer transition-colors duration-150 font-ui',
        'hover:bg-paper-sunk hover:text-ink',
        subtle ? 'text-ink-mute' : 'text-ink-soft',
      )}
    >
      {icon}
      {children}
    </button>
  );
}

function Skel({ w, h = 11 }: { w: string; h?: number }) {
  return <div className="sy-skel" style={{ width: w, height: h, marginBottom: 4 }} />;
}

export function WordCard({
  token,
  result,
  status,
  error,
  bookmarked,
  onBookmark,
  onClose,
  flat = false,
}: Props) {
  const { reading, romaji } = token;
  const cardRef = useRef<HTMLElement>(null);

  const [toast, setToast] = useState<string | null>(null);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(
    () => () => {
      if (toastTimer.current) clearTimeout(toastTimer.current);
    },
    [],
  );

  const showToast = (msg: string) => {
    setToast(msg);
    if (toastTimer.current) clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(null), 1800);
  };

  const handleCopy = async () => {
    const text = result ? result.toClipboardText(token) : token.surface;
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      /* ignored */
    }
    showToast('복사됨');
  };

  const handleAnki = () => {
    showToast('Anki 카드 추가됨');
  };

  useEffect(() => {
    if (flat || !cardRef.current) return;
    cardRef.current.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }, [token.surface, flat]);

  return (
    <article
      ref={cardRef}
      className={cn(
        flat
          ? 'flex flex-col h-full'
          : 'sy-rise mt-2 relative bg-paper-soft border border-rule rounded-md overflow-hidden',
      )}
    >
      {/* pointer triangle — inline mode only */}
      {!flat && (
        <span className="absolute -top-1.5 left-5 w-[11px] h-[11px] bg-paper-soft border-l border-t border-rule rotate-45" />
      )}

      {/* header */}
      <header className={cn('flex-none', flat ? 'px-3.5 pt-3 pb-2' : 'px-3.5 pt-3.5 pb-2.5')}>
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            {reading && (
              <div className="font-jp-sans text-[10.5px] text-ink-faint tracking-[0.04em] mb-0.5">
                {reading}
                {romaji && <span className="font-mono ml-1.5">· {romaji}</span>}
              </div>
            )}
            <div className="font-jp text-2xl font-medium text-ink leading-[1.15] mt-0.5">
              {token.surface}
            </div>
            {result && (
              <div className="flex gap-1.5 mt-1.5 items-center flex-wrap">
                <span className="chip">{result.pos}</span>
              </div>
            )}
          </div>
          <div className="flex gap-0 flex-none">
            <SpeakerButton word={token.surface} />
            <IconBtn label="단어장에 저장" onClick={onBookmark} active={bookmarked}>
              {bookmarked ? <IconStarFill size={15} /> : <IconStar size={15} />}
            </IconBtn>
            <IconBtn label="닫기" onClick={onClose}>
              <IconClose size={15} />
            </IconBtn>
          </div>
        </div>
      </header>

      {/* body */}
      <div className={cn('px-3.5 pb-3', flat && 'sy-scroll flex-1 overflow-y-auto')}>
        {status === 'loading' && (
          <div>
            <Skel w="50%" h={14} />
            <Skel w="100%" />
            <Skel w="75%" />
          </div>
        )}

        {status === 'no-key' && (
          <p className="text-xs text-ink-mute m-0">
            설정에서 Groq API 키를 입력하면 단어 뜻을 볼 수 있어요.
          </p>
        )}

        {status === 'error' && (
          <p className="text-xs text-err m-0">{error ?? 'API 오류가 발생했어요.'}</p>
        )}

        {status === 'done' && result && (
          <div className="flex flex-col gap-3.5">
            {/* meanings */}
            <div>
              <div className="section-label">뜻</div>
              <ol className="m-0 pl-[18px] flex flex-col gap-1">
                {result.meanings.map((m) => (
                  <li key={m} className="text-ink text-[13.5px] leading-[1.55]">
                    {m}
                  </li>
                ))}
              </ol>
            </div>

            {/* examples */}
            {result.examples && result.examples.length > 0 && (
              <div>
                <div className="section-label">예문</div>
                <div className="flex flex-col gap-2">
                  {result.examples.map((ex) => (
                    <div key={ex.jp} className="border-l-2 border-rule pl-2.5">
                      <div className="font-jp text-[13px] text-ink leading-[1.65]">{ex.jp}</div>
                      <div className="text-[11.5px] text-ink-mute mt-0.5">{ex.kr}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* related */}
            {result.related && result.related.length > 0 && (
              <div>
                <div className="section-label">관련어</div>
                <div className="flex flex-wrap gap-1.5">
                  {result.related.map((r) => (
                    <span
                      key={r}
                      className="font-jp-sans text-xs px-2 py-[3px] rounded-full bg-paper-sunk text-ink-soft border border-rule-soft"
                    >
                      {r}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* footer */}
      {status === 'done' && result && (
        <footer className="flex gap-0.5 px-2 py-1.5 border-t border-rule-soft bg-paper relative flex-none">
          <FooterBtn icon={<IconPlus size={13} />} onClick={handleAnki}>
            Anki에 추가
          </FooterBtn>
          <FooterBtn icon={<IconCopy size={12} />} onClick={handleCopy}>
            복사
          </FooterBtn>
          <div className="flex-1" />

          {toast && (
            <span className="sy-toast absolute bottom-[calc(100%+4px)] left-1/2 bg-ink text-paper text-[10.5px] px-2.5 py-1 rounded-full whitespace-nowrap pointer-events-none">
              {toast}
            </span>
          )}
        </footer>
      )}
    </article>
  );
}
