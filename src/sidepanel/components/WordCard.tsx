import { useState, useEffect, useRef } from 'react';
import type kuromoji from 'kuromoji';
import type { WordResult } from '../../lib/gemini';
import { toHiragana, buildRomaji } from '../../lib/japanese';
import {
  IconSpeaker,
  IconStar,
  IconStarFill,
  IconClose,
  IconPlus,
  IconCopy,
  IconNote,
} from './Icons';

type Token = kuromoji.IpadicFeatures;
type LookupStatus = 'loading' | 'done' | 'no-key' | 'error';

type Props = {
  token: Token;
  result: WordResult | null;
  status: LookupStatus;
  error?: string;
  bookmarked: boolean;
  onBookmark: () => void;
  onClose: () => void;
  flat?: boolean; // no card frame — used in split pane
};

function SpeakerButton({ word }: { word: string }) {
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
      style={{
        width: 28,
        height: 28,
        borderRadius: 'var(--r-sm)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: playing ? 'var(--accent)' : 'var(--ink-soft)',
        background: playing ? 'var(--accent-soft)' : 'transparent',
        border: 'none',
        cursor: 'pointer',
        position: 'relative',
        transition: 'all .15s',
      }}
    >
      <IconSpeaker size={15} />
      {playing && (
        <span
          style={{
            position: 'absolute',
            inset: 0,
            borderRadius: 'var(--r-sm)',
            border: '1.5px solid var(--accent)',
            animation: 'sy-tts 1.2s ease-out infinite',
          }}
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
      style={{
        width: 28,
        height: 28,
        borderRadius: 'var(--r-sm)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: active ? 'var(--accent)' : 'var(--ink-soft)',
        background: active ? 'var(--accent-soft)' : 'transparent',
        border: 'none',
        cursor: 'pointer',
        transition: 'all .15s',
      }}
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
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 5,
        padding: '5px 8px',
        borderRadius: 'var(--r-sm)',
        fontSize: 11.5,
        color: subtle ? 'var(--ink-mute)' : 'var(--ink-soft)',
        background: 'transparent',
        border: 'none',
        cursor: 'pointer',
        transition: 'background .15s, color .15s',
        fontFamily: 'var(--font-ui)',
      }}
      onMouseEnter={(e) => {
        (e.currentTarget as HTMLElement).style.background = 'var(--paper-sunk)';
        (e.currentTarget as HTMLElement).style.color = 'var(--ink)';
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLElement).style.background = 'transparent';
        (e.currentTarget as HTMLElement).style.color = subtle
          ? 'var(--ink-mute)'
          : 'var(--ink-soft)';
      }}
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
  const reading = token.reading ? toHiragana(token.reading) : null;
  const romaji = buildRomaji([token]);
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
    const text = result
      ? `${token.surface_form} (${reading}) — ${result.meanings[0]}`
      : token.surface_form;
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
  }, [token.surface_form, flat]);

  return (
    <article
      ref={cardRef}
      className={flat ? undefined : 'sy-rise'}
      style={
        flat
          ? { display: 'flex', flexDirection: 'column', height: '100%' }
          : {
              marginTop: 8,
              position: 'relative',
              background: 'var(--paper-soft)',
              border: '1px solid var(--rule)',
              borderRadius: 'var(--r-md)',
              overflow: 'hidden',
            }
      }
    >
      {/* pointer triangle — inline mode only */}
      {!flat && (
        <span
          style={{
            position: 'absolute',
            top: -6,
            left: 20,
            width: 11,
            height: 11,
            background: 'var(--paper-soft)',
            borderLeft: '1px solid var(--rule)',
            borderTop: '1px solid var(--rule)',
            transform: 'rotate(45deg)',
          }}
        />
      )}

      {/* header */}
      <header style={{ padding: flat ? '12px 14px 8px' : '14px 14px 10px', flex: '0 0 auto' }}>
        <div
          style={{
            display: 'flex',
            alignItems: 'flex-start',
            justifyContent: 'space-between',
            gap: 8,
          }}
        >
          <div style={{ minWidth: 0 }}>
            {reading && (
              <div
                style={{
                  fontFamily: 'var(--font-jp-sans)',
                  fontSize: 10.5,
                  color: 'var(--ink-faint)',
                  letterSpacing: '0.04em',
                  marginBottom: 2,
                }}
              >
                {reading}
                {romaji && (
                  <span style={{ fontFamily: 'var(--font-mono)', marginLeft: 6 }}>· {romaji}</span>
                )}
              </div>
            )}
            <div
              style={{
                fontFamily: 'var(--font-jp)',
                fontSize: 24,
                fontWeight: 500,
                color: 'var(--ink)',
                lineHeight: 1.15,
                marginTop: 2,
              }}
            >
              {token.surface_form}
            </div>
            {result && (
              <div
                style={{
                  display: 'flex',
                  gap: 5,
                  marginTop: 6,
                  alignItems: 'center',
                  flexWrap: 'wrap',
                }}
              >
                <span
                  style={{
                    fontSize: 10,
                    padding: '1px 6px',
                    borderRadius: 999,
                    color: 'var(--ink-soft)',
                    background: 'var(--paper-sunk)',
                    border: '1px solid var(--rule)',
                    fontWeight: 500,
                  }}
                >
                  {result.pos}
                </span>
              </div>
            )}
          </div>
          <div style={{ display: 'flex', gap: 0, flex: '0 0 auto' }}>
            <SpeakerButton word={token.surface_form} />
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
      <div
        className={flat ? 'sy-scroll' : undefined}
        style={{
          padding: '0 14px 12px',
          flex: flat ? 1 : undefined,
          overflowY: flat ? 'auto' : undefined,
        }}
      >
        {status === 'loading' && (
          <div>
            <Skel w="50%" h={14} />
            <Skel w="100%" />
            <Skel w="75%" />
          </div>
        )}

        {status === 'no-key' && (
          <p style={{ fontSize: 12, color: 'var(--ink-mute)', margin: 0 }}>
            설정에서 Groq API 키를 입력하면 단어 뜻을 볼 수 있어요.
          </p>
        )}

        {status === 'error' && (
          <p style={{ fontSize: 12, color: 'var(--err)', margin: 0 }}>
            {error ?? 'API 오류가 발생했어요.'}
          </p>
        )}

        {status === 'done' && result && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {/* meanings */}
            <div>
              <div
                style={{
                  fontSize: 10,
                  textTransform: 'uppercase',
                  letterSpacing: '0.12em',
                  color: 'var(--ink-mute)',
                  fontWeight: 600,
                  marginBottom: 6,
                }}
              >
                뜻
              </div>
              <ol
                style={{
                  margin: 0,
                  paddingLeft: 18,
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 4,
                }}
              >
                {result.meanings.map((m) => (
                  <li key={m} style={{ color: 'var(--ink)', fontSize: 13.5, lineHeight: 1.55 }}>
                    {m}
                  </li>
                ))}
              </ol>
            </div>

            {/* examples */}
            {result.examples && result.examples.length > 0 && (
              <div>
                <div
                  style={{
                    fontSize: 10,
                    textTransform: 'uppercase',
                    letterSpacing: '0.12em',
                    color: 'var(--ink-mute)',
                    fontWeight: 600,
                    marginBottom: 6,
                  }}
                >
                  예문
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {result.examples.map((ex) => (
                    <div
                      key={ex.jp}
                      style={{ borderLeft: '2px solid var(--rule)', paddingLeft: 10 }}
                    >
                      <div
                        style={{
                          fontFamily: 'var(--font-jp)',
                          fontSize: 13,
                          color: 'var(--ink)',
                          lineHeight: 1.65,
                        }}
                      >
                        {ex.jp}
                      </div>
                      <div style={{ fontSize: 11.5, color: 'var(--ink-mute)', marginTop: 2 }}>
                        {ex.kr}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* related */}
            {result.related && result.related.length > 0 && (
              <div>
                <div
                  style={{
                    fontSize: 10,
                    textTransform: 'uppercase',
                    letterSpacing: '0.12em',
                    color: 'var(--ink-mute)',
                    fontWeight: 600,
                    marginBottom: 6,
                  }}
                >
                  관련어
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
                  {result.related.map((r) => (
                    <span
                      key={r}
                      style={{
                        fontFamily: 'var(--font-jp-sans)',
                        fontSize: 12,
                        padding: '3px 8px',
                        borderRadius: 999,
                        background: 'var(--paper-sunk)',
                        color: 'var(--ink-soft)',
                        border: '1px solid var(--rule-soft)',
                      }}
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
        <footer
          style={{
            display: 'flex',
            gap: 2,
            padding: '6px 8px',
            borderTop: '1px solid var(--rule-soft)',
            background: 'var(--paper)',
            position: 'relative',
          }}
        >
          <FooterBtn icon={<IconPlus size={13} />} onClick={handleAnki}>
            Anki에 추가
          </FooterBtn>
          <FooterBtn icon={<IconCopy size={12} />} onClick={handleCopy}>
            복사
          </FooterBtn>
          <div style={{ flex: 1 }} />

          {toast && (
            <span
              className="sy-toast"
              style={{
                position: 'absolute',
                bottom: 'calc(100% + 4px)',
                left: '50%',
                background: 'var(--ink)',
                color: 'var(--paper)',
                fontSize: 10.5,
                padding: '4px 10px',
                borderRadius: 999,
                whiteSpace: 'nowrap',
                pointerEvents: 'none',
              }}
            >
              {toast}
            </span>
          )}
        </footer>
      )}
    </article>
  );
}
