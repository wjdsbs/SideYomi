import { useRef, useState } from 'react';

const STORAGE_KEY = 'splitRatio';
const DEFAULT_SPLIT = 42;
const MIN_SPLIT = 20;
const MAX_SPLIT = 75;

export function useSplitLayout(containerRef: React.RefObject<HTMLDivElement | null>) {
  const [split, setSplit] = useState(
    () => Number(localStorage.getItem(STORAGE_KEY)) || DEFAULT_SPLIT,
  );
  const dragging = useRef(false);

  const onHandleDown = (e: React.MouseEvent) => {
    dragging.current = true;
    e.preventDefault();
    let lastPct = split;

    const onMove = (ev: MouseEvent) => {
      if (!dragging.current || !containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      lastPct = Math.max(
        MIN_SPLIT,
        Math.min(MAX_SPLIT, ((ev.clientY - rect.top) / rect.height) * 100),
      );
      setSplit(lastPct);
    };

    const onUp = () => {
      dragging.current = false;
      localStorage.setItem(STORAGE_KEY, String(lastPct));
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
    };

    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
  };

  return { split, onHandleDown };
}
