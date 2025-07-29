import React, { useState, useEffect } from 'react';
import { CountdownData } from '../types';

interface CountdownTimerProps {
  targetDate: Date;
  onComplete?: () => void;
  className?: string;
}

const CountdownTimer: React.FC<CountdownTimerProps> = ({ 
  targetDate, 
  onComplete, 
  className = "" 
}) => {
  const [timeLeft, setTimeLeft] = useState<CountdownData>({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0
  });

  useEffect(() => {
    const calculateTimeLeft = () => {
      const difference = targetDate.getTime() - new Date().getTime();
      
      if (difference > 0) {
        const days = Math.floor(difference / (1000 * 60 * 60 * 24));
        const hours = Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((difference % (1000 * 60)) / 1000);

        setTimeLeft({ days, hours, minutes, seconds });
      } else {
        setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0 });
        if (onComplete) {
          onComplete();
        }
      }
    };

    calculateTimeLeft();
    const timer = setInterval(calculateTimeLeft, 1000);

    return () => clearInterval(timer);
  }, [targetDate, onComplete]);

  const formatNumber = (num: number) => num.toString().padStart(2, '0');

  return (
    <div className={`inline-flex items-center space-x-1 font-mono ${className}`}>
      <span>{formatNumber(timeLeft.days)}d</span>
      <span>:</span>
      <span>{formatNumber(timeLeft.hours)}h</span>
      <span>:</span>
      <span>{formatNumber(timeLeft.minutes)}m</span>
      <span>:</span>
      <span>{formatNumber(timeLeft.seconds)}s</span>
    </div>
  );
};

export default CountdownTimer; 