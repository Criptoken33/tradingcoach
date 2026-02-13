import React, { useState, useEffect } from 'react';
import { TRADING_TIPS } from '../constants';
import { LightBulbIcon } from './icons';

const TradingTip: React.FC = () => {
  const [tip, setTip] = useState('');

  useEffect(() => {
    // Select a random tip only once when the component mounts
    const randomIndex = Math.floor(Math.random() * TRADING_TIPS.length);
    setTip(TRADING_TIPS[randomIndex] || '');
  }, []);

  return (
    <div className="relative overflow-hidden bg-tc-bg-secondary/30 backdrop-blur-md rounded-3xl p-6 mb-8 border border-tc-border-light shadow-sm group">
      {/* Decorative background element */}
      <div className="absolute -right-4 -top-4 w-24 h-24 bg-tc-warning/5 rounded-full blur-2xl group-hover:bg-tc-warning/10 transition-colors duration-700" />

      <div className="relative z-10">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-[10px] font-bold text-tc-warning uppercase tracking-widest px-2 py-0.5 bg-tc-warning/10 rounded-full border border-tc-warning/20">
              Consejo del Día
            </span>
          </div>
          <p className="text-tc-text text-base sm:text-lg italic font-medium leading-relaxed opacity-90 pr-4">
            "{tip}"
          </p>
        </div>
      </div>

      <div className="absolute bottom-0 right-0 p-4 opacity-10 pointer-events-none">
        <LightBulbIcon className="w-12 h-12 rotate-12" />
      </div>
    </div>
  );
};

export default TradingTip;