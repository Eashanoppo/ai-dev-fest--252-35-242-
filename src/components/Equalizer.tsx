import React from 'react';
import { motion } from 'framer-motion';

interface EqualizerProps {
  isSpeaking: boolean;
  className?: string;
}

export const Equalizer: React.FC<EqualizerProps> = ({ isSpeaking, className = '' }) => {
  const bars = [
    { min: 0.3, max: 1.0, duration: 0.45, delay: 0 },
    { min: 0.2, max: 0.85, duration: 0.55, delay: 0.1 },
    { min: 0.4, max: 0.95, duration: 0.4, delay: 0.2 },
    { min: 0.25, max: 0.75, duration: 0.6, delay: 0.05 },
  ];

  return (
    <div className={`inline-flex items-center gap-[2px] h-3.5 ${className}`}>
      {bars.map((bar, idx) => (
        <motion.span
          key={idx}
          className="w-[2.5px] bg-accent-steel rounded-full origin-bottom"
          initial={{ scaleY: 0.3 }}
          animate={
            isSpeaking
              ? {
                  scaleY: [bar.min, bar.max, bar.min],
                }
              : { scaleY: 0.3 }
          }
          transition={
            isSpeaking
              ? {
                  repeat: Infinity,
                  duration: bar.duration,
                  delay: bar.delay,
                  ease: 'easeInOut',
                }
              : { duration: 0.2 }
          }
          style={{ height: '100%' }}
        />
      ))}
    </div>
  );
};
