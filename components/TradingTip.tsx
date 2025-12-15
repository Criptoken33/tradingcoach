import React, { useState, useEffect } from 'react';
import { TRADING_TIPS } from '../constants';
import { LightBulbIcon } from './icons';

const TradingTip: React.FC = () => {
  const [tip, setTip] = useState('');
  const [isFading, setIsFading] = useState(false);

  useEffect(() => {
    // Helper to select a new tip that is different from the current one
    const selectNewTip = (currentTip: string) => {
      let newTip;
      if (TRADING_TIPS.length <= 1) return TRADING_TIPS[0] || '';
      do {
        const randomIndex = Math.floor(Math.random() * TRADING_TIPS.length);
        newTip = TRADING_TIPS[randomIndex];
      } while (newTip === currentTip);
      return newTip;
    };

    // Set initial tip
    setTip(selectNewTip(''));

    // Interval to cycle through tips
    const intervalId = setInterval(() => {
      setIsFading(true);
      setTimeout(() => {
        setTip(prevTip => selectNewTip(prevTip));
        setIsFading(false);
      }, 500); // Corresponds to fade-out duration
    }, 15000); // Change tip every 15 seconds

    return () => clearInterval(intervalId); // Cleanup on unmount
  }, []);

  return (
    <div className="bg-brand-light rounded-3xl p-5 mb-6 flex items-start space-x-4 animate-fade-in shadow-sm border border-brand-border-secondary/50 min-h-28">
      <div className="flex-shrink-0 mt-1 bg-brand-warning-medium/20 p-2 rounded-xl text-brand-warning-medium">
        <LightBulbIcon className="w-5 h-5" />
      </div>
      <div className="flex-1 min-w-0 self-center">
        <p 
          className={`text-brand-text text-sm font-medium italic transition-opacity duration-500 line-clamp-3 ${isFading ? 'opacity-0' : 'opacity-90'}`}
        >
          "{tip}"
        </p>
      </div>
    </div>
  );
};

export default TradingTip;