
import React, { useRef, useEffect } from 'react';
import { translations } from '../translations';
import { useAppContext } from '../contexts/AppContext';
import { CopyIcon, FileTextIcon, DownloadIcon } from './icons';
import { useToast } from '../contexts/ToastContext';

interface VideoPromptModalProps {
    isOpen: boolean;
    onClose: () => void;
    prompt: string;
    title?: string; // Added title prop for generic use
    t: (typeof translations)[keyof typeof translations]['ui'];
    filename?: string; // Optional filename to enable download button
}

export const VideoPromptModal: React.FC<VideoPromptModalProps> = ({ isOpen, onClose, prompt, title, t, filename }) => {
    const { showToast } = useToast();
    const modalRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleEsc = (event: KeyboardEvent) => {
            if (event.key === 'Escape') onClose();
        };
        window.addEventListener('keydown', handleEsc);
        return () => window.removeEventListener('keydown', handleEsc);
    }, [onClose]);

    // Focus Trap
    useEffect(() => {
        if (!isOpen) return;
        const modalNode = modalRef.current;
        if (!modalNode) return;
        
        // Try to focus the copy button first for quick access, or the text area
        const copyButton = modalNode.querySelector<HTMLButtonElement>('button[aria-label="Copy"]');
        if (copyButton) {
             copyButton.focus();
        } else {
             const closeButton = modalNode.querySelector<HTMLButtonElement>(`button[aria-label="${t.closeModal}"]`);
             if(closeButton) closeButton.focus();
        }

        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Tab') {
                const focusableElements = modalNode.querySelectorAll<HTMLElement>('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])');
                if (focusableElements.length === 0) return;
                const firstElement = focusableElements[0];
                const lastElement = focusableElements[focusableElements.length - 1];

                if (e.shiftKey) {
                    if (document.activeElement === firstElement) {
                        e.preventDefault();
                        lastElement.focus();
                    }
                } else {
                    if (document.activeElement === lastElement) {
                        e.preventDefault();
                        firstElement.focus();
                    }
                }
            }
        };
        modalNode.addEventListener('keydown', handleKeyDown);
        return () => modalNode.removeEventListener('keydown', handleKeyDown);
    }, [isOpen, t.closeModal]);

    const handleCopy = () => {
        navigator.clipboard.writeText(prompt).then(() => {
            showToast(t.copySuccess, 'success');
        }).catch(() => {
            showToast("Failed to copy automatically. Please select and copy manually.", 'error');
        });
    };

    const handleDownload = () => {
        if (!filename) return;
        const element = document.createElement("a");
        const file = new Blob([prompt], {type: 'text/plain'});
        element.href = URL.createObjectURL(file);
        element.download = filename;
        document.body.appendChild(element);
        element.click();
        document.body.removeChild(element);
        showToast("Downloaded " + filename, 'success');
    };

    if (!isOpen) return null;

    return (
        <div role="dialog" aria-modal="true" className="fixed inset-0 z-[80] flex items-center justify-center p-4">
             <div className="fixed inset-0 backdrop-blur-[8px]" style={{ backgroundColor: 'var(--color-overlay-bg)' }} onClick={onClose}></div>
             <div ref={modalRef} className="relative w-full max-w-4xl h-[85vh] bg-[var(--color-bg-light)] rounded-2xl border border-[var(--color-border)] shadow-2xl flex flex-col animate-reveal">
                <header className="flex items-center justify-between p-4 border-b border-[var(--color-border)] bg-[var(--color-panel)] rounded-t-2xl">
                    <h2 className="text-lg font-bold text-[var(--color-text-primary)] flex items-center gap-2">
                        <FileTextIcon className="w-5 h-5 text-[var(--color-accent-cyan)]" />
                        {title || t.musicVideoConceptTitle}
                    </h2>
                    <button onClick={onClose} className="p-2 text-[var(--color-text-tertiary)] hover:text-[var(--color-text-primary)] rounded-full hover:bg-[var(--color-border)] transition-colors" aria-label={t.closeModal}>
                        <span className="font-bold text-lg leading-none">&times;</span>
                    </button>
                </header>
                <main className="p-4 flex-grow overflow-hidden flex flex-col">
                    <div className="flex-grow relative">
                         <textarea 
                            readOnly 
                            value={prompt} 
                            className="w-full h-full input-screen rounded p-4 text-sm font-mono custom-scrollbar resize-none focus:ring-2 focus:ring-[var(--color-accent-cyan)]" 
                        />
                    </div>
                    <p className="text-xs text-[var(--color-text-tertiary)] mt-2 text-center italic">
                         If the "Copy All" button fails, please manually select the text above and copy (Ctrl+C).
                    </p>
                </main>
                <footer className="p-4 border-t border-[var(--color-border)] flex justify-end gap-3 bg-[var(--color-panel)] rounded-b-2xl">
                    <button onClick={onClose} className="btn btn-secondary">{t.closeModal}</button>
                    {filename && (
                        <button onClick={handleDownload} className="btn btn-secondary flex items-center gap-2">
                            <DownloadIcon className="w-4 h-4" /> Download .SRT
                        </button>
                    )}
                    <button onClick={handleCopy} aria-label="Copy" className="btn btn-primary flex items-center gap-2">
                        <CopyIcon className="w-4 h-4" /> {t.copyAll}
                    </button>
                </footer>
             </div>
        </div>
    );
};
