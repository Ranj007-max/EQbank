import React, { useState, useEffect } from 'react';
import { Timer as TimerIcon } from 'lucide-react';

interface TimerProps {
  initialSeconds: number;
  onTimeUp: () => void;
  isPaused: boolean;
}

const Timer: React.FC<TimerProps> = ({ initialSeconds, onTimeUp, isPaused }) => {
  const [seconds, setSeconds] = useState(initialSeconds);

  useEffect(() => {
    if (isPaused) return;

    if (seconds <= 0) {
      onTimeUp();
      return;
    }

    const intervalId = setInterval(() => {
      setSeconds(prev => prev - 1);
    }, 1000);

    return () => clearInterval(intervalId);
  }, [seconds, onTimeUp, isPaused]);
  
  const formatTime = () => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  return (
    <div className="flex items-center gap-2 font-mono text-lg font-semibold bg-muted text-muted-foreground px-3 py-1 rounded-md">
      <TimerIcon size={18} />
      <span>{formatTime()}</span>
    </div>
  );
};

export default Timer;