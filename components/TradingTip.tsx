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
    <div className="bg-tc-bg rounded-3xl p-5 mb-6 flex items-start space-x-4 animate-fade-in shadow-sm border border-tc-border-light min-h-28">
      <div className="flex-shrink-0 mt-1 bg-tc-warning/20 p-2 rounded-xl text-tc-warning">
        <LightBulbIcon className="w-5 h-5" />
      </div>
      <div className="flex-1 min-w-0 self-center">
        <p
          className={`text-tc-text text-base italic transition-opacity duration-500 line-clamp-3 ${isFading ? 'opacity-0' : 'opacity-90'}`}
        >
          "{tip}"
        </p>
      </div>
    </div>
  );
};

export default TradingTip;