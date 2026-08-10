
import React, { useState, useCallback, useEffect, useMemo, lazy, Suspense, useRef } from 'react';
import { InputForm } from './components/InputForm';
import { SongDisplay } from './components/SongDisplay';
import { generateSong, RateLimitError } from './geminiService';
import { SunIcon, MoonIcon, HistoryIcon, HeadphonesIcon, InfoIcon } from './components/icons';
import { translations, type Language } from './translations';
import { useAppContext } from './contexts/AppContext';
import { useToast } from './contexts/ToastContext';
import { ToastContainer } from './components/Toast';
import WelcomeModal from './components/WelcomeModal';
import HowToUseModal from './components/HowToUseModal';
import ApiKeyModal from './components/ApiKeyModal';
import ConfirmationDialog from './components/ConfirmationDialog';
import RateLimitModal from './components/RateLimitModal';
import { generateRandomIdea, generateNarrativeFromIdea, generateRandomNarrative, generateSongStructure, generateStyleFromArtist, generateStyleFromIdea } from './geminiService';
import type { FormState, ActiveTab, HistoryItem } from './types';
import BugReportModal from './components/BugReportModal';
import ModelSelectionModal from './components/ModelSelectionModal';

const HistoryModal = lazy(() => import('./components/HistoryModal'));
const SupportModal = lazy(() => import('./components/SupportModal'));

const initialFormState: FormState = {
    prompt: '',
    coreTheme: '',
    story: '',
    keyEmotions: '',
    imagery: '',
    selectedGenre: [],
    selectedMood: [],
    selectedTempo: [],
    selectedVocal: translations['th'].options.VOCALS[0],
    selectedInstruments: [],
    inspiredBySong: '',
    inspiredByArtist: '',
    maleRole: '',
    femaleRole: '',
    songStructure: [],
    sunoAiMode: 'auto',
    weirdness: 50,
    styleInfluence: 50,
    selectedModel: 'gemini-3.1-pro-preview', // Default to Gemini 3.1 Pro Preview
    excludedWords: '',
    customVocabulary: '',
};

const HISTORY_KEY = 'suno-composer-history';
const MAX_HISTORY_ITEMS = 30;

