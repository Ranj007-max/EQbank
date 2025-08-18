import React, { useState, useEffect } from 'react';
import { Timer as TimerIcon } from 'lucide-react';
import { cn } from '../lib/utils';

interface TimerProps {
  initialSeconds: number;
  onTimeUp: () => void;
  isPaused: boolean;
  className?: string;
}

const Timer: React.FC<TimerProps> = ({ initialSeconds, onTimeUp, isPaused, className }) => {
  const [seconds, setSeconds] = useState(initialSeconds);
  const isLowTime = seconds < initialSeconds * 0.1;

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
    <div className={cn("flex items-center gap-1 font-mono", className, isLowTime && "animate-warning-flash text-destructive")}>
      <TimerIcon size={16} className="mr-1" />
      <span>{formatTime()}</span>
    </div>
  );
};

export default Timer;