import { useEffect, useRef, useState } from 'react';

// Animates a numeric value from 0 (or its previous value) up to `value`
// whenever it changes. Falls back to a plain render for non-numeric values.
export default function CountUp({ value, duration = 600 }) {
  const [display, setDisplay] = useState(0);
  const fromRef = useRef(0);

  useEffect(() => {
    const target = Number(value);
    if (Number.isNaN(target)) {
      setDisplay(value);
      return undefined;
    }

    const from = fromRef.current;
    const start = performance.now();
    let frame;

    const tick = (now) => {
      const progress = Math.min((now - start) / duration, 1);
      const eased = 1 - (1 - progress) * (1 - progress);
      setDisplay(Math.round(from + (target - from) * eased));
      if (progress < 1) {
        frame = requestAnimationFrame(tick);
      } else {
        fromRef.current = target;
      }
    };

    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [value, duration]);

  return display;
}
