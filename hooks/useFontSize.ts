import { useState, useEffect, useCallback } from 'react';

const FONT_SIZE_STEP = 0.1;
const MIN_FONT_SIZE = 1.0;
const MAX_FONT_SIZE = 2.0;

export function useFontSize() {
  const [fontSize, setFontSize] = useState(1.0);

  useEffect(() => {
    const storedSize = localStorage.getItem('fontSize');
    if (storedSize) {
      setFontSize(parseFloat(storedSize));
    }
  }, []);

  useEffect(() => {
    const root = window.document.documentElement;
    root.style.setProperty('--font-size-multiplier', `${fontSize}`);
    localStorage.setItem('fontSize', `${fontSize}`);
  }, [fontSize]);

  const increaseFontSize = useCallback(() => {
    setFontSize(prevSize => Math.min(MAX_FONT_SIZE, prevSize + FONT_SIZE_STEP));
  }, []);

  const decreaseFontSize = useCallback(() => {
    setFontSize(prevSize => Math.max(MIN_FONT_SIZE, prevSize - FONT_SIZE_STEP));
  }, []);

  return { fontSize, increaseFontSize, decreaseFontSize };
}
