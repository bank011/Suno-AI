
import React, { useState, useEffect, useMemo } from 'react';
import { KeyIcon, FlagThIcon, FlagEnIcon, FlagCnIcon, FlagJpIcon, FlagKrIcon, SparklesIcon, ListMusicIcon, BookOpenIcon, Settings2Icon, MusicIcon } from './icons';
import { translations, type Language } from '../translations';
import { useAppContext } from '../contexts/AppContext';
import { useToast } from '../contexts/ToastContext';
import type { FormState, ActiveTab } from '../types';
import StyleTemplatesModal from './StyleTemplatesModal';
import StructureTemplatesModal from './StructureTemplatesModal';
import ExcludedWordsTemplatesModal from './ExcludedWordsTemplatesModal';
import ConfirmationDialog from './ConfirmationDialog';
import { calculateAutoMetrics } from '../utils';

interface InputFormProps {
  formState: FormState;
  setFormState: React.Dispatch<React.SetStateAction<FormState>>;
  onRandomizeMainIdea: () => void;
  isRandomizingIdea: boolean;
  pendingIdeaRandomization: string | null;
  onApplyIdeaRandomization: () => void;
  onCancelIdeaRandomization: () => void;
  onRandomizeNarrative: () => void;
  isRandomizingNarrative: boolean;
  onRandomizeStructure: () => void;
  isRandomizingStructure: boolean;
  onRandomizeStyle: () => void;
  isRandomizingStyle: boolean;
  onAnalyzeArtistStyle: () => void;
  isAnalyzingArtistStyle: boolean;
  onRandomizeAll: () => void;
  isRandomizingAll: boolean;
  pendingRandomization: Partial<FormState> | null;
  onApplyRandomization: () => void;
  onCancelRandomization: () => void;
  onResetNarrative: () => void;
  onResetAll: () => void;
  onGenerateSong: () => void;
  isLoading: boolean;
  onLanguageChange: (lang: Language) => void;
  t: (typeof translations)[keyof typeof translations];
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  onOpenApiKeyModal: () => void;
}

type StyleTemplate = { name: string; genres: string[]; moods: string[]; tempos: string[] };
type StructureTemplate = { name: string; structure: string[] };
type ExcludedWordsTemplate = { name: string; words: string };


const SectionHeader: React.FC<{ icon: React.ReactNode; title: string; actions?: React.ReactNode }> = ({ icon, title, actions }) => (
    <div className="panel-header flex-col sm:flex-row justify-between flex-wrap gap-y-2 items-start sm:items-center">
        <div className="flex items-center gap-3">
            <div className="text-[var(--color-primary-brand)]">
                {icon}
            </div>
            <h2 className="text-lg font-bold uppercase tracking-wider text-[var(--color-text-primary)]">
                {title}
            </h2>
        </div>
        {actions && <div className="flex items-center gap-2 w-full sm:w-auto sm:ml-auto">{actions}</div>}
    </div>
);

const MultiTagSelector: React.FC<{
    tags: string[];
    selectedTags: string[];
    onTagClick: (tag: string) => void;
    disabled: boolean;
}> = ({ tags, selectedTags, onTagClick, disabled }) => (
    <div className="flex flex-wrap gap-2">
        {tags.map((tag) => {
            const isSelected = selectedTags.includes(tag);
            return (
                <button key={tag} type="button" onClick={() => onTagClick(tag)} disabled={disabled}
                    className={`px-3 py-2 text-xs sm:text-sm font-medium rounded sharp-ui transition-all duration-200 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed btn-rack ${isSelected ? 'active' : ''}`}
                >
                    <span className="led-indicator"></span>
                    {tag}
                </button>
            );
        })}
    </div>
);

