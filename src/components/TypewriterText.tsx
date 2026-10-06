import React, { useEffect, useState } from 'react';

interface TypewriterTextProps {
  text: string;
  speed?: number; // ms per character
  onComplete?: () => void;
  className?: string;
  showCursor?: boolean;
}

export const TypewriterText: React.FC<TypewriterTextProps> = ({
  text,
  speed = 12,
  onComplete,
  className = '',
  showCursor = true,
}) => {
  const [displayedLength, setDisplayedLength] = useState(0);

  useEffect(() => {
    // If reduced motion is requested, show immediately
    if (typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setDisplayedLength(text.length);
      onComplete?.();
      return;
    }

    setDisplayedLength(0);
    let index = 0;

    const interval = setInterval(() => {
      index += 2; // advance 2 chars per tick for smooth pace
      if (index >= text.length) {
        setDisplayedLength(text.length);
        clearInterval(interval);
        onComplete?.();
      } else {
        setDisplayedLength(index);
      }
    }, speed);

    return () => clearInterval(interval);
  }, [text, speed, onComplete]);

  const isFinished = displayedLength >= text.length;

  return (
    <span className={className}>
      {text.slice(0, displayedLength)}
      {showCursor && !isFinished && (
        <span className="inline-block w-1.5 h-3.5 ml-0.5 bg-accent-steel animate-pulse align-middle" />
      )}
    </span>
  );
};
