import toast from 'react-hot-toast';
import { Sparkles } from 'lucide-react';
import { createElement } from 'react';

// A visually distinct toast for AI-generated outcomes, so users can tell
// at a glance which notifications came from Gemini vs. a plain CRUD action.
export function aiToast(message) {
  const dark = document.documentElement.classList.contains('dark');
  toast(message, {
    icon: createElement(Sparkles, { size: 16, className: dark ? 'text-violet-300' : 'text-violet-600' }),
    style: dark
      ? { border: '1px solid #4c1d95', background: '#2e1065', color: '#ddd6fe' }
      : { border: '1px solid #ddd6fe', background: '#f5f3ff', color: '#5b21b6' },
  });
}
