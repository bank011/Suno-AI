import React from 'react';

export const LoadingWaveform: React.FC = () => {
    return (
        <div className="flex flex-col items-center justify-center w-full py-8">
            <div className="flex items-center justify-center gap-1.5 h-24 sm:h-32">
                {[...Array(15)].map((_, i) => (
                    <div
                        key={i}
                        className="w-1.5 sm:w-2 bg-gradient-to-t from-[var(--color-primary-brand)] to-[var(--color-accent-cyan)] rounded-full animate-wave shadow-[0_0_10px_var(--color-primary-brand)]"
                        style={{
                            animationDelay: `${i * 0.1}s`,
                            animationDuration: '1.2s'
                        }}
                    />
                ))}
            </div>
            
            <style>{`
                @keyframes wave {
                    0%, 100% { 
                        height: 20%; 
                        opacity: 0.4;
                    }
                    50% { 
                        height: 80%; 
                        opacity: 1;
                        box-shadow: 0 0 15px var(--color-accent-cyan);
                    }
                }
                .animate-wave {
                    animation: wave 1.2s ease-in-out infinite;
                }
            `}</style>
        </div>
    );
};
