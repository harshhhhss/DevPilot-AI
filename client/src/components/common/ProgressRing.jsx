import { motion } from 'framer-motion';

// Radial progress indicator — a lightweight, purely visual complement to
// the linear progress bars already used across the app.
export default function ProgressRing({ value = 0, size = 64, stroke = 6, label }) {
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const clamped = Math.min(100, Math.max(0, value));

  return (
    <div className="relative flex flex-none items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="#e2e8f0" strokeWidth={stroke} />
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="#2547ec"
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: circumference - (clamped / 100) * circumference }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
        />
      </svg>
      <div className="absolute flex flex-col items-center">
        <span className="text-sm font-semibold text-slate-800">{Math.round(clamped)}%</span>
        {label && <span className="text-[10px] text-slate-400">{label}</span>}
      </div>
    </div>
  );
}
