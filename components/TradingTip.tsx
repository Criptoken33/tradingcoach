import React, { useState, useEffect } from 'react';
import { TRADING_TIPS } from '../constants';
import { LightBulbIcon } from './icons';

const TradingTip: React.FC = () => {
  const [tip, setTip] = useState('');
  const [isFading, setIsFading] = useState(false);

  useEffect(() => {
    // Select a random tip only once when the component mounts
    const randomIndex = Math.floor(Math.random() * TRADING_TIPS.length);
    setTip(TRADING_TIPS[randomIndex] || '');
  }, []);

  return (
    <div className="bg-brand-light rounded-3xl p-5 mb-6 flex items-start space-x-4 animate-fade-in shadow-sm border border-brand-border-secondary/50 min-h-28">
      <div className="flex-shrink-0 mt-1 bg-brand-warning-medium/20 p-2 rounded-xl text-brand-warning-medium">
        <LightBulbIcon className="w-5 h-5" />
      </div>
      <div className="flex-1 min-w-0 self-center">
        <p
          className={`text-brand-text body-large italic transition-opacity duration-500 line-clamp-3 ${isFading ? 'opacity-0' : 'opacity-90'}`}
        >
          "{tip}"
        </p>
      </div>
    </div>
  );
};

export default TradingTip;