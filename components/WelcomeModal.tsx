
import React, { useRef, useEffect } from 'react';
import { translations } from '../translations';
import { useAppContext } from '../contexts/AppContext';
import { KeyIcon, WandSparklesIcon, MusicNotesIcon, Settings2Icon, PlayIcon, SparklesIcon, TargetIcon, MessageSquareIcon, XIcon, CpuChipIcon, GlobeIcon, ImageIcon } from './icons';

interface WelcomeModalProps {}

// Helper to parse bold markdown (**text**) to HTML
const parseMarkdown = (text: string) => {
    return text.replace(/\*\*(.*?)\*\*/g, '<strong class="text-[var(--color-accent-cyan)] font-bold">$1</strong>');
};

const StepItem: React.FC<{
    icon: React.ReactNode;
    step: string;
    title: string;
    description: string;
    delay: string;
}> = ({ icon, step, title, description, delay }) => (
    <div className="flex gap-4 animate-fade-in items-start p-3 sm:p-4 rounded-xl bg-[var(--color-bg)]/40 border border-[var(--color-border)] hover:border-[var(--color-primary-brand)]/50 transition-all duration-300 hover:bg-[var(--color-bg)]/80 group" style={{ animationDelay: delay }}>
        <div className="flex-shrink-0 relative">
            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-[var(--color-bg-light)] border border-[var(--color-border)] flex items-center justify-center text-[var(--color-text-secondary)] group-hover:text-[var(--color-primary-brand)] transition-all">
                {icon}
            </div>
            <div className="absolute -top-2 -right-2 w-5 h-5 rounded-full bg-[var(--color-panel)] border border-[var(--color-border)] flex items-center justify-center">
                <span className="text-[9px] font-black text-[var(--color-text-tertiary)]">{step}</span>
            </div>
        </div>
        <div className="flex-1 min-w-0 pt-1">
            <h4 className="font-bold text-[var(--color-text-primary)] text-sm mb-1 group-hover:text-[var(--color-accent-cyan)] transition-colors">{title}</h4>
            <p className="text-xs text-[var(--color-text-secondary)] leading-relaxed opacity-90" dangerouslySetInnerHTML={{ __html: parseMarkdown(description) }} />
        </div>
    </div>
);

const FeatureCard: React.FC<{
    icon: React.ReactNode;
    title: string;
    desc: string;
    colorClass: string;
}> = ({ icon, title, desc, colorClass }) => (
    <div className="flex flex-col p-3 sm:p-4 bg-[var(--color-bg)]/30 rounded-xl border border-[var(--color-border)] hover:border-[var(--color-border-highlight)] transition-all hover:bg-[var(--color-bg)]/60 h-full group">
        <div className={`mb-3 w-fit p-2 rounded-lg bg-[var(--color-bg)] border border-[var(--color-border)] ${colorClass} group-hover:scale-110 transition-transform duration-300`}>
            {icon}
        </div>
        <h4 className="text-xs font-bold uppercase tracking-wider text-[var(--color-text-primary)] mb-2">{title}</h4>
        <p className="text-[11px] text-[var(--color-text-secondary)] leading-relaxed">{desc}</p>
    </div>
);

const WelcomeModal: React.FC<WelcomeModalProps> = () => {
    const { isWelcomeModalOpen, handleCloseWelcomeModal, language } = useAppContext();
    const t = translations[language].ui;
    const modalRef = useRef<HTMLDivElement>(null);

    // Focus Trap
    useEffect(() => {
        if (!isWelcomeModalOpen) return;
        
        const modalNode = modalRef.current;
        if (!modalNode) return;

        const focusableElements = modalNode.querySelectorAll<HTMLElement>(
            'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );
        if (focusableElements.length === 0) return;

        const firstElement = focusableElements[0];
        const lastElement = focusableElements[focusableElements.length - 1];

        const closeButton = modalNode.querySelector<HTMLButtonElement>(`button[aria-label="${t.closeModal}"]`);
        (closeButton || firstElement).focus();
        
        const handleKeyDown = (e: KeyboardEvent) => {
            if (!modalRef.current) return;
            if (e.key === 'Tab') {
                if (!e.shiftKey && document.activeElement === lastElement) {
                    e.preventDefault();
                    firstElement.focus();
                }
                if (e.shiftKey && document.activeElement === firstElement) {
                    e.preventDefault();
                    lastElement.focus();
                }
            }
        };

        document.addEventListener('keydown', handleKeyDown);
        return () => document.removeEventListener('keydown', handleKeyDown);
    }, [isWelcomeModalOpen, t.closeModal]);
    
    if (!isWelcomeModalOpen) return null;

    return (
        <div 
            role="dialog"
            aria-modal="true"
            aria-labelledby="welcome-modal-title"
            className="fixed inset-0 z-[100] flex items-center justify-center sm:p-6"
        >
            <div className="fixed inset-0 backdrop-blur-[20px] bg-[var(--color-overlay-bg)] animate-fade-in" onClick={handleCloseWelcomeModal}></div>

            <div 
                ref={modalRef}
                className="relative w-full h-[100dvh] sm:h-auto sm:max-w-5xl sm:max-h-[90dvh] bg-[var(--color-bg-light)] sm:rounded-2xl border-0 sm:border border-[var(--color-border)] flex flex-col animate-reveal overflow-hidden"
                onClick={e => e.stopPropagation()}
            >
                {/* Decorative Background Elements (Hidden on mobile for performance/readability) */}
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-[var(--color-accent-cyan)] via-[var(--color-primary-brand)] to-[var(--color-active)] z-20"></div>
                <div className="hidden sm:block absolute -top-[200px] -right-[200px] w-[500px] h-[500px] bg-[var(--color-primary-brand)] rounded-full blur-[150px] opacity-10 pointer-events-none z-0"></div>
                <div className="hidden sm:block absolute -bottom-[200px] -left-[200px] w-[500px] h-[500px] bg-[var(--color-accent-cyan)] rounded-full blur-[150px] opacity-5 pointer-events-none z-0"></div>

                {/* Header */}
                <header className="flex-shrink-0 p-4 sm:p-8 border-b border-[var(--color-border)] bg-[var(--color-panel)]/95 backdrop-blur-md relative z-10 pt-safe-top">
                    <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-3 mb-2">
                                <div className="p-2 bg-[var(--color-primary-brand)] rounded-lg">
                                    <SparklesIcon className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                                </div>
                                <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-[var(--color-accent-cyan)] bg-[var(--color-accent-cyan)]/10 px-2 py-1 rounded border border-[var(--color-accent-cyan)]/20">
                                    AI Studio v1.0
                                </span>
                            </div>
                            <h2 id="welcome-modal-title" className="text-xl sm:text-3xl font-black rgb-text mb-2">
                                {t.welcomeModalTitle}
                            </h2>
                            <p className="text-xs sm:text-sm text-[var(--color-text-secondary)] max-w-2xl leading-relaxed">
                                {t.welcomeIntro}
                            </p>
                        </div>
                        <button 
                            onClick={handleCloseWelcomeModal} 
                            className="flex-shrink-0 p-2 text-[var(--color-text-tertiary)] rounded-full hover:bg-[var(--color-border)] hover:text-[var(--color-text-primary)] transition-colors" 
                            aria-label={t.closeModal}
                        >
                            <XIcon className="w-6 h-6" />
                        </button>
                    </div>
                </header>
                
                <main className="flex-grow overflow-y-auto custom-scrollbar relative z-10 bg-[var(--color-bg)]/50 pb-safe-bottom">
                    <div className="p-4 sm:p-8 grid grid-cols-1 lg:grid-cols-12 gap-6 sm:gap-8">
                        
                        {/* Left Column: Workflow Guide */}
                        <div className="lg:col-span-7 space-y-4 sm:space-y-6">
                            <div className="flex items-center gap-2 mb-2 sticky top-0 bg-[var(--color-bg-light)]/90 backdrop-blur z-20 py-2 sm:static sm:bg-transparent sm:py-0">
                                <span className="w-1 h-4 bg-[var(--color-primary-brand)] rounded-full"></span>
                                <h3 className="text-sm font-bold uppercase tracking-widest text-[var(--color-text-secondary)]">Workflow</h3>
                            </div>
                            
                            <div className="space-y-3">
                                <StepItem 
                                    icon={<KeyIcon className="w-5 h-5" />}
                                    step="01"
                                    title={t.welcomeStep1Title}
                                    description={t.welcomeStep1Desc}
                                    delay="100ms"
                                />
                                <StepItem 
                                    icon={<WandSparklesIcon className="w-5 h-5" />}
                                    step="02"
                                    title={t.welcomeStep2Title}
                                    description={t.welcomeStep2Desc}
                                    delay="200ms"
                                />
                                <StepItem 
                                    icon={<MusicNotesIcon className="w-5 h-5" />}
                                    step="03"
                                    title={t.welcomeStep3Title}
                                    description={t.welcomeStep3Desc}
                                    delay="300ms"
                                />
                                <StepItem 
                                    icon={<Settings2Icon className="w-5 h-5" />}
                                    step="04"
                                    title={t.welcomeStep4Title}
                                    description={t.welcomeStep4Desc}
                                    delay="400ms"
                                />
                                <StepItem 
                                    icon={<PlayIcon className="w-5 h-5" />}
                                    step="05"
                                    title={t.welcomeStep5Title}
                                    description={t.welcomeStep5Desc}
                                    delay="500ms"
                                />
                            </div>
                        </div>

                        {/* Right Column: System Capabilities */}
                        <div className="lg:col-span-5 space-y-4 sm:space-y-6">
                            <div className="flex items-center gap-2 mb-2 sticky top-0 bg-[var(--color-bg-light)]/90 backdrop-blur z-20 py-2 sm:static sm:bg-transparent sm:py-0">
                                <span className="w-1 h-4 bg-[var(--color-accent-cyan)] rounded-full"></span>
                                <h3 className="text-sm font-bold uppercase tracking-widest text-[var(--color-text-secondary)]">Capabilities</h3>
                            </div>

                            <div className="grid grid-cols-2 gap-3 sm:gap-4">
                                <FeatureCard 
                                    icon={<PlayIcon className="w-5 h-5" />}
                                    title={t.welcomeFeature1}
                                    desc={t.welcomeFeature1Desc}
                                    colorClass="text-[var(--color-accent-cyan)] border-[var(--color-accent-cyan)]/20 bg-[var(--color-accent-cyan)]/5"
                                />
                                <FeatureCard 
                                    icon={<TargetIcon className="w-5 h-5" />}
                                    title={t.welcomeFeature2}
                                    desc={t.welcomeFeature2Desc}
                                    colorClass="text-[var(--color-primary-brand)] border-[var(--color-primary-brand)]/20 bg-[var(--color-primary-brand)]/5"
                                />
                                <FeatureCard 
                                    icon={<GlobeIcon className="w-5 h-5" />}
                                    title="Global Styles"
                                    desc="Translates Thai/Asian genres to English tags."
                                    colorClass="text-green-400 border-green-500/20 bg-green-500/5"
                                />
                                <FeatureCard 
                                    icon={<ImageIcon className="w-5 h-5" />}
                                    title="Art & Video"
                                    desc="Generates prompts for Album Covers and MV concepts."
                                    colorClass="text-yellow-400 border-yellow-500/20 bg-yellow-500/5"
                                />
                            </div>

                            {/* Pro Tip Box */}
                            <div className="p-4 sm:p-5 mt-6 rounded-xl bg-[var(--color-selected-bg)] border border-[var(--color-border)] relative overflow-hidden group">
                                <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:opacity-20 transition-opacity">
                                    <CpuChipIcon className="w-24 h-24 rotate-12" />
                                </div>
                                <div className="relative z-10">
                                    <h4 className="text-xs font-bold text-[var(--color-accent-cyan)] uppercase tracking-wider mb-2 flex items-center gap-2">
                                        <SparklesIcon className="w-3 h-3" />
                                        Pro Tip: Auto Mode
                                    </h4>
                                    <p className="text-xs text-[var(--color-text-secondary)] leading-relaxed">
                                        Enable <strong>Suno Auto Mode</strong> to let our algorithm calculate the perfect <em>Weirdness</em> and <em>Style Influence</em> based on your genre selection.
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </main>

                <footer className="flex-shrink-0 p-4 sm:p-6 border-t border-[var(--color-border)] bg-[var(--color-panel)]/90 backdrop-blur relative z-20 pb-safe-bottom">
                    <button 
                        onClick={handleCloseWelcomeModal} 
                        className="btn btn-primary w-full !py-3 sm:!py-4 !text-sm sm:!text-lg font-black tracking-widest btn-neon-flow uppercase"
                    >
                        {t.welcomeModalGotItButton}
                    </button>
                </footer>
            </div>
        </div>
    );
};

export default WelcomeModal;
