import { motion } from 'framer-motion';

// Wraps freshly-loaded content with a gentle fade+rise so the
// skeleton-to-content swap doesn't feel like an abrupt hard cut.
export default function FadeIn({ children, className = '', delay = 0 }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, delay }}
      className={className}
    >
      {children}
    </motion.div>
  );
}