const App: React.FC = () => {
  const { 
    language, 
    handleLanguageChange: setLanguage,
    isSupportModalOpen,
    handleCloseSupportModal,
    rateLimitError,
    setRateLimitError,
    theme,
    toggleTheme,
    activeApiKey,
    isApiKeyModalOpen,
    openApiKeyModal,
    deleteApiKey,
    isWelcomeModalOpen,
    isBugReportModalOpen,
    openBugReportModal
  } = useAppContext();
  
  const { showToast } = useToast();
  
  const [activeTab, setActiveTab] = useState<ActiveTab>('idea');
  
  const t = useMemo(() => translations[language], [language]);

  const [formState, setFormState] = useState<FormState>({
    ...initialFormState,
    selectedVocal: t.options.VOCALS[0],
  });

  const [songData, setSongData] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isRandomizingIdea, setIsRandomizingIdea] = useState<boolean>(false);
  const [pendingIdeaRandomization, setPendingIdeaRandomization] = useState<string | null>(null);
  const [isRandomizingNarrative, setIsRandomizingNarrative] = useState<boolean>(false);
  const [isRandomizingStructure, setIsRandomizingStructure] = useState<boolean>(false);
  const [isRandomizingStyle, setIsRandomizingStyle] = useState<boolean>(false);
  const [isAnalyzingArtistStyle, setIsAnalyzingArtistStyle] = useState<boolean>(false);
  const [isRandomizingAll, setIsRandomizingAll] = useState<boolean>(false);
  const [pendingRandomization, setPendingRandomization] = useState<Partial<FormState> | null>(null);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);
  const [isResetConfirmOpen, setIsResetConfirmOpen] = useState(false);
  const [isModelModalOpen, setIsModelModalOpen] = useState(false);
  const [isHowToUseModalOpen, setIsHowToUseModalOpen] = useState(false);
  const [currentSongInputs, setCurrentSongInputs] = useState<FormState | null>(null);

  // Auto-show How to Use modal on mount if not dismissed today
  useEffect(() => {
    const dismissedDate = localStorage.getItem('suno-composer-how-to-use-dismissed');
    const today = new Date().toDateString();
    if (dismissedDate !== today) {
        const timer = setTimeout(() => {
            setIsHowToUseModalOpen(true);
        }, 1000);
        return () => clearTimeout(timer);
    }
  }, []);
  
  const resultsRef = useRef<HTMLDivElement>(null);

  // --- Dynamic Browser Theme Color for Mobile ---
  useEffect(() => {
      const metaThemeColor = document.querySelector("meta[name='theme-color']");
      if (metaThemeColor) {
          // If light theme, use pastel bg (#fdf4ff)
          // If dark theme, use the dark pastel bg (#13111c)
          metaThemeColor.setAttribute('content', theme === 'light' ? '#fdf4ff' : '#13111c');
      }
  }, [theme]);

  useEffect(() => {
    const initialize = () => {
        try {
            const savedStateJSON = localStorage.getItem('suno-composer-form-state');
            if (savedStateJSON) {
                const savedState = JSON.parse(savedStateJSON);
                
                // Migrate legacy model settings
                if (typeof savedState.selectedModel === 'string' && (savedState.selectedModel.includes('flash-lite') || savedState.selectedModel.includes('3.5'))) {
                    savedState.selectedModel = 'gemini-2.5-flash';
                }
                
                const currentLangOptions = translations[language].options;

                if (savedState.selectedVocal && !currentLangOptions.VOCALS.includes(savedState.selectedVocal)) {
                    savedState.selectedVocal = currentLangOptions.VOCALS[0];
                }
                if (savedState.selectedGenre) {
                    savedState.selectedGenre = savedState.selectedGenre.filter((g: string) => [...currentLangOptions.GENRES, ...savedState.selectedGenre].includes(g));
                }
                 if (savedState.selectedMood) {
                    savedState.selectedMood = savedState.selectedMood.filter((m: string) => [...currentLangOptions.MOODS, ...savedState.selectedMood].includes(m));
                }
                if (savedState.selectedTempo) {
                    savedState.selectedTempo = savedState.selectedTempo.filter((t: string) => [...currentLangOptions.TEMPOS, ...savedState.selectedTempo].includes(t));
                }
                if (savedState.selectedInstruments) {
                    savedState.selectedInstruments = savedState.selectedInstruments.filter((i: string) => [...currentLangOptions.INSTRUMENTS, ...savedState.selectedInstruments].includes(i));
                }

                setFormState(prevState => ({ ...prevState, ...savedState }));
            }
            
            const savedHistoryJSON = localStorage.getItem(HISTORY_KEY);
            if (savedHistoryJSON) {
                setHistory(JSON.parse(savedHistoryJSON));
            }
        } catch (error) {
            console.error('Could not load state from localStorage:', error);
            localStorage.removeItem('suno-composer-form-state');
            localStorage.removeItem(HISTORY_KEY);
        }
    };
    initialize();
  }, [language]);


  useEffect(() => {
    const timer = setTimeout(() => {
      try {
        localStorage.setItem('suno-composer-form-state', JSON.stringify(formState));
      } catch (error) {
        console.error('Could not save form state to localStorage:', error);
      }
    }, 500);

    return () => {
      clearTimeout(timer);
    };
  }, [formState]);

  useEffect(() => {
    const mainContainer = document.getElementById('main-container');
    if (mainContainer) {
        if (isHistoryModalOpen || isResetConfirmOpen || isApiKeyModalOpen || isSupportModalOpen || isWelcomeModalOpen || isBugReportModalOpen || isModelModalOpen || isHowToUseModalOpen || !!rateLimitError) {
            mainContainer.setAttribute('aria-hidden', 'true');
        } else {
            mainContainer.removeAttribute('aria-hidden');
        }
    }
  }, [isHistoryModalOpen, isResetConfirmOpen, isApiKeyModalOpen, isSupportModalOpen, isWelcomeModalOpen, isBugReportModalOpen, isModelModalOpen, isHowToUseModalOpen, rateLimitError]);

  useEffect(() => {
    const isModalOpen = isHistoryModalOpen || isResetConfirmOpen || !!rateLimitError || isApiKeyModalOpen || isSupportModalOpen || isWelcomeModalOpen || isBugReportModalOpen || isModelModalOpen || isHowToUseModalOpen;
    if (isModalOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isHistoryModalOpen, isResetConfirmOpen, rateLimitError, isApiKeyModalOpen, isSupportModalOpen, isWelcomeModalOpen, isBugReportModalOpen, isModelModalOpen, isHowToUseModalOpen]);


  const addToHistory = (songData: string, inputs: FormState) => {
    // Robust Extraction Logic:
    // 1. Gathers all possible labels from translations (English + current + others)
    // 2. Creates a regex that matches any of these labels, handling optional markdown bolding (**Label**)
    const titleLabels = Object.values(translations).map(tr => tr.prompts.label_song_title.slice(0, -1)).concat(["Song Title", "Title", "ชื่อเพลง"]);
    const styleLabels = Object.values(translations).map(tr => tr.prompts.label_style.slice(0, -1)).concat(["Style", "Genre", "สไตล์"]);

    const createRegex = (labels: string[]) => {
        const joined = [...new Set(labels)].map(l => l.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|');
        return new RegExp(`^\\s*[\\*]*(${joined})[\\*]*\\s*:\\s*(.*)`, 'im'); 
    };

    const titleMatch = songData.match(createRegex(titleLabels));
    const styleMatch = songData.match(createRegex(styleLabels));

    const cleanValue = (val: string) => val.trim().replace(/\*/g, '');

    const newHistoryItem: HistoryItem = {
      id: Date.now(),
      songData,
      inputs,
      title: titleMatch ? cleanValue(titleMatch[2]) : 'Untitled',
      style: styleMatch ? cleanValue(styleMatch[2]) : 'Unknown Style',
      createdAt: new Date().toISOString(),
    };

    setHistory(prevHistory => {
        const updatedHistory = [newHistoryItem, ...prevHistory].slice(0, MAX_HISTORY_ITEMS);
        try {
            localStorage.setItem(HISTORY_KEY, JSON.stringify(updatedHistory));
        } catch (error) {
            console.error("Could not save history to localStorage:", error);
        }
        return updatedHistory;
    });
  };

  const deleteHistoryItem = (id: number) => {
    setHistory(prevHistory => {
        const updatedHistory = prevHistory.filter(item => item.id !== id);
        try {
            localStorage.setItem(HISTORY_KEY, JSON.stringify(updatedHistory));
        } catch (error) {
            console.error("Could not save history to localStorage:", error);
        }
        return updatedHistory;
    });
  };

  const clearHistory = () => {
    setHistory([]);
    try {
        localStorage.removeItem(HISTORY_KEY);
    } catch (error) {
        console.error("Could not remove history from localStorage:", error);
    }
  };

  const restoreFromHistory = (item: HistoryItem) => {
    setFormState(item.inputs);
    setSongData(item.songData);
    setCurrentSongInputs(item.inputs); 
    setIsHistoryModalOpen(false);
    // Scroll to results after restore
    setTimeout(() => {
        if (resultsRef.current) {
            resultsRef.current.scrollIntoView({ behavior: 'smooth' });
        }
    }, 300);
  };

  const handleApiError = useCallback((error: unknown) => {
      const errorMessage = error instanceof Error ? error.message : t.ui.errorUnknown;
      if (errorMessage === t.ui.apiKeyInvalidError && activeApiKey) {
          showToast(errorMessage, 'error');
          deleteApiKey(activeApiKey); 
          return true; 
      }
      if (error instanceof RateLimitError) {
          setRateLimitError(errorMessage);
      } else {
          showToast(errorMessage, 'error');
          if (errorMessage !== t.ui.errorNetwork && errorMessage !== t.ui.errorModelOverloaded) {
             openBugReportModal(errorMessage);
          }
      }
      return false; 
  }, [t.ui.errorUnknown, t.ui.apiKeyInvalidError, t.ui.errorNetwork, t.ui.errorModelOverloaded, showToast, deleteApiKey, setRateLimitError, activeApiKey, openBugReportModal]);


  const handleFormChange = useCallback((newState: Partial<FormState>) => {
    setFormState(prevState => ({ ...prevState, ...newState }));
  }, []);

  const handlePreGenerateSong = useCallback(() => {
    if (!activeApiKey) {
      openApiKeyModal();
      return;
    }

    const hasMainIdea = formState.prompt.trim() !== '';
    const hasNarrative = formState.story.trim() !== '';

    if (!hasMainIdea && !hasNarrative) {
      showToast(t.ui.errorPrompt, 'error');
      return;
    }
    
    setIsModelModalOpen(true);
  }, [activeApiKey, formState.prompt, formState.story, openApiKeyModal, showToast, t]);

  const handleGenerateSong = useCallback(async (modelId: string) => {
    setIsModelModalOpen(false);
    setFormState(prev => ({ ...prev, selectedModel: modelId }));

    setIsLoading(true);
    setSongData(null);
    setCurrentSongInputs(null);
    
    // Scroll to results immediately so user sees the loading state
    setTimeout(() => {
         if (resultsRef.current) {
             resultsRef.current.scrollIntoView({ behavior: 'smooth' });
         }
    }, 100);

    const userPrompt = [
        `Main Idea: ${formState.prompt || 'Not provided'}.`,
        `Story: ${formState.story || 'Not provided'}.`
    ].join('\n');


    try {
      const result = await generateSong({
        userPrompt,
        genres: formState.selectedGenre,
        moods: formState.selectedMood,
        tempos: formState.selectedTempo,
        vocalGender: formState.selectedVocal,
        instruments: formState.selectedInstruments,
        inspiredBySong: formState.inspiredBySong,
        inspiredByArtist: formState.inspiredByArtist,
        maleRole: formState.maleRole,
        femaleRole: formState.femaleRole,
        songStructure: formState.songStructure,
        sunoAiMode: formState.sunoAiMode,
        weirdness: formState.weirdness,
        styleInfluence: formState.styleInfluence,
        excludedWords: formState.excludedWords,
        customVocabulary: formState.customVocabulary,
        model: modelId,
        language,
      }, activeApiKey);
      setSongData(result);
      setCurrentSongInputs({...formState, selectedModel: modelId});
      addToHistory(result, {...formState, selectedModel: modelId});

    } catch (error) {
      console.error("Song generation failed:", error);
      handleApiError(error);
      setSongData(null);
    } finally {
      setIsLoading(false);
    }
  }, [formState, language, activeApiKey, handleApiError]);

  const handleRandomizeMainIdea = async () => {
    if (!activeApiKey) { openApiKeyModal(); return; }
    setIsRandomizingIdea(true);
    setPendingIdeaRandomization(null);
    try {
        const idea = await generateRandomIdea(language, activeApiKey);
        setPendingIdeaRandomization(idea);
    } catch (error) {
        handleApiError(error);
    } finally {
        setIsRandomizingIdea(false);
    }
  };

  const applyIdeaRandomization = () => {
      if (pendingIdeaRandomization) {
          setFormState(prev => ({...prev, prompt: pendingIdeaRandomization}));
          setPendingIdeaRandomization(null);
          showToast(t.ui.ideaAppliedSuccess, 'success');
      }
  };
  const cancelIdeaRandomization = () => setPendingIdeaRandomization(null);

  const handleRandomizeNarrative = async () => {
      if (!activeApiKey) { openApiKeyModal(); return; }
      setIsRandomizingNarrative(true);
      try {
          let narrative;
          if (formState.prompt.trim()) {
              narrative = await generateNarrativeFromIdea(language, formState.prompt, activeApiKey);
          } else {
              narrative = await generateRandomNarrative(language, activeApiKey);
          }
          setFormState(prev => ({...prev, ...narrative}));
      } catch (error) {
          handleApiError(error);
      } finally {
          setIsRandomizingNarrative(false);
      }
  };

  const handleRandomizeStructure = async () => {
      if (!activeApiKey) { openApiKeyModal(); return; }
      const hasMainIdea = formState.prompt.trim() !== '';
      const hasStyle = formState.selectedGenre.length > 0 || formState.selectedMood.length > 0;
      if (!hasMainIdea && !hasStyle) {
          showToast(t.ui.structureSuggestionError, 'error');
          return;
      }
      setIsRandomizingStructure(true);
      try {
          const structure = await generateSongStructure(formState, language, activeApiKey);
          setFormState(prev => ({...prev, songStructure: structure}));
          showToast(t.ui.structureSuggestionSuccess, 'success');
      } catch (error) {
          handleApiError(error);
      } finally {
          setIsRandomizingStructure(false);
      }
  };

  const handleRandomizeStyle = async () => {
      if (!activeApiKey) { openApiKeyModal(); return; }
      if (!formState.prompt.trim() && !formState.coreTheme.trim()) {
          showToast(t.ui.styleSuggestionError, 'error');
          return;
      }
      setIsRandomizingStyle(true);
      try {
          const style = await generateStyleFromIdea(formState, language, activeApiKey);
          setFormState(prev => ({
              ...prev, 
              selectedGenre: style.genres, 
              selectedMood: style.moods, 
              selectedTempo: style.tempos, 
              selectedInstruments: style.instruments,
          }));
          showToast(t.ui.styleSuggestionSuccess, 'success');
      } catch (error) {
          handleApiError(error);
      } finally {
          setIsRandomizingStyle(false);
      }
  };

  const handleAnalyzeArtistStyle = async () => {
    if (!activeApiKey) { openApiKeyModal(); return; }
    if (!formState.inspiredByArtist.trim()) {
        showToast(t.ui.analyzeArtistError, 'error');
        return;
    }
    setIsAnalyzingArtistStyle(true);
    try {
        const styleSuggestion = await generateStyleFromArtist(formState.inspiredByArtist, language, activeApiKey);
        
        setFormState(prevState => ({
            ...prevState,
            selectedGenre: [...new Set([...prevState.selectedGenre, ...styleSuggestion.genres])],
            selectedMood: [...new Set([...prevState.selectedMood, ...styleSuggestion.moods])],
            selectedInstruments: [...new Set([...prevState.selectedInstruments, ...styleSuggestion.instruments])],
            selectedTempo: styleSuggestion.tempos.length > 0 ? [styleSuggestion.tempos[0]] : prevState.selectedTempo,
        }));

        showToast(t.ui.analyzeArtistSuccess, 'success');
        setActiveTab('style'); 
    } catch (error) {
        handleApiError(error);
    } finally {
        setIsAnalyzingArtistStyle(false);
    }
  };


  const handleRandomizeAll = async () => {
    if (!activeApiKey) { openApiKeyModal(); return; }
    setIsRandomizingAll(true);
    setPendingRandomization(null);
    try {
      const idea = await generateRandomIdea(language, activeApiKey);
      const tempFormStateForStyle = { ...formState, prompt: idea };
      const style = await generateStyleFromIdea(tempFormStateForStyle, language, activeApiKey);
      
      setPendingRandomization({
          prompt: idea,
          selectedGenre: style.genres,
          selectedMood: style.moods,
          selectedTempo: style.tempos,
          selectedInstruments: style.instruments,
      });

    } catch (error) {
        handleApiError(error);
    } finally {
        setIsRandomizingAll(false);
    }
  };

  const applyRandomization = () => {
    if (pendingRandomization) {
        setFormState(prev => ({ ...prev, ...pendingRandomization }));
        setPendingRandomization(null);
        showToast(t.ui.randomizationAppliedSuccess, 'success');
    }
  };
  const cancelRandomization = () => setPendingRandomization(null);

  const resetNarrative = () => {
      setFormState(prev => ({
          ...prev,
          coreTheme: '',
          story: '',
          keyEmotions: '',
          imagery: '',
      }));
  };

  const handleResetAll = () => {
      setFormState({
        ...initialFormState,
        selectedVocal: t.options.VOCALS[0],
        selectedModel: 'gemini-3.1-pro-preview', // Reset to Gemini 3.1 Pro Preview
      });
      setSongData(null);
      setCurrentSongInputs(null);
      setIsResetConfirmOpen(false);
      window.scrollTo({ top: 0, behavior: 'smooth' });
  };
  
  const handleRemix = () => {
    if (currentSongInputs) {
        setFormState(currentSongInputs);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };


  return (
    <>
      <main id="main-container" className="min-h-screen w-full flex flex-col text-[var(--color-text-primary)] bg-[var(--color-bg)]">
          <header className="flex-shrink-0 flex justify-between items-center px-4 py-3 border-b border-[var(--color-border)] bg-[var(--color-panel)] z-30 sticky top-0">
            {/* Add global SVG defs for gradients */}
            <svg width="0" height="0" className="absolute">
              <defs>
                <linearGradient id="logo-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#22d3ee" />
                  <stop offset="100%" stopColor="#d946ef" />
                </linearGradient>
              </defs>
            </svg>

            <div className="flex items-center gap-3">
              <button 
                className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-[var(--color-bg-light)]/50 border border-[var(--color-border)] cursor-pointer hover:bg-[var(--color-border)] transition-all group relative overflow-hidden text-xs font-bold uppercase tracking-widest text-[var(--color-text-secondary)]" 
                onClick={handleRemix} 
                title={t.ui.remixButton}
              >
                  <HeadphonesIcon className="w-3.5 h-3.5 relative z-10" />
                  <span className="hidden sm:inline">{t.ui.remixButton}</span>
              </button>
              <div>
                  {/* FORCE TEXT COLOR OVERRIDE FOR LIGHT MODE VISIBILITY */}
                  <h1 
                    className="text-lg font-extrabold tracking-tight rgb-text"
                  >
                    {t.ui.appTitle}
                  </h1>
                  <p 
                    className="text-xs font-mono tracking-widest uppercase text-[var(--color-text-tertiary)]"
                  >
                      v2.0 Pro
                  </p>
              </div>
            </div>

            <div className="flex items-center gap-2 sm:gap-3">
               <button 
                onClick={toggleTheme} 
                className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-[var(--color-bg-light)]/50 border border-[var(--color-border)] hover:bg-[var(--color-border)] transition-all text-[var(--color-text-secondary)] text-xs font-bold uppercase tracking-widest" 
                aria-label={t.ui.toggleThemeButton}
               >
                {theme === 'dark' ? <SunIcon className="w-3.5 h-3.5" /> : <MoonIcon className="w-3.5 h-3.5" />}
                <span className="hidden sm:inline">{t.ui.toggleThemeButton}</span>
              </button>
              
              <button 
                onClick={() => setIsHistoryModalOpen(true)} 
                className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-[var(--color-bg-light)]/50 border border-[var(--color-border)] hover:bg-[var(--color-border)] transition-all text-[var(--color-text-secondary)] text-xs font-bold uppercase tracking-widest" 
                title={t.ui.historyButton}
              >
                <HistoryIcon className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">{t.ui.historyButton}</span>
              </button>
              
              <button 
                onClick={() => setIsHowToUseModalOpen(true)} 
                className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-[var(--color-bg-light)]/50 border border-[var(--color-border)] hover:bg-[var(--color-border)] transition-all text-[var(--color-text-secondary)] text-[10px] font-bold uppercase tracking-widest" 
                title={t.ui.howToUseButton}
              >
                <InfoIcon className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">{t.ui.howToUseButton}</span>
              </button>
            </div>
          </header>

          <div className="flex-grow flex flex-col max-w-4xl mx-auto w-full p-4 sm:p-6 gap-8 pb-32 sm:pb-20">
                <InputForm
                    formState={formState}
                    setFormState={setFormState}
                    onRandomizeMainIdea={handleRandomizeMainIdea}
                    isRandomizingIdea={isRandomizingIdea}
                    pendingIdeaRandomization={pendingIdeaRandomization}
                    onApplyIdeaRandomization={applyIdeaRandomization}
                    onCancelIdeaRandomization={cancelIdeaRandomization}
                    onRandomizeNarrative={handleRandomizeNarrative}
                    isRandomizingNarrative={isRandomizingNarrative}
                    onRandomizeStructure={handleRandomizeStructure}
                    isRandomizingStructure={isRandomizingStructure}
                    onRandomizeStyle={handleRandomizeStyle}
                    isRandomizingStyle={isRandomizingStyle}
                    onAnalyzeArtistStyle={handleAnalyzeArtistStyle}
                    isAnalyzingArtistStyle={isAnalyzingArtistStyle}
                    onRandomizeAll={handleRandomizeAll}
                    isRandomizingAll={isRandomizingAll}
                    pendingRandomization={pendingRandomization}
                    onApplyRandomization={applyRandomization}
                    onCancelRandomization={cancelRandomization}
                    onResetNarrative={resetNarrative}
                    onResetAll={() => setIsResetConfirmOpen(true)}
                    onGenerateSong={handlePreGenerateSong}
                    isLoading={isLoading}
                    onLanguageChange={setLanguage}
                    t={t}
                    activeTab={activeTab}
                    setActiveTab={setActiveTab}
                    onOpenApiKeyModal={openApiKeyModal}
                />

                {/* Result Section - Always present but conditionally renders content */}
                <div ref={resultsRef} className="w-full transition-all duration-500">
                     {(songData || isLoading) && (
                        <div className="animate-fade-in pt-8 border-t border-[var(--color-border)]">
                             <div className="flex items-center gap-2 mb-4">
                                <span className="text-xs font-bold uppercase tracking-widest text-[var(--color-text-tertiary)]">Output</span>
                                <div className="h-px flex-grow bg-[var(--color-border)]"></div>
                             </div>
                             <SongDisplay 
                                songData={songData} 
                                isLoading={isLoading} 
                                songStructure={formState.songStructure}
                                inputs={currentSongInputs}
                            />
                        </div>
                     )}
                </div>
          </div>

          {/* Fixed Bottom Action Bar for Mobile */}
          <div className="fixed bottom-0 left-0 w-full bg-[var(--color-panel)]/95 backdrop-blur border-t border-[var(--color-border)] p-3 sm:hidden z-40 flex gap-3 pb-safe-bottom">
             <button 
                onClick={() => setIsResetConfirmOpen(true)} 
                disabled={isLoading} 
                className="flex-1 btn btn-secondary btn-danger-pro rounded-lg text-sm font-bold uppercase tracking-widest py-3 transition-all active:scale-[0.98]"
            >
                {t.ui.resetButton}
            </button>
             <button 
                onClick={handlePreGenerateSong} 
                disabled={isLoading || isRandomizingAll || isRandomizingNarrative || isRandomizingIdea} 
                className={`flex-1 btn btn-primary btn-neon-flow rounded-lg relative overflow-hidden group py-3 transition-all active:scale-[0.98] ${isLoading ? 'is-loading' : ''}`}
            >
                <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAiIGhlaWdodD0iMjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGNpcmNsZSBjeD0iMSIgY3k9IjEiIHI9IjEiIGZpbGw9InJnYmEoMjU1LDI1NSwyNTUsMC4xKSIvPjwvc3ZnPg==')] opacity-20"></div>
                <div className="relative z-10 flex items-center justify-center gap-3">
                    {isLoading && <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>}
                    <span className="tracking-widest font-black text-sm">{isLoading ? t.ui.submitButtonLoading : t.ui.submitButton}</span>
                </div>
            </button>
          </div>

      </main>
      <ApiKeyModal />
      <BugReportModal />
      <ModelSelectionModal
        isOpen={isModelModalOpen}
        onClose={() => setIsModelModalOpen(false)}
        onSelect={handleGenerateSong}
        currentModel={formState.selectedModel}
      />
      <HowToUseModal 
        isOpen={isHowToUseModalOpen} 
        onClose={() => setIsHowToUseModalOpen(false)} 
      />
      <Suspense fallback={null}>
        {isHistoryModalOpen && (
          <HistoryModal
            isOpen={isHistoryModalOpen}
            onClose={() => setIsHistoryModalOpen(false)}
            history={history}
            onRestore={restoreFromHistory}
            onDelete={deleteHistoryItem}
            onClearAll={clearHistory}
            t={t.ui}
          />
        )}
      </Suspense>
      <Suspense fallback={null}>
          {isSupportModalOpen && (
              <SupportModal
                  isOpen={isSupportModalOpen}
                  onClose={handleCloseSupportModal}
              />
          )}
      </Suspense>
      <ToastContainer />
      <WelcomeModal />
      {isResetConfirmOpen && (
        <ConfirmationDialog
            title={t.ui.confirmResetAllTitle}
            message={t.ui.confirmResetAllMessage}
            onConfirm={handleResetAll}
            onCancel={() => setIsResetConfirmOpen(false)}
            t={t.ui}
        />
      )}
       {rateLimitError && (
          <RateLimitModal
              message={rateLimitError}
              onClose={() => setRateLimitError(null)}
              t={t.ui}
          />
      )}
    </>
  );
};

export default App;
