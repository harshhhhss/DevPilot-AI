import { useEffect, useState } from 'react';

// Reveals `text` progressively, character by character, so AI-generated
// prose feels like it's arriving live rather than being dumped all at once.
export default function TypewriterText({ text, speed = 12, className = '' }) {
  const [shown, setShown] = useState('');

  useEffect(() => {
    setShown('');
    if (!text) return undefined;

    let i = 0;
    const interval = setInterval(() => {
      i += 1;
      setShown(text.slice(0, i));
      if (i >= text.length) clearInterval(interval);
    }, speed);

    return () => clearInterval(interval);
  }, [text, speed]);

  return <span className={className}>{shown}</span>;
}
