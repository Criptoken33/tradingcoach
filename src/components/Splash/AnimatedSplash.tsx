import React, { useEffect, useState } from 'react';


const AnimatedSplash: React.FC = () => {
    const [textVisible, setTextVisible] = useState(false);

    useEffect(() => {
        // Delay text appearance slightly for effect
        setTimeout(() => setTextVisible(true), 300);
    }, []);

    return (
        <div className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-[#388656]">
            {/* Text Container with Slide-up Animation */}
            <h1
                className={`text-5xl font-bold font-sans text-white tracking-widest transform transition-all duration-1000 ease-out ${textVisible
                    ? 'opacity-100 translate-y-0 scale-100'
                    : 'opacity-0 translate-y-20 scale-95'
                    }`}
            >
                TradingCoach
            </h1>
        </div>
    );
};

export default AnimatedSplash;