const CustomInput: React.FC<{
    onAdd: (tag: string) => void;
    placeholder: string;
    disabled: boolean;
    t: (typeof translations)[keyof typeof translations]['ui'];
}> = ({ onAdd, placeholder, disabled, t }) => {
    const [value, setValue] = useState('');
    
    const handleAdd = () => {
        if (value.trim()) {
            onAdd(value.trim());
            setValue('');
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            handleAdd();
        }
    };

    return (
        <div className="flex items-center gap-2 mt-3">
            <input
                type="text"
                value={value}
                onChange={(e) => setValue(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={placeholder}
                disabled={disabled}
                className="input-screen rounded-md px-3 py-2 text-sm flex-grow red-running-border"
            />
            <button
                type="button"
                onClick={handleAdd}
                disabled={disabled || !value.trim()}
                className="btn btn-secondary flex-shrink-0 sharp-ui !py-2 font-bold uppercase text-sm px-4"
            >
                {t.addStructureButton}
            </button>
        </div>
    );
};

const NarrativeInput: React.FC<{
    id: keyof FormState;
    label: string;
    placeholder: string;
    value: string;
    onChange: (value: string) => void;
    disabled: boolean;
    rows?: number;
    description?: string;
}> = ({ id, label, placeholder, value, onChange, disabled, rows = 3, description }) => (
    <div className="glass-panel-pro p-4 rounded-lg flex flex-col group sharp-ui transition-colors hover:border-[var(--color-border-highlight)]">
        <label htmlFor={id} className="text-sm font-bold uppercase tracking-wider text-[var(--color-text-secondary)] group-focus-within:text-[var(--color-primary-brand)] mb-2 transition-colors flex items-center justify-between">
            {label}
             {description && <span className="text-[10px] text-[var(--color-text-tertiary)] normal-case opacity-0 group-hover:opacity-100 transition-opacity">{description}</span>}
        </label>
        <textarea
            id={id}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder={placeholder}
            className="w-full input-screen rounded p-2 resize-none text-sm leading-relaxed custom-scrollbar flex-grow red-running-border"
            rows={rows}
            disabled={disabled}
        />
    </div>
);
  
export const InputForm: React.FC<InputFormProps> = ({ 
    formState, setFormState, 
    onRandomizeMainIdea, isRandomizingIdea, onRandomizeNarrative, isRandomizingNarrative, onRandomizeStructure, isRandomizingStructure, onRandomizeStyle, isRandomizingStyle, onAnalyzeArtistStyle, isAnalyzingArtistStyle, onRandomizeAll, isRandomizingAll, onResetNarrative, onResetAll, onGenerateSong,
    isLoading, onLanguageChange, t, activeTab, setActiveTab, onOpenApiKeyModal,
    pendingRandomization, onApplyRandomization, onCancelRandomization,
    pendingIdeaRandomization, onApplyIdeaRandomization, onCancelIdeaRandomization,
}) => {
    const { language } = useAppContext();
    const { showToast } = useToast();
    const { 
        prompt, coreTheme, story, keyEmotions, imagery, selectedGenre, selectedMood, selectedTempo,
        selectedVocal, sunoAiMode, weirdness, styleInfluence, selectedInstruments
    } = formState;

    const tu = t.ui;

    const [isStyleModalOpen, setIsStyleModalOpen] = useState(false);
    const [isStructureModalOpen, setIsStructureModalOpen] = useState(false);
    const [isExcludedWordsModalOpen, setIsExcludedWordsModalOpen] = useState(false);

    // Confirmation Dialog States
    const [showResetNarrativeConfirm, setShowResetNarrativeConfirm] = useState(false);
    const [showResetStyleConfirm, setShowResetStyleConfirm] = useState(false);
    const [showResetStructureConfirm, setShowResetStructureConfirm] = useState(false);

    const handleSelectStructureTemplate = (template: StructureTemplate) => {
        setFormState(prev => ({ ...prev, songStructure: [...template.structure] }));
        setIsStructureModalOpen(false);
        showToast(tu.structureSuggestionSuccess, 'success');
    };
    
    const handleSelectStyleTemplate = (template: StyleTemplate) => {
        setFormState(prev => ({ ...prev, selectedGenre: [...template.genres], selectedMood: [...template.moods], selectedTempo: [...template.tempos] }));
        setIsStyleModalOpen(false);
        showToast(tu.styleAppliedSuccess, 'success');
    };

    const handleSelectExcludedWordsTemplate = (template: ExcludedWordsTemplate) => {
        setFormState(prev => ({ ...prev, excludedWords: template.words }));
        setIsExcludedWordsModalOpen(false);
        showToast(tu.excludedWordsTemplateApplied, 'success');
    };

    const confirmResetStyle = () => {
        setFormState(prev => ({ ...prev, selectedGenre: [], selectedMood: [], selectedTempo: [] }));
        setShowResetStyleConfirm(false);
    };

    const confirmResetStructure = () => {
        setFormState(prev => ({ ...prev, songStructure: [] }));
        setShowResetStructureConfirm(false);
    };
    
    const confirmResetNarrative = () => {
        onResetNarrative();
        setShowResetNarrativeConfirm(false);
    };

    const createMultiTagToggleHandler = (key: 'selectedGenre' | 'selectedMood' | 'selectedTempo' | 'selectedInstruments') => (tag: string) => {
        setFormState(prev => {
            const currentTags = prev[key];
            let newTags;
            if (key === 'selectedTempo') {
                newTags = currentTags.includes(tag) ? [] : [tag];
            } else {
                newTags = currentTags.includes(tag) ? currentTags.filter(item => item !== tag) : [...currentTags, tag];
            }
            return { ...prev, [key]: newTags };
        });
    };
    
    const handleAddCustomTag = (key: 'selectedGenre' | 'selectedMood' | 'selectedTempo' | 'selectedInstruments', tag: string) => {
        if (tag) {
            setFormState(prev => {
                const currentTags = prev[key];
                if (currentTags.includes(tag)) return prev;
                const newTags = key === 'selectedTempo' ? [tag] : [...currentTags, tag];
                return { ...prev, [key]: newTags };
            });
        }
    };

    const TabButton: React.FC<{ tabId: ActiveTab; label: string }> = ({ tabId, label }) => (
        <button
            type="button"
            onClick={() => setActiveTab(tabId)}
            className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 text-sm font-bold transition-all uppercase tracking-widest rounded-lg border relative group ${
                activeTab === tabId
                ? 'bg-[var(--color-selected-bg)] border-[var(--color-primary-brand)] text-[var(--color-text-primary)] shadow-[0_0_15px_rgba(192,132,252,0.2)]'
                : 'bg-[var(--color-bg-light)] border-[var(--color-border)] text-[var(--color-text-tertiary)] hover:text-[var(--color-text-secondary)] hover:border-[var(--color-border-highlight)]'
            }`}
        >
            <div className={`w-1.5 h-1.5 rounded-full transition-all duration-500 ${
                activeTab === tabId 
                ? 'bg-[var(--color-active)] shadow-[0_0_8px_var(--color-active)] scale-125' 
                : 'bg-[var(--color-border)] group-hover:bg-[var(--color-text-tertiary)]'
            }`}></div>
            <span>{label}</span>
            {activeTab === tabId && (
                <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-1/2 h-[2px] bg-gradient-to-r from-transparent via-[var(--color-primary-brand)] to-transparent"></div>
            )}
        </button>
    );

  const isAnalyzeDisabled = isLoading || isAnalyzingArtistStyle || !formState.inspiredByArtist.trim();
  const analyzeArtistTooltip = !formState.inspiredByArtist.trim() && !isLoading && !isAnalyzingArtistStyle ? tu.analyzeArtistDisabledTooltip : tu.analyzeArtistButtonTooltip;

  return (
    <>
    <div className="w-full flex flex-col bg-[var(--color-bg)]">
        {/* Featured App Banner */}
        <div className="mb-6 p-4 rounded-xl border border-emerald-500/30 bg-gradient-to-r from-emerald-500/10 to-[var(--color-accent-cyan)]/10 flex flex-col sm:flex-row items-center justify-between gap-4 animate-fade-in relative overflow-hidden group">
            <div className="absolute inset-0 bg-gradient-to-r from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
            <div className="flex items-center gap-4 relative z-10">
                <div className="w-12 h-12 rounded-full bg-emerald-500/20 flex items-center justify-center text-emerald-500 shadow-[0_0_15px_rgba(16,185,129,0.3)]">
                    <SparklesIcon className="w-6 h-6 animate-pulse" />
                </div>
                <div>
                    <h3 className="text-sm font-black uppercase tracking-widest text-[var(--color-text-primary)]">{tu.featuredAppTitle}</h3>
                    <p className="text-xs text-[var(--color-text-secondary)] font-medium">{tu.featuredAppDesc}</p>
                </div>
            </div>
            <a 
                href="https://ai.studio/apps/e909daee-02c2-4539-9201-c3daf7965e72?fullscreenApplet=true" 
                target="_blank" 
                rel="noopener noreferrer"
                className="bg-emerald-500 hover:bg-emerald-600 text-white !py-2 !px-6 rounded-full text-xs font-black uppercase tracking-widest shadow-[0_0_15px_rgba(16,185,129,0.4)] hover:scale-105 active:scale-95 transition-all relative z-10 flex items-center justify-center"
            >
                {tu.featuredAppButton}
            </a>
        </div>

        <div className="flex-shrink-0 bg-[var(--color-panel)] p-4 border border-[var(--color-border)] z-20 rounded-xl mb-6">
            <div className="flex items-stretch w-full gap-2 sm:gap-4 p-1 bg-[var(--color-bg)] rounded-lg border border-[var(--color-border)]">
                <TabButton tabId="idea" label={tu.tabIdea} />
                <TabButton tabId="style" label={tu.tabStyle} />
                <TabButton tabId="advanced" label={tu.tabAdvanced} />
            </div>
        </div>
        
        <div className="relative">
            <div className="space-y-8">
                {activeTab === 'idea' && (
                <div className="space-y-6 animate-fade-in">
                    <section className="space-y-4">
                        <SectionHeader 
                            icon={<SparklesIcon className="w-5 h-5" />} 
                            title={tu.section1Title}
                            actions={
                                <div className="flex gap-2 w-full sm:w-auto">
                                     <button 
                                        type="button" 
                                        onClick={onRandomizeAll} 
                                        disabled={isLoading || isRandomizingAll} 
                                        className="btn btn-rack flex-grow sm:flex-initial px-4 py-2 text-sm flex items-center justify-center gap-2 font-bold text-[var(--color-accent-cyan)] uppercase tracking-wider group"
                                    >
                                        <span className={`w-1.5 h-1.5 rounded-full bg-[var(--color-accent-cyan)] shadow-[0_0_8px_var(--color-accent-cyan)] ${isRandomizingAll ? 'animate-pulse' : 'group-hover:scale-125 transition-transform'}`}></span>
                                        {isRandomizingAll ? 'RANDOMIZING...' : tu.randomizeAllButton}
                                    </button>
                                </div>
                            }
                        />

                        {pendingRandomization && (
                             <div className="p-4 glass-panel-pro rounded-lg border-l-4 border-l-[var(--color-primary-brand)] flex flex-col animate-fade-in gap-3 relative overflow-hidden">
                                <div className="relative z-10">
                                    <p className="text-sm font-bold text-[var(--color-primary-brand)] uppercase tracking-wider mb-2 flex items-center gap-2">
                                        <span className="w-2 h-2 bg-[var(--color-primary-brand)] rounded-full animate-pulse"></span>
                                        {tu.randomizationPreviewTitle}
                                    </p>
                                    <p className="text-sm text-[var(--color-text-primary)] mb-2 leading-relaxed font-medium">
                                        <span className="text-[var(--color-text-secondary)] font-mono text-sm mr-2 uppercase tracking-wide">Prompt:</span>
                                        {pendingRandomization.prompt}
                                    </p>
                                    <p className="text-sm text-[var(--color-text-primary)] leading-relaxed">
                                        <span className="text-[var(--color-text-secondary)] font-mono text-sm mr-2 uppercase tracking-wide">Style:</span>
                                        {[...(pendingRandomization.selectedGenre || []), ...(pendingRandomization.selectedMood || []), ...(pendingRandomization.selectedTempo || [])].join(', ')}
                                    </p>
                                </div>
                                <div className="flex items-center justify-end gap-2 flex-shrink-0 pt-2 border-t border-[var(--color-border)] relative z-10">
                                    <button type="button" onClick={onCancelRandomization} className="btn btn-secondary !text-sm !px-3 !py-1.5 font-bold uppercase">{tu.cancelRandomizationButton}</button>
                                    <button type="button" onClick={onApplyRandomization} className="btn btn-primary !text-sm !px-3 !py-1.5 font-bold uppercase">{tu.applyRandomizationButton}</button>
                                </div>
                            </div>
                        )}

                        <div className="relative group">
                            <div className="flex justify-between items-center mb-2">
                                <label htmlFor="main-prompt" className="text-sm font-bold uppercase text-[var(--color-text-secondary)] tracking-wider ml-1">{tu.labelPrompt}</label>
                                <button 
                                    type="button" 
                                    onClick={onRandomizeMainIdea} 
                                    disabled={isLoading || isRandomizingIdea} 
                                    className="text-sm text-[var(--color-text-secondary)] hover:text-[var(--color-primary-brand)] transition-all font-bold uppercase flex items-center gap-1.5 group"
                                >
                                    <span className={`w-1.5 h-1.5 rounded-full bg-[var(--color-primary-brand)] shadow-[0_0_8px_var(--color-primary-brand)] ${isRandomizingIdea ? 'animate-pulse' : 'group-hover:scale-125 transition-transform'}`}></span>
                                    {isRandomizingIdea ? 'Thinking...' : tu.randomizeIdeaButton}
                                </button>
                            </div>
                            
                            {pendingIdeaRandomization ? (
                                <div className="p-4 glass-panel-pro rounded-md border-l-2 border-l-[var(--color-accent-cyan)] animate-fade-in">
                                    <p className="text-sm text-[var(--color-text-primary)] mb-3 font-medium">{pendingIdeaRandomization}</p>
                                    <div className="flex justify-end gap-2">
                                        <button type="button" onClick={onCancelIdeaRandomization} className="btn btn-secondary !text-sm !py-1 font-bold uppercase">{tu.cancelIdeaButton}</button>
                                        <button type="button" onClick={onApplyIdeaRandomization} className="btn btn-primary !text-sm !py-1 font-bold uppercase">{tu.applyIdeaButton}</button>
                                    </div>
                                </div>
                            ) : (
                                <textarea
                                    id="main-prompt"
                                    value={prompt}
                                    onChange={(e) => setFormState(prev => ({ ...prev, prompt: e.target.value }))}
                                    placeholder={tu.placeholderPrompt}
                                    className="w-full input-screen rounded-lg p-4 min-h-[120px] text-base leading-relaxed focus:ring-1 focus:ring-[var(--color-primary-brand)] red-running-border"
                                    rows={4}
                                    disabled={isLoading}
                                    onKeyDown={(e) => {
                                        if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
                                            e.preventDefault();
                                            onGenerateSong();
                                        }
                                    }}
                                />
                            )}
                        </div>
                    </section>

                    <section className="space-y-4 pt-6">
                        <SectionHeader 
                            icon={<BookOpenIcon className="w-5 h-5 text-[var(--color-accent-cyan)]" />}
                            title={tu.narrativeTitle}
                            actions={
                                <div className="flex gap-2 w-full sm:w-auto">
                                    <button 
                                        type="button" 
                                        onClick={onRandomizeNarrative} 
                                        disabled={isLoading || isRandomizingNarrative} 
                                        className="btn btn-rack flex-grow sm:flex-initial px-4 py-2 text-sm flex items-center justify-center gap-2 font-bold text-[var(--color-accent-cyan)] uppercase tracking-wider group"
                                    >
                                        <span className={`w-1.5 h-1.5 rounded-full bg-[var(--color-accent-cyan)] shadow-[0_0_8px_var(--color-accent-cyan)] ${isRandomizingNarrative ? 'animate-pulse' : 'group-hover:scale-125 transition-transform'}`}></span>
                                        <span>{isRandomizingNarrative ? 'GENERATING...' : tu.randomizeNarrativeButton}</span>
                                    </button>
                                    <button type="button" onClick={() => setShowResetNarrativeConfirm(true)} disabled={isLoading} className="text-sm text-[var(--color-text-tertiary)] hover:text-[var(--color-text-primary)] underline px-2 font-bold uppercase">
                                        {tu.resetButton}
                                    </button>
                                </div>
                            }
                        />

                        <div className="w-full">
                            <NarrativeInput 
                                id="story" 
                                label={tu.labelStory} 
                                placeholder={tu.placeholderStory} 
                                value={story} 
                                onChange={value => setFormState(prev => ({ ...prev, story: value }))} 
                                disabled={isLoading} 
                                description={tu.descStory}
                                rows={8}
                            />
                        </div>
                    </section>
                </div>
                )}
                
                {activeTab === 'style' && (
                <div className="space-y-8 animate-fade-in">
                    <div className="p-4 glass-panel-pro rounded-lg border border-[var(--color-border)] flex flex-col gap-4 items-start sm:items-center sm:flex-row sm:justify-between">
                        <div>
                             <h3 className="text-sm font-bold text-[var(--color-text-primary)] uppercase tracking-wide mb-1">{tu.styleOptionsLabel}</h3>
                             <p className="text-sm text-[var(--color-text-secondary)] opacity-90">Select a template or build from scratch.</p>
                        </div>
                        <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
                            <button 
                                type="button" 
                                onClick={onRandomizeStyle} 
                                disabled={isLoading || isRandomizingStyle} 
                                className="btn btn-rack flex-1 sm:flex-none flex items-center justify-center gap-2 px-6 py-3 font-bold text-[var(--color-accent-cyan)] uppercase tracking-wider group"
                            >
                                <span className={`w-1.5 h-1.5 rounded-full bg-[var(--color-accent-cyan)] shadow-[0_0_8px_var(--color-accent-cyan)] ${isRandomizingStyle ? 'animate-pulse' : 'group-hover:scale-125 transition-transform'}`}></span>
                                {isRandomizingStyle ? 'THINKING...' : tu.suggestStyleButton}
                            </button>
                            <button type="button" onClick={() => setIsStyleModalOpen(true)} disabled={isLoading} className="btn btn-rack flex-1 sm:flex-none flex items-center justify-center gap-2 !px-4 font-bold uppercase">
                                {tu.styleTemplateDefault}
                            </button>
                             <button type="button" onClick={() => setShowResetStyleConfirm(true)} disabled={isLoading} className="btn btn-secondary !px-3 text-[var(--color-text-tertiary)] font-bold uppercase sm:w-auto w-full">
                                {tu.resetButton}
                            </button>
                        </div>
                    </div>

                    <div className="space-y-8">
                        <div>
                             <h3 className="text-sm font-bold text-[var(--color-text-tertiary)] uppercase tracking-widest mb-3 flex items-center gap-2 after:content-[''] after:h-px after:flex-grow after:bg-[var(--color-border)]">
                                {tu.labelGenre}
                            </h3>
                            <MultiTagSelector tags={[...new Set([...t.options.GENRES, ...selectedGenre])]} selectedTags={selectedGenre} onTagClick={createMultiTagToggleHandler('selectedGenre')} disabled={isLoading} />
                            <CustomInput onAdd={(tag) => handleAddCustomTag('selectedGenre', tag)} placeholder={tu.placeholderCustomTag} disabled={isLoading} t={tu} />
                        </div>
                        
                        <div>
                            <h3 className="text-sm font-bold text-[var(--color-text-tertiary)] uppercase tracking-widest mb-3 flex items-center gap-2 after:content-[''] after:h-px after:flex-grow after:bg-[var(--color-border)]">
                                {tu.labelMood}
                            </h3>
                            <MultiTagSelector tags={[...new Set([...t.options.MOODS, ...selectedMood])]} selectedTags={selectedMood} onTagClick={createMultiTagToggleHandler('selectedMood')} disabled={isLoading} />
                            <CustomInput onAdd={(tag) => handleAddCustomTag('selectedMood', tag)} placeholder={tu.placeholderCustomTag} disabled={isLoading} t={tu} />
                        </div>
                        
                        <div>
                            <h3 className="text-sm font-bold text-[var(--color-text-tertiary)] uppercase tracking-widest mb-3 flex items-center gap-2 after:content-[''] after:h-px after:flex-grow after:bg-[var(--color-border)]">
                                {tu.labelTempo}
                            </h3>
                            <MultiTagSelector tags={[...new Set([...t.options.TEMPOS, ...selectedTempo])]} selectedTags={selectedTempo} onTagClick={createMultiTagToggleHandler('selectedTempo')} disabled={isLoading} />
                        </div>

                        <div className="grid grid-cols-1 gap-6">
                            <div className="glass-panel-pro p-4 rounded-lg">
                                <label htmlFor="vocal-select" className="block text-sm font-bold text-[var(--color-text-secondary)] uppercase tracking-wide mb-3">{tu.labelVocal}</label>
                                <div className="relative">
                                    <select id="vocal-select" value={selectedVocal} onChange={(e) => setFormState(prev => ({ ...prev, selectedVocal: e.target.value }))} disabled={isLoading}
                                        className="input-screen w-full rounded px-3 py-2 text-sm"
                                    >
                                        {t.options.VOCALS.map(vocal => <option key={vocal} value={vocal}>{vocal}</option>)}
                                    </select>
                                </div>
                                {selectedVocal === t.options.VOCALS[2] && (
                                    <div className="grid grid-cols-2 gap-2 mt-3 pt-3 border-t border-[var(--color-border)] animate-fade-in">
                                        <input type="text" value={formState.maleRole} onChange={e => setFormState(prev => ({...prev, maleRole: e.target.value}))} placeholder={tu.placeholderMaleRole} disabled={isLoading} className="input-screen rounded px-2 py-1.5 text-sm"/>
                                        <input type="text" value={formState.femaleRole} onChange={e => setFormState(prev => ({...prev, femaleRole: e.target.value}))} placeholder={tu.placeholderFemaleRole} disabled={isLoading} className="input-screen rounded px-2 py-1.5 text-sm"/>
                                    </div>
                                )}
                            </div>
                        </div>

                        <div>
                            <h3 className="text-sm font-bold text-[var(--color-text-tertiary)] uppercase tracking-widest mb-3 flex items-center gap-2 after:content-[''] after:h-px after:flex-grow after:bg-[var(--color-border)]">
                                {tu.labelInstruments}
                            </h3>
                            <MultiTagSelector tags={[...new Set([...t.options.INSTRUMENTS, ...selectedInstruments])]} selectedTags={formState.selectedInstruments} onTagClick={createMultiTagToggleHandler('selectedInstruments')} disabled={isLoading} />
                            <CustomInput onAdd={(tag) => handleAddCustomTag('selectedInstruments', tag)} placeholder={tu.placeholderCustomTag} disabled={isLoading} t={tu} />
                        </div>
                    </div>
                </div>
                )}

                {activeTab === 'advanced' && (
                <div className="space-y-8 animate-fade-in">
                    <div>
                        <SectionHeader 
                            icon={<ListMusicIcon className="w-5 h-5" />} 
                            title={tu.labelStructure} 
                            actions={
                                <button type="button" onClick={() => setShowResetStructureConfirm(true)} disabled={isLoading} className="text-sm text-[var(--color-text-tertiary)] hover:text-[var(--color-error)] font-bold uppercase">{tu.resetButton}</button>
                            }
                        />
                        <div className="flex flex-col sm:flex-row gap-2 mb-4">
                            <button type="button" onClick={() => setIsStructureModalOpen(true)} disabled={isLoading} className="btn btn-rack flex-1 flex items-center justify-center gap-2 !px-4 !py-3 font-bold uppercase">
                                {tu.structureTemplateDefault}
                            </button>
                            <button 
                                type="button" 
                                onClick={onRandomizeStructure} 
                                disabled={isLoading || isRandomizingStructure} 
                                className="btn btn-rack flex-1 flex items-center justify-center gap-2 px-6 py-4 font-bold text-[var(--color-accent-cyan)] uppercase tracking-widest group"
                            >
                                <span className={`w-2 h-2 rounded-full bg-[var(--color-accent-cyan)] shadow-[0_0_10px_var(--color-accent-cyan)] ${isRandomizingStructure ? 'animate-pulse' : 'group-hover:scale-125 transition-transform'}`}></span>
                                {isRandomizingStructure ? 'THINKING...' : tu.suggestStructureButton}
                            </button>
                        </div>
                        
                        <div className="p-4 bg-[var(--color-input-bg)] rounded-lg border border-[var(--color-border)] mb-4 min-h-[80px]">
                            {formState.songStructure.length > 0 ? (
                                <div className="flex flex-wrap gap-2">
                                    {formState.songStructure.map((part, index) => (
                                        <div key={index} onClick={() => setFormState(prev => ({...prev, songStructure: prev.songStructure.filter((_, i) => i !== index)}))}
                                            className="group relative flex items-center gap-2 bg-[var(--color-panel)] text-[var(--color-active)] text-sm font-bold px-3 py-2 rounded border border-[var(--color-border)] cursor-pointer hover:border-red-500/50 hover:text-red-400 transition-all">
                                            <span className="w-1.5 h-1.5 rounded-full bg-[var(--color-active)] group-hover:bg-red-500"></span>
                                            {part}
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="h-full flex flex-col items-center justify-center text-center opacity-50 py-4">
                                    <span className="text-sm text-[var(--color-text-tertiary)] italic">{tu.structurePlaceholder}</span>
                                </div>
                            )}
                        </div>

                        <div className="flex flex-wrap gap-2 mb-3">
                            {t.options.SONG_STRUCTURE_PARTS.map(part => (
                                <button key={part} type="button" onClick={() => setFormState(prev => ({...prev, songStructure: [...prev.songStructure, part]}))} disabled={isLoading}
                                    className="px-3 py-1.5 text-sm font-medium rounded border bg-[var(--color-bg-light)] border-[var(--color-border)] text-[var(--color-text-secondary)] hover:border-[var(--color-active)] hover:text-[var(--color-active)] transition-colors disabled:opacity-50 hover:bg-[var(--color-panel)]">
                                    + {part}
                                </button>
                            ))}
                        </div>
                        <CustomInput onAdd={(part) => {
                            let p = part.trim();
                            if (p) {
                                if (!p.startsWith('[')) p = `[${p}`;
                                if (!p.endsWith(']')) p = `${p}]`;
                                setFormState(prev => ({ ...prev, songStructure: [...prev.songStructure, p] }));
                            }
                        }} placeholder={tu.placeholderCustomStructure} disabled={isLoading} t={tu} />
                    </div>

                    <div className="glass-panel-pro p-4 rounded-lg">
                        <div className="flex items-center justify-between mb-3">
                             <label className="block text-sm font-bold text-[var(--color-text-secondary)] uppercase tracking-wide">Inspiration & References</label>
                             <span className="text-[10px] text-[var(--color-text-tertiary)]">{tu.optional}</span>
                        </div>
                        <div className="space-y-3">
                            <input type="text" value={formState.inspiredBySong} onChange={e => setFormState(prev => ({...prev, inspiredBySong: e.target.value}))} placeholder={tu.placeholderInspirationSong} disabled={isLoading} className="input-screen w-full rounded p-2 text-sm red-running-border"/>
                            <div className="flex items-center gap-2">
                                <input 
                                    type="text" 
                                    value={formState.inspiredByArtist} 
                                    onChange={e => setFormState(prev => ({...prev, inspiredByArtist: e.target.value}))} 
                                    placeholder={tu.placeholderInspirationArtist} 
                                    disabled={isLoading || isAnalyzingArtistStyle} 
                                    className="input-screen flex-grow rounded p-2 text-sm red-running-border"
                                />
                                <button
                                    type="button"
                                    onClick={onAnalyzeArtistStyle}
                                    disabled={isAnalyzeDisabled}
                                    className="btn btn-rack flex-shrink-0 !py-2 !px-3 text-sm flex items-center gap-2 sharp-ui font-bold uppercase"
                                    title={analyzeArtistTooltip}
                                >
                                    <span className={`led-indicator-cyan ${isAnalyzingArtistStyle ? 'animate-pulse' : ''}`}></span>
                                    {isAnalyzingArtistStyle ? 'ANALYZING...' : <span>{tu.analyzeArtistButton}</span>}
                                </button>
                            </div>
                        </div>
                    </div>



                    <div>
                        <div className="flex justify-between items-center flex-wrap gap-2 mb-2">
                            <h3 className="text-sm font-bold uppercase text-[var(--color-text-secondary)] tracking-wide">{tu.labelCustomVocabulary}</h3>
                            <span className="text-[10px] text-[var(--color-primary-brand)] font-medium bg-[var(--color-primary-brand)]/10 px-2 py-0.5 rounded-full">
                                {tu.defaultVocabularyActive}
                            </span>
                        </div>
                        <textarea
                            value={formState.customVocabulary}
                            onChange={e => setFormState(prev => ({...prev, customVocabulary: e.target.value}))}
                            placeholder={tu.placeholderCustomVocabulary}
                            disabled={isLoading}
                            className="input-screen w-full rounded p-3 text-sm custom-scrollbar red-running-border"
                            rows={2}
                        />
                    </div>
                    
                    <div className="space-y-6 pt-6 border-t border-[var(--color-border)]">
                        <h3 className="text-sm font-bold uppercase tracking-wide text-[var(--color-text-tertiary)]">{tu.sectionTitleAppSettings}</h3>
                        
                        <div className="grid grid-cols-1 gap-4">
                            <div className="glass-panel-pro p-3 rounded-lg">
                                <label className="block text-sm font-bold text-[var(--color-text-secondary)] uppercase tracking-wide mb-2">{tu.billingAndApiTitle}</label>
                                <button onClick={onOpenApiKeyModal} className="btn btn-rack w-full flex items-center justify-center gap-2 !text-sm !py-2 sharp-ui font-bold uppercase">
                                    <KeyIcon className="w-3 h-3 text-[var(--color-accent-cyan)]" />
                                    {tu.manageApiKeyButton}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
                )}
            </div>
        </div>
        
        <div className="hidden sm:flex mt-8 pt-6 border-t border-[var(--color-border)] gap-4 h-14">
             <button 
                onClick={onResetAll} 
                disabled={isLoading} 
                className="flex-1 btn btn-secondary btn-danger-pro rounded-xl text-base font-bold uppercase tracking-widest h-12 sm:h-14 transition-all duration-300 hover:scale-[1.02] active:scale-[0.98]"
            >
                {tu.resetAllButton}
            </button>
            <button 
                onClick={onGenerateSong} 
                disabled={isLoading || isRandomizingAll || isRandomizingNarrative || isRandomizingIdea} 
                className={`flex-1 btn btn-neon-flow rounded-xl relative overflow-hidden group h-12 sm:h-14 shadow-2xl transition-all duration-300 ${isLoading ? 'is-loading opacity-80' : 'hover:scale-[1.02] active:scale-[0.98]'}`}
            >
                <div className="absolute inset-0 bg-gradient-to-r from-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                <div className="relative z-10 flex items-center justify-center gap-4">
                    {isLoading ? (
                        <div className="flex items-center gap-3">
                            <span className="w-5 h-5 border-3 border-white/30 border-t-white rounded-full animate-spin"></span>
                            <span className="tracking-[0.2em] font-black text-base">{tu.submitButtonLoading}</span>
                        </div>
                    ) : (
                        <span className="tracking-[0.2em] font-black text-base sm:text-lg">{tu.submitButton}</span>
                    )}
                </div>
            </button>
        </div>
    </div>
    <StyleTemplatesModal
        isOpen={isStyleModalOpen}
        onClose={() => setIsStyleModalOpen(false)}
        onSelect={handleSelectStyleTemplate}
        t={tu}
    />
    <StructureTemplatesModal
        isOpen={isStructureModalOpen}
        onClose={() => setIsStructureModalOpen(false)}
        onSelect={handleSelectStructureTemplate}
        t={tu}
    />
    <ExcludedWordsTemplatesModal
        isOpen={isExcludedWordsModalOpen}
        onClose={() => setIsExcludedWordsModalOpen(false)}
        onSelect={handleSelectExcludedWordsTemplate}
        t={tu}
    />
    
    {/* Delete Confirmations */}
    {showResetNarrativeConfirm && (
        <ConfirmationDialog 
            title={tu.confirmResetNarrativeTitle} 
            message={tu.confirmResetNarrativeMessage} 
            onConfirm={confirmResetNarrative} 
            onCancel={() => setShowResetNarrativeConfirm(false)} 
            t={tu} 
        />
    )}
    {showResetStyleConfirm && (
        <ConfirmationDialog 
            title={tu.confirmResetStyleTitle} 
            message={tu.confirmResetStyleMessage} 
            onConfirm={confirmResetStyle} 
            onCancel={() => setShowResetStyleConfirm(false)} 
            t={tu} 
        />
    )}
    {showResetStructureConfirm && (
        <ConfirmationDialog 
            title={tu.confirmResetStructureTitle} 
            message={tu.confirmResetStructureMessage} 
            onConfirm={confirmResetStructure} 
            onCancel={() => setShowResetStructureConfirm(false)} 
            t={tu} 
        />
    )}
    </>
  );
};
