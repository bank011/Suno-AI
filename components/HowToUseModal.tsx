
import React, { useRef, useEffect, useState } from 'react';
import { translations } from '../translations';
import { useAppContext } from '../contexts/AppContext';
import { XIcon, BookOpenIcon, CheckIcon } from './icons';

interface HowToUseModalProps {
    isOpen: boolean;
    onClose: () => void;
}

const HOW_TO_USE_KEY = 'suno-composer-how-to-use-dismissed';

const parseMarkdown = (text: string) => {
    return text.replace(/\*\*(.*?)\*\*/g, '<strong class="text-[#d946ef] font-bold">$1</strong>');
};

const StepItem: React.FC<{
    title: string;
    description: string;
    delay: string;
    step: string;
}> = ({ title, description, delay, step }) => (
    <div 
        className="animate-fade-in space-y-2" 
        style={{ animationDelay: delay }}
    >
        <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#22d3ee] to-[#d946ef] flex items-center justify-center flex-shrink-0 shadow-lg">
                <span className="text-sm font-bold text-white">{step}</span>
            </div>
            <h4 className="font-bold text-[var(--color-primary-brand)] text-lg tracking-tight">
                {title}
            </h4>
        </div>
        
        <div className="pl-11 pr-4">
            <div 
                className="text-sm text-[var(--color-text-secondary)] leading-relaxed space-y-1 whitespace-pre-line"
                dangerouslySetInnerHTML={{ __html: parseMarkdown(description) }}
            />
        </div>
    </div>
);

const HowToUseModal: React.FC<HowToUseModalProps> = ({ isOpen, onClose }) => {
    const { language } = useAppContext();
    const t = translations[language].ui;
    const modalRef = useRef<HTMLDivElement>(null);
    const [dontShowToday, setDontShowToday] = useState(false);

    useEffect(() => {
        const handleEscape = (e: KeyboardEvent) => {
            if (e.key === 'Escape') onClose();
        };
        if (isOpen) {
            window.addEventListener('keydown', handleEscape);
            document.body.style.overflow = 'hidden';
        }
        return () => {
            window.removeEventListener('keydown', handleEscape);
            document.body.style.overflow = 'unset';
        };
    }, [isOpen, onClose]);

    const handleConfirm = () => {
        if (dontShowToday) {
            const today = new Date().toDateString();
            localStorage.setItem(HOW_TO_USE_KEY, today);
        }
        onClose();
    };

    if (!isOpen) return null;

    return (
        <div 
            role="dialog"
            aria-modal="true"
            aria-labelledby="how-to-use-title"
            className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in"
        >
            <div className="fixed inset-0" onClick={onClose}></div>

            <div 
                ref={modalRef}
                className="relative w-full max-w-2xl bg-[var(--color-panel)] rounded-2xl border border-[var(--color-border)] flex flex-col animate-reveal overflow-hidden shadow-2xl"
                onClick={e => e.stopPropagation()}
            >
                {/* Header */}
                <header className="flex-shrink-0 p-5 border-b border-[var(--color-border)] flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <BookOpenIcon className="w-6 h-6 text-[var(--color-primary-brand)]" />
                        <h2 id="how-to-use-title" className="text-xl font-bold text-[var(--color-text-primary)] tracking-tight">
                            {t.howToUseModalTitle}
                        </h2>
                    </div>
                    <button 
                        onClick={onClose} 
                        className="p-1.5 text-[var(--color-text-tertiary)] hover:text-[var(--color-text-primary)] transition-colors" 
                        aria-label={t.howToUseClose}
                    >
                        <XIcon className="w-6 h-6" />
                    </button>
                </header>
                
                <main className="flex-grow overflow-y-auto custom-scrollbar p-6 sm:p-8 space-y-8 max-h-[60vh]">
                    <StepItem 
                        step="1"
                        title={t.howToUseStep1Title}
                        description={t.howToUseStep1Desc}
                        delay="0ms"
                    />
                    <StepItem 
                        step="2"
                        title={t.howToUseStep2Title}
                        description={t.howToUseStep2Desc}
                        delay="100ms"
                    />
                    <StepItem 
                        step="3"
                        title={t.howToUseStep3Title}
                        description={t.howToUseStep3Desc}
                        delay="200ms"
                    />
                    <StepItem 
                        step="4"
                        title={t.howToUseStep4Title}
                        description={t.howToUseStep4Desc}
                        delay="300ms"
                    />
                    <StepItem 
                        step="5"
                        title={t.howToUseStep5Title}
                        description={t.howToUseStep5Desc}
                        delay="400ms"
                    />

                    {/* Pro Tip */}
                    <div className="pl-11 pr-4 pt-4 border-t border-[var(--color-border)]">
                        <p className="text-xs text-[var(--color-primary-brand)] font-bold uppercase tracking-widest mb-2">Pro Tip</p>
                        <p className="text-sm text-[var(--color-text-secondary)] italic leading-relaxed">
                            {t.howToUseProTip}
                        </p>
                    </div>
                </main>

                <footer className="flex-shrink-0 p-5 border-t border-[var(--color-border)] bg-[var(--color-bg-light)]/30 flex items-center justify-between gap-4">
                    <label className="flex items-center gap-3 cursor-pointer group">
                        <div className="relative">
                            <input 
                                type="checkbox" 
                                className="sr-only peer"
                                checked={dontShowToday}
                                onChange={(e) => setDontShowToday(e.target.checked)}
                            />
                            <div className="w-5 h-5 border border-[var(--color-border)] rounded transition-all peer-checked:bg-[var(--color-primary-brand)] peer-checked:border-[var(--color-primary-brand)] group-hover:border-[var(--color-primary-brand)]"></div>
                            <CheckIcon className="absolute inset-0 w-5 h-5 text-white scale-0 transition-transform duration-300 peer-checked:scale-100 p-1" />
                        </div>
                        <span className="text-sm text-[var(--color-text-secondary)] group-hover:text-[var(--color-text-primary)] transition-colors">
                            {t.howToUseDontShowToday}
                        </span>
                    </label>
                    
                    <button 
                        onClick={handleConfirm} 
                        className="px-8 py-2.5 bg-[var(--color-border)] hover:bg-[var(--color-bg-light)] text-[var(--color-text-primary)] font-bold rounded-lg transition-all active:scale-95 shadow-lg border border-transparent hover:border-[var(--color-primary-brand)]"
                    >
                        {t.howToUseGotIt}
                    </button>
                </footer>
            </div>
        </div>
    );
};

export default HowToUseModal;
