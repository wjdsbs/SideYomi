import { useEffect, useState } from 'react';

export default function App() {
  const [text, setText] = useState<string | null>(null);

  useEffect(() => {
    const handler = (message: { type: string; text: string }) => {
      if (message.type === 'TEXT_SELECTED') {
        setText(message.text);
      }
    };
    chrome.runtime.onMessage.addListener(handler);
    return () => chrome.runtime.onMessage.removeListener(handler);
  }, []);

  return (
    <div className="p-4 font-sans">
      <h1 className="text-lg font-bold mb-2">SideYomi</h1>
      <p className="text-sm text-gray-500">
        {text ?? '텍스트를 선택하면 분석 결과가 여기에 표시됩니다.'}
      </p>
    </div>
  );
}
