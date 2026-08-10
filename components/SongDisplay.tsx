
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { 
    CopyIcon, 
    Settings2Icon, CpuChipIcon, DownloadIcon, FileTextIcon
} from './icons';
import { translations, type Language } from '../translations';
import { useAppContext } from '../contexts/AppContext';
import { useToast } from '../contexts/ToastContext';
import { generateLyricsSRT, generateYouTubeDescription, reviseSong, RateLimitError } from '../geminiService';
import { VideoPromptModal } from './VideoPromptModal';
import RevisionModal from './RevisionModal';
import { LoadingWaveform } from './LoadingWaveform';
import type { FormState } from '../types';
import { calculateAutoMetrics } from '../utils';

interface SongDisplayProps {
  songData: string | null;
  isLoading: boolean;
  songStructure: string[];
  inputs: FormState | null;
}

const createDynamicRegex = (getLabel: (t: (typeof translations)[keyof typeof translations]) => string): RegExp => {
    // Escape special characters and join labels
    const labels = Object.values(translations).map(t => getLabel(t).slice(0, -1).replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|');
    // Robust regex to handle optional Markdown asterisks around labels (e.g., **Style:** or **Style**: )
    return new RegExp(`^\\s*[\\*]*(${labels})[\\*]*\\s*:\\s*(.*)`, 'm');
};

const TITLE_REGEX = createDynamicRegex(t => t.prompts.label_song_title);
const STYLE_REGEX = createDynamicRegex(t => t.prompts.label_style);
const LYRICS_HEADER_REGEX = createDynamicRegex(t => t.prompts.label_lyrics);

// Helper to clean markdown bold/italics from extracted text
const cleanMarkdown = (text: string) => text.replace(/\*/g, '').trim();

export const SongDisplay: React.FC<SongDisplayProps> = ({ 
    songData, 
    isLoading, 
    songStructure, 
    inputs 
}) => {
    const { language, openBugReportModal } = useAppContext();
    const { showToast } = useToast();
    const t = translations[language].ui;

    const [parsedSong, setParsedSong] = useState<{ title: string; style: string; lyrics: string } | null>(null);
    const [isRevisionModalOpen, setIsRevisionModalOpen] = useState(false);
    const [isGeneratingSRT, setIsGeneratingSRT] = useState(false);
    const [isGeneratingYT, setIsGeneratingYT] = useState(false);
    
    // Generic Prompt Result Modal State (Used for both Video and Image results)
    const [isPromptResultModalOpen, setIsPromptResultModalOpen] = useState(false);
    const [promptResultContent, setPromptResultContent] = useState<string>('');
    const [promptResultTitle, setPromptResultTitle] = useState<string>('');
    const [promptResultFilename, setPromptResultFilename] = useState<string | undefined>(undefined);

    const [isRevising, setIsRevising] = useState(false);
    
    // Metrics Calculation
    const metrics = useMemo(() => {
        if (!inputs) return { weirdness: 50, influence: 50 };
        return calculateAutoMetrics(inputs.selectedGenre, inputs.selectedMood, parsedSong?.lyrics || '', inputs.prompt || inputs.coreTheme || '');
    }, [inputs, parsedSong?.lyrics]);

    useEffect(() => {
        if (songData) {
            const titleMatch = songData.match(TITLE_REGEX);
            const styleMatch = songData.match(STYLE_REGEX);
            
            const lyricsHeaderMatch = songData.match(LYRICS_HEADER_REGEX);
            let lyrics = '';
            
            if (lyricsHeaderMatch && lyricsHeaderMatch.index !== undefined) {
                lyrics = songData.substring(lyricsHeaderMatch.index + lyricsHeaderMatch[0].length).trim();
            } else {
                // Fallback if no lyrics header found, look for first bracketed section
                const firstSectionIndex = songData.search(/\[.*\]/);
                if (firstSectionIndex !== -1) {
                    lyrics = songData.substring(firstSectionIndex).trim();
                } else {
                    lyrics = songData; // Fallback to everything if structure is weird
                }
            }
            
            setParsedSong({
                title: titleMatch ? cleanMarkdown(titleMatch[2]) : 'Untitled',
                style: styleMatch ? cleanMarkdown(styleMatch[2]) : 'Unknown Style',
                lyrics: lyrics
            });
        } else {
            setParsedSong(null);
        }
    }, [songData, language]); // Re-parse if language changes (regexes change)

    const handleCopy = (text: string, label: string) => {
        navigator.clipboard.writeText(text);
        showToast(`${label} ${t.copySuccess}`, 'success');
    };
    
    const handleDownload = () => {
        if (!parsedSong) return;
        const element = document.createElement("a");
        const file = new Blob([songData || ''], {type: 'text/plain'});
        element.href = URL.createObjectURL(file);
        element.download = `${parsedSong.title.replace(/[^a-z0-9]/gi, '_')}_lyrics.txt`;
        document.body.appendChild(element);
        element.click();
        document.body.removeChild(element);
    };

    const handleSRTGenerate = async () => {
        if (!songData || !inputs) return;
        setIsGeneratingSRT(true);
        try {
            const activeApiKey = localStorage.getItem('suno-composer-active-api-key');
            if (!activeApiKey) throw new Error("No API Key");

            const srtContent = await generateLyricsSRT(songData, inputs, language, activeApiKey);
            
            setPromptResultContent(srtContent);
            setPromptResultTitle(t.srtModalTitle);
            setPromptResultFilename(`${parsedSong?.title.replace(/[^a-z0-9]/gi, '_') || 'song'}.srt`);
            setIsPromptResultModalOpen(true);
        } catch (error) {
             console.error("SRT generation failed:", error);
             showToast("Failed to generate SRT subtitles", 'error');
        } finally {
            setIsGeneratingSRT(false);
        }
    };

    const handleYouTubeGenerate = async () => {
        if (!songData || !inputs) return;
        setIsGeneratingYT(true);
        try {
            const activeApiKey = localStorage.getItem('suno-composer-active-api-key');
            if (!activeApiKey) throw new Error("No API Key");

            const description = await generateYouTubeDescription(songData, inputs, language, activeApiKey);
            
            setPromptResultContent(description);
            setPromptResultTitle(t.youtubeDescModalTitle);
            setPromptResultFilename(undefined);
            setIsPromptResultModalOpen(true);
        } catch (error) {
             console.error("YouTube description failed:", error);
             showToast("Failed to generate YouTube description", 'error');
        } finally {
            setIsGeneratingYT(false);
        }
    };

    const handleRevisionSubmit = async (request: string) => {
        if (!parsedSong || !songData) return;
        setIsRevising(true);
        try {
            const activeApiKey = localStorage.getItem('suno-composer-active-api-key');
            if (!activeApiKey) throw new Error("No API Key");

            const revisedSong = await reviseSong(songData, request, inputs?.selectedModel || 'gemini-3.1-pro-preview', language, activeApiKey);
            
            // Copy usually works here because it's triggered by a direct submit click in the modal
            navigator.clipboard.writeText(revisedSong).then(() => {
                 showToast("Revised song copied to clipboard! (Paste to replace)", 'success');
            }).catch(() => {
                 showToast("Revision complete! Please copy manually if needed.", 'info');
            });
           
            setIsRevisionModalOpen(false);
            
        } catch (error) {
            handleError(error);
        } finally {
            setIsRevising(false);
        }
    };

    const handleError = (error: unknown) => {
        const msg = error instanceof Error ? error.message : t.errorUnknown;
        if (error instanceof RateLimitError) {
             showToast(msg, 'error');
        } else {
             showToast(msg, 'error');
        }
    };

    if (isLoading) {
        return (
            <div className="w-full py-12 flex flex-col items-center justify-center text-center space-y-6">
                <LoadingWaveform />
                <div className="space-y-2 animate-pulse-slow">
                    <h3 className="text-lg font-bold text-[var(--color-text-primary)]">{t.loadingMessages[0]}</h3>
                    <p className="text-sm text-[var(--color-text-tertiary)]">Powered by Gemini 3.1 Pro Preview</p>
                </div>
            </div>
        );
    }

    if (!songData || !parsedSong) {
        return (
            <div className="w-full py-12 flex flex-col items-center justify-center text-center border-2 border-dashed border-[var(--color-border)] rounded-xl bg-[var(--color-bg-light)]/50">
                <h3 className="text-lg font-bold text-[var(--color-text-secondary)]">{t.displayPlaceholder1}</h3>
                <p className="text-sm text-[var(--color-text-tertiary)]">{t.displayPlaceholder2}</p>
            </div>
        );
    }

    return (
        <div className="w-full space-y-6 animate-fade-in">
            {/* Header Card */}
            <div className="glass-panel-pro p-4 sm:p-6 rounded-xl border border-[var(--color-border)] relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-[var(--color-primary-brand)] to-transparent opacity-5 blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none"></div>
                
                <div className="relative z-10 flex flex-col md:flex-row gap-6 justify-between items-start">
                    <div className="space-y-4 flex-grow min-w-0 w-full">
                        <div>
                            <div className="flex items-center gap-2 text-[var(--color-text-tertiary)] text-sm font-bold uppercase tracking-widest mb-1">
                                <span>Title</span>
                            </div>
                            <h2 className="text-xl sm:text-2xl md:text-3xl font-black text-[var(--color-text-primary)] tracking-tight break-words leading-tight">
                                {parsedSong.title}
                            </h2>
                        </div>
                        
                        <div>
                             <div className="flex items-center gap-2 text-[var(--color-text-tertiary)] text-sm font-bold uppercase tracking-widest mb-1">
                                <span>Style</span>
                            </div>
                            <p className="text-sm sm:text-base font-medium text-[var(--color-primary-brand)] break-words leading-relaxed">
                                {parsedSong.style}
                            </p>
                        </div>

                        <div className="flex flex-wrap gap-2 pt-2">
                             <button onClick={() => handleCopy(parsedSong.title, t.copyTitle)} className="btn btn-secondary !text-sm flex items-center gap-2">
                                <CopyIcon className="w-3 h-3" /> {t.copyTitle}
                            </button>
                             <button onClick={() => handleCopy(parsedSong.style, t.copyStyle)} className="btn btn-secondary !text-sm flex items-center gap-2">
                                <CopyIcon className="w-3 h-3" /> {t.copyStyle}
                            </button>
                             <button onClick={() => handleCopy(songData, t.copyAll)} className="btn btn-secondary !text-sm flex items-center gap-2">
                                <CopyIcon className="w-3 h-3" /> {t.copyAll}
                            </button>
                        </div>
                    </div>

                    {/* Action Toolbar */}
                    <div className="flex flex-col gap-2 w-full md:w-auto flex-shrink-0">
                        <div className="grid grid-cols-2 gap-2">
                             <button onClick={handleSRTGenerate} disabled={isGeneratingSRT} className="btn btn-secondary w-full justify-center !py-3 h-auto">
                                <span className="text-[10px] font-bold uppercase">{isGeneratingSRT ? 'Generating...' : 'Lyrics .SRT'}</span>
                            </button>
                            <button onClick={() => setIsRevisionModalOpen(true)} className="btn btn-secondary w-full justify-center !py-3 h-auto">
                                <span className="text-[10px] font-bold uppercase">{t.reviseButton}</span>
                            </button>
                            <button onClick={handleYouTubeGenerate} disabled={isGeneratingYT} className="btn btn-secondary w-full justify-center !py-3 h-auto col-span-2">
                                <span className="text-[10px] font-bold uppercase">{isGeneratingYT ? t.generatingYouTubeDesc : t.generateYouTubeDescButton}</span>
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Suno Settings Panel (Results View) */}
            <div className="glass-panel-pro p-4 rounded-xl border border-[var(--color-border)]">
                <div className="flex items-center justify-between mb-4">
                    <h3 className="text-xs font-bold uppercase tracking-widest text-[var(--color-text-tertiary)] flex items-center gap-2">
                        <Settings2Icon className="w-4 h-4" /> {t.labelSunoSettings}
                    </h3>
                    <span className="px-2 py-0.5 rounded-full bg-[var(--color-accent-cyan-dim)] text-[var(--color-accent-cyan)] text-[10px] font-bold uppercase flex items-center gap-1">
                        <CpuChipIcon className="w-3 h-3" /> Auto Optimized
                    </span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-8">
                    <div>
                        <div className="flex justify-between items-center text-xs text-[var(--color-text-secondary)] mb-1">
                            <span>{t.labelWeirdness}</span>
                            <span className="font-mono font-bold text-[var(--color-accent-cyan)]">
                                {metrics.weirdness}
                            </span>
                        </div>
                        <div className="w-full h-2 bg-[var(--color-bg)] rounded-full overflow-hidden border border-[var(--color-border)]">
                            <div 
                                className="h-full rounded-full bg-[var(--color-accent-cyan)]" 
                                style={{ width: `${metrics.weirdness}%` }}
                            ></div>
                        </div>
                    </div>
                    <div>
                        <div className="flex justify-between items-center text-xs text-[var(--color-text-secondary)] mb-1">
                            <span>{t.labelStyleInfluence}</span>
                            <span className="font-mono font-bold text-[var(--color-accent-cyan)]">
                                {metrics.influence}
                            </span>
                        </div>
                        <div className="w-full h-2 bg-[var(--color-bg)] rounded-full overflow-hidden border border-[var(--color-border)]">
                            <div 
                                className="h-full rounded-full bg-[var(--color-accent-cyan)]" 
                                style={{ width: `${metrics.influence}%` }}
                            ></div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Lyrics Section */}
            <div className="space-y-2">
                <div className="flex items-center justify-between px-2">
                     <h3 className="text-sm font-bold uppercase tracking-widest text-[var(--color-text-tertiary)] flex items-center gap-2">
                        <FileTextIcon className="w-4 h-4" /> {t.labelLyrics}
                    </h3>
                    <div className="flex gap-2">
                        <button onClick={() => handleCopy(parsedSong.lyrics, t.copyLyrics)} className="text-sm font-bold text-[var(--color-primary-brand)] hover:underline uppercase">
                            {t.copyLyrics}
                        </button>
                         <button onClick={handleDownload} className="text-sm font-bold text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] hover:underline uppercase flex items-center gap-1">
                            <DownloadIcon className="w-3 h-3" /> {t.downloadLyricsButton.replace('Download ', '')}
                        </button>
                    </div>
                </div>
                <div className="w-full min-h-[300px] p-4 sm:p-6 bg-[var(--color-bg)] rounded-xl border border-[var(--color-border)] font-mono text-base leading-relaxed whitespace-pre-wrap text-[var(--color-text-secondary)] select-text break-words">
                    {parsedSong.lyrics}
                </div>
            </div>

            <RevisionModal
                isOpen={isRevisionModalOpen}
                onClose={() => setIsRevisionModalOpen(false)}
                originalSongData={songData}
                onSubmit={handleRevisionSubmit}
                isRevising={isRevising}
            />
            <VideoPromptModal
                isOpen={isPromptResultModalOpen}
                onClose={() => setIsPromptResultModalOpen(false)}
                prompt={promptResultContent}
                title={promptResultTitle}
                t={t}
                filename={promptResultFilename}
            />
        </div>
    );
};
