import { useCallback, useState } from 'react';
import { ReadingHistory } from '../models/ReadingHistory';
import type { JapaneseToken } from '../models/JapaneseToken';

export function useHistory() {
  const [history, setHistory] = useState<ReadingHistory>(ReadingHistory.empty);

  const pushHistory = useCallback((token: JapaneseToken, src: string) => {
    setHistory((prev) => prev.push(token, src));
  }, []);

  return { history, pushHistory };
}
