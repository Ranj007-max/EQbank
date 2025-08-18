import { useCallback } from 'react';

export function useSound(soundUrl: string) {
  const play = useCallback(() => {
    try {
      const audio = new Audio(soundUrl);
      audio.play().catch(e => console.error("Error playing sound:", e));
    } catch (error) {
      console.error("Could not play sound", error);
    }
  }, [soundUrl]);

  return play;
}
