import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { BookOpen, RotateCcw, PlayCircle, FileText, Sparkles, Settings2, ArrowLeft, CheckCircle, ChevronDown, ChevronUp, Filter, Search, BrainCircuit, Zap, ChevronRight, Star, RotateCw, Trophy, Info } from 'lucide-react';
import Quiz from '../components/Quiz';
import CountUp from '../components/CountUp';
import ShinyText from '../components/ShinyText';
import Hyperspeed from '../components/Hyperspeed';
import { loadThemeQuestions, loadThemesIndex } from '../utils/contentLoader';
import { analyzeMistakes } from '../utils/groq';
import ReactMarkdown from 'react-markdown';


const STORAGE_MASTERED = 'examen_b_mastered';
const STORAGE_TO_REVIEW = 'examen_b_to_review';

function loadSet(key) {
    try {
        const raw = localStorage.getItem(key);
        return raw ? new Set(JSON.parse(raw)) : new Set();
    } catch {
        return new Set();
    }
}

function saveSet(key, set) {
    localStorage.setItem(key, JSON.stringify([...set]));
}

function shuffle(arr) {
    const a = [...arr];
    for (let i = a.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
}

const GradientNum = ({ value, gradient = 'linear-gradient(135deg, #a855f7, #3b82f6)' }) => (
    <span style={{
        background: gradient,
        WebkitBackgroundClip: 'text',
        WebkitTextFillColor: 'transparent',
        backgroundClip: 'text',
        display: 'inline-block',
        fontWeight: 900,
        letterSpacing: '-0.04em',
        lineHeight: 1,
        fontSize: '28px',
    }}>
        <CountUp from={0} to={value} duration={1.2} />
    </span>
);

const hexToRgb = (hex) => {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? `${parseInt(result[1], 16)}, ${parseInt(result[2], 16)}, ${parseInt(result[3], 16)}` : '34, 197, 94';
}

const Toggle = React.memo(({ checked, onChange, label, colorOn = '#22c55e', disabled = false }) => (
    <label className={`eb-toggle-row ${disabled ? 'eb-toggle-row--disabled' : ''}`}>
        <span className="eb-toggle-label" style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', opacity: disabled ? 0.5 : 1 }}>{label}</span>
        <button
            role="switch"
            aria-checked={disabled ? false : checked}
            disabled={disabled}
            className={`eb-toggle ${(checked && !disabled) ? 'eb-toggle--on' : ''}`}
            style={{ 
                '--on-color': colorOn,
                '--on-color-rgb': hexToRgb(colorOn),
                cursor: disabled ? 'not-allowed' : 'pointer',
                opacity: disabled ? 0.3 : 1
            }}
            onClick={() => !disabled && onChange(!checked)}
        >
            <span className="eb-toggle-thumb" style={{ transform: (checked && !disabled) ? 'translateX(18px)' : 'translateX(0)' }} />
        </button>
    </label>
));

const LiquidSlider = React.memo(({ poolLength, quizSize, setQuizSize }) => {
    const [localVal, setLocalVal] = useState(quizSize === 9999 ? poolLength : Math.min(quizSize, poolLength));
    const [localInput, setLocalInput] = useState((quizSize === 9999 ? poolLength : Math.min(quizSize, poolLength)).toString());
    const debounceRef = useRef(null);

    useEffect(() => {
        const targetVal = quizSize === 9999 ? poolLength : Math.min(quizSize, poolLength);
        setLocalVal(targetVal);
        setLocalInput(targetVal.toString());
    }, [quizSize, poolLength]);

    const handleSliderChange = (e) => {
        const val = parseInt(e.target.value, 10);
        setLocalVal(val);
        setLocalInput(val.toString());
        
        // Debounce update to parent to avoid lag during drag
        if (debounceRef.current) clearTimeout(debounceRef.current);
        debounceRef.current = setTimeout(() => {
            setQuizSize(val >= poolLength ? 9999 : val);
        }, 16); // ~60fps
    };

    const handleInputChange = (e) => {
        setLocalInput(e.target.value);
    };

    const handleInputBlur = () => {
        let val = parseInt(localInput, 10);
        if (isNaN(val) || val < 1) val = 1;
        const finalVal = val >= poolLength ? 9999 : val;
        setQuizSize(finalVal);
        const displayVal = finalVal === 9999 ? poolLength : finalVal;
        setLocalVal(displayVal);
        setLocalInput(displayVal.toString());
    };

    return (
        <div className="eb-liquid-slider-container">
            <div className="eb-liquid-header">
                <label className="eb-liquid-label">Volume de questions</label>
            </div>

            <div className="eb-liquid-wrapper" style={{ 
                '--progress': poolLength > 1 ? (localVal - 1) / (poolLength - 1) : 1
            }}>
                <div className="eb-liquid-bubble">
                    <input 
                        type="text" 
                        inputMode="numeric"
                        pattern="[0-9]*"
                        className="eb-liquid-bubble-input"
                        value={localInput}
                        onChange={handleInputChange}
                        onBlur={handleInputBlur}
                        onKeyDown={(e) => e.key === 'Enter' && e.target.blur()}
                        aria-label="Nombre de questions"
                    />
                    <div className="eb-liquid-bubble-tail" />
                </div>

                <div className="eb-liquid-track">
                    <div className="eb-liquid-fill">
                        <div className="eb-liquid-waves" />
                        <div className="eb-liquid-glow" />
                    </div>
                    
                    <input
                        type="range"
                        min="1"
                        max={poolLength || 1}
                        step="1"
                        value={localVal}
                        onChange={handleSliderChange}
                        className="eb-liquid-input"
                        aria-label="Nombre de questions"
                    />

                    <div className="eb-liquid-thumb">
                        <div className="eb-liquid-thumb-core" />
                        <div className="eb-liquid-thumb-aura" />
                    </div>
                </div>
            </div>

            <div className="eb-liquid-scale">
                <span>1</span>
                <span>{poolLength}</span>
            </div>

            {quizSize !== 9999 && quizSize > poolLength && poolLength > 0 && (
                <div className="eb-size-warning" style={{ marginTop: '30px' }}>
                    Seulement <strong>{poolLength}</strong> questions disponibles.
                </div>
            )}
        </div>
    );
});
const StatsHeader = React.memo(({ pctMastered, stats, isLoading, onLaunchSpecial, onAiAnalysis, isAnalyzing }) => (
    <>
        <header className="eb-hero">
            <div className="eb-hero-badge">
                Examen Blanc B
            </div>
            <h1 className="eb-hero-title">
                Maîtrise les{' '}
                <ShinyText
                    text="1 500 questions"
                    color="#f59e0b"
                    shineColor="#fde68a"
                    speed={4}
                    spread={70}
                />
            </h1>
            <p className="eb-hero-sub">
                Les bonnes réponses disparaissent. Les erreurs reviennent jusqu'à maîtrise totale.
            </p>
            <div className="eb-resources-row">
                <a href={`${import.meta.env.BASE_URL || '/'}pdf/syntheseB.pdf`} target="_blank" rel="noreferrer" className="eb-resource-pill">
                    <FileText size={14} /> Synthèse B
                </a>
            </div>
        </header>

        <div className="eb-stats-row">
            <div className="eb-stat eb-stat--new" onClick={() => onLaunchSpecial('new')} style={{ cursor: 'pointer' }}>
                <GradientNum value={isLoading ? 0 : stats.newCount} gradient="linear-gradient(135deg, #38bdf8, #0ea5e9)" />
                <div className="eb-stat-lbl">Nouvelles</div>
            </div>
            <div className="eb-stat eb-stat--review" onClick={() => onLaunchSpecial('review')} style={{ cursor: 'pointer', position: 'relative' }}>
                <GradientNum value={stats.toReviewCount} gradient="linear-gradient(135deg, #fbbf24, #f59e0b)" />
                <div className="eb-stat-lbl">À revoir</div>
            </div>
            <div className="eb-stat eb-stat--mastered" onClick={() => onLaunchSpecial('mastered')} style={{ cursor: 'pointer' }}>
                <GradientNum value={stats.masteredCount} gradient="linear-gradient(135deg, #4ade80, #22c55e)" />
                <div className="eb-stat-lbl">Maîtrisées</div>
            </div>
            <div className="eb-stat eb-stat--total">
                <GradientNum value={isLoading ? 0 : stats.total} gradient="linear-gradient(135deg, #c084fc, #a855f7)" />
                <div className="eb-stat-lbl">Total</div>
            </div>
        </div>

        <div className="eb-progress-track">
            <div className="eb-progress-fill" style={{ width: `${pctMastered}%` }} />
            <span className="eb-progress-txt">{pctMastered}% maîtrisé</span>
        </div>
    </>
));

const ThemeFilter = React.memo(({ 
    themes, 
    selectedThemes, 
    setSelectedThemes, 
    isThemesExpanded, 
    setIsThemesExpanded, 
    themeSearch, 
    setThemeSearch,
    questionCountPerTheme
}) => (
    <>
        <div 
            className="eb-toggle-row" 
            onClick={() => setIsThemesExpanded(!isThemesExpanded)}
            style={{ cursor: 'pointer' }}
        >
            <span className="eb-toggle-label" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <Filter size={18} />
                Filtrer par thèmes ({selectedThemes.size}/{themes.length})
            </span>
            <div style={{ color: 'var(--muted)' }}>
                {isThemesExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
            </div>
        </div>

        {isThemesExpanded && (
            <div className="eb-theme-filter-section anim-slide-down" style={{ margin: '10px 0 0 0', border: 'none', borderRadius: 0, background: 'transparent' }}>
                {themes.length > 0 ? (
                    <div className="eb-theme-grid-wrap">
                        <div className="eb-theme-actions">
                            <div className="eb-theme-search">
                                <Search size={14} />
                                <input 
                                    type="text" 
                                    placeholder="Rechercher un thème..." 
                                    value={themeSearch}
                                    onChange={(e) => setThemeSearch(e.target.value)}
                                />
                            </div>
                            <div style={{ display: 'flex', gap: '8px' }}>
                                <button onClick={() => setSelectedThemes(new Set(themes.map(t => t.id)))}>Tout cocher</button>
                                <button onClick={() => setSelectedThemes(new Set())}>Tout décocher</button>
                            </div>
                        </div>
                        <div className="eb-theme-grid">
                            {themes
                                .filter(t => t.name.toLowerCase().includes(themeSearch.toLowerCase()) && !t.id.includes('orphelines') && !t.name.toLowerCase().includes('non classées'))
                                .map(theme => {
                                    const isActive = selectedThemes.has(theme.id);
                                    const questionCount = questionCountPerTheme[theme.id] || 0;
                                    return (
                                        <button
                                            key={theme.id}
                                            className={`eb-theme-pill ${isActive ? 'active' : ''}`}
                                            onClick={() => {
                                                const next = new Set(selectedThemes);
                                                if (isActive) next.delete(theme.id);
                                                else next.add(theme.id);
                                                setSelectedThemes(next);
                                            }}
                                            title={`${questionCount} question${questionCount > 1 ? 's' : ''}`}
                                        >
                                            {theme.name} <span style={{opacity: 0.6, fontSize: '0.85em'}}>({questionCount})</span>
                                        </button>
                                    );
                                })}
                        </div>
                    </div>
                ) : (
                    <div className="eb-theme-loading">
                        <span>Chargement des catégories...</span>
                    </div>
                )}
            </div>
        )}
    </>
));

const ExamenBPage = ({ autoPlayAudio, progress, onSaveProgress }) => {
    const navigate = useNavigate();
    const [allQuestions, setAllQuestions] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isMappingLoading, setIsMappingLoading] = useState(true);

    // Initialize from props.progress if available, else fallback to localStorage
    const [mastered, setMastered] = useState(() => {
        if (progress?.examen_B?.mastered) return new Set(progress.examen_B.mastered);
        return loadSet(STORAGE_MASTERED);
    });
    const [toReview, setToReview] = useState(() => {
        if (progress?.examen_B?.toReview) return new Set(progress.examen_B.toReview);
        return loadSet(STORAGE_TO_REVIEW);
    });
    const [quizMode, setQuizMode] = useState(null);
    const [quizQuestions, setQuizQuestions] = useState([]);

    const [includeNew, setIncludeNew] = useState(true);
    const [includeExclusive, setIncludeExclusive] = useState(false);
    const [includeErrors, setIncludeErrors] = useState(false);
    const [includeMastered, setIncludeMastered] = useState(false);
    const [quizSize, setQuizSize] = useState(50);
    const [viewMode, setViewMode] = useState('config'); // 'config' | 'quiz' | 'list'
    const [listTitle, setListTitle] = useState('');
    const [visibleCount, setVisibleCount] = useState(100);

    // New theme filtering states
    const [themes, setThemes] = useState([]);
    const [selectedThemes, setSelectedThemes] = useState(new Set());
    const [questionToThemeMap, setQuestionToThemeMap] = useState({});
    const [isThemesExpanded, setIsThemesExpanded] = useState(false);
    const [themeSearch, setThemeSearch] = useState('');
    const [aiQuestions, setAiQuestions] = useState([]);
    const [aiReport, setAiReport] = useState(null);
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [exclusiveIds, setExclusiveIds] = useState(new Set());


    const BASE = import.meta.env.BASE_URL || '/';

    useEffect(() => {
        const load = async () => {
            try {
                // Load Examen B Questions
                const data = await loadThemeQuestions('examen_B.json');
                let loaded = data.questions || [];
                if (loaded.length === 0) {
                    const res = await fetch(`${BASE}data/examen_B.json`);
                    const json = await res.json();
                    loaded = json.questions || [];
                }
                setAllQuestions(loaded);
                setIsLoading(false); // Enable counts immediately

                // Load Exclusive Questions IDs
                try {
                  const exclusiveData = await loadThemeQuestions('permis_B_orphelines.json');
                  if (exclusiveData && exclusiveData.questions) {
                    setExclusiveIds(new Set(exclusiveData.questions.map(q => q.id)));
                  }
                } catch (err) {
                  console.error("Failed to load exclusive IDs", err);
                }

                // Load Theory Themes for filtering asynchronously
                loadThemesIndex().then(async (themesIndex) => {
                    if (themesIndex && themesIndex.sections) {
                        const allTheoryItems = [];
                        themesIndex.sections.forEach(section => {
                            if (section.title.toLowerCase().includes('examen') || section.title.toLowerCase() === 'debug') return;
                            if (section.items) {
                                section.items.forEach(item => {
                                    if (item.file && !item.id.includes('orphelines')) {
                                      allTheoryItems.push(item);
                                    }
                                });
                            }
                        });
                        
                        if (allTheoryItems.length > 0) {
                            setThemes(allTheoryItems);
                            setSelectedThemes(new Set(allTheoryItems.map(i => i.id)));

                            const mapping = {};
                            await Promise.all(allTheoryItems.map(async (item) => {
                                try {
                                    const themeData = await loadThemeQuestions(item.file);
                                    if (themeData && themeData.questions) {
                                        themeData.questions.forEach(q => {
                                            const cleanText = q.question.trim().toLowerCase().replace(/\s+/g, ' ');
                                            if (!mapping[cleanText]) mapping[cleanText] = new Set();
                                            mapping[cleanText].add(item.id);
                                        });
                                    }
                                } catch (err) {}
                            }));
                            setQuestionToThemeMap(mapping);
                            setIsMappingLoading(false);
                        }
                    }
                });
            } catch (e) {
                console.error(e);
                setIsLoading(false);
                setIsMappingLoading(false);
            }
        };
        load();
    }, []);

    // Sync state when global progress (from cloud) changes
    useEffect(() => {
        if (progress?.examen_B) {
            if (progress.examen_B.mastered) setMastered(new Set(progress.examen_B.mastered));
            if (progress.examen_B.toReview) setToReview(new Set(progress.examen_B.toReview));
        }
    }, [progress?.examen_B]);

    // 1. Separate questions by type
    const themedQuestionsPool = useMemo(() => {
        // By default, ALL questions are themed (they might be in a theory theme)
        return allQuestions;
    }, [allQuestions]);

    const exclusiveQuestionsPool = useMemo(() => {
        // Only questions from the explicit orphan file
        return allQuestions.filter(q => exclusiveIds.has(q.id));
    }, [allQuestions, exclusiveIds]);

    // 2. Base selection pool: (Themed questions in selected themes) + (Exclusive questions IF toggled ON)
    const activeSelectionPool = useMemo(() => {
        // Calculate THEMED subset based on current theme selection
        let themedFiltered = [];
        if (themes.length > 0) {
            if (selectedThemes.size === themes.length) {
                themedFiltered = allQuestions; 
            } else if (selectedThemes.size > 0) {
                themedFiltered = allQuestions.filter(q => {
                    const cleanText = q.question.trim().toLowerCase().replace(/\s+/g, ' ');
                    const tids = questionToThemeMap[cleanText];
                    return tids && [...tids].some(tid => selectedThemes.has(tid));
                });
            }
        }
            
        const poolSet = new Set(themedFiltered.map(q => q.id));
        if (includeExclusive) {
            exclusiveQuestionsPool.forEach(q => poolSet.add(q.id));
        }
        
        // Return original objects to preserve properties
        const idToQuestion = new Map(allQuestions.map(q => [q.id, q]));
        return [...poolSet].map(id => idToQuestion.get(id)).filter(Boolean);
    }, [allQuestions, exclusiveQuestionsPool, themes, selectedThemes, questionToThemeMap, includeExclusive]);

    const stats = useMemo(() => {
        const total = allQuestions.length;
        const masteredCount = mastered.size;
        const toReviewCount = toReview.size;
        const newCount = allQuestions.filter(q => !mastered.has(q.id) && !toReview.has(q.id)).length;
        
        // Category counts
        const orphanCount = exclusiveQuestionsPool.length;
        
        // Counts WITHIN THE CURRENT SELECTION (respecting theme filter + exclusive toggle)
        const selectionNewCount = activeSelectionPool.filter(q => !mastered.has(q.id) && !toReview.has(q.id)).length;
        const selectionToReviewCount = activeSelectionPool.filter(q => toReview.has(q.id)).length;
        const selectionMasteredCount = activeSelectionPool.filter(q => mastered.has(q.id)).length;
        
        // Count matching exclusive questions independently of their selection status
        // so the label shows the potential contribution to the "activeSelectionPool".
        const anyStatusFilter = includeNew || includeErrors || includeMastered;
        const exclusiveMatchingStatusCount = exclusiveQuestionsPool.filter(q => {
            const isNew = !mastered.has(q.id) && !toReview.has(q.id);
            const isError = toReview.has(q.id);
            const isMast = mastered.has(q.id);
            
            if (!anyStatusFilter) return true;
            return (includeNew && isNew) || (includeErrors && isError) || (includeMastered && isMast);
        }).length;

        // If Category is OFF, we follow user request and show 0 dispo? 
        // No, let's keep showing potential so they know what turning it ON adds.
        // BUT for the statuses, if themes are 0 and exclusive is OFF, show 0.

        return { 
            total, masteredCount, toReviewCount, newCount, orphanCount,
            selectionNewCount, selectionToReviewCount, selectionMasteredCount,
            totalByExclusive: exclusiveMatchingStatusCount
        };
    }, [allQuestions, mastered, toReview, activeSelectionPool, exclusiveQuestionsPool, includeNew, includeErrors, includeMastered]);

    // Count questions per theme - ONLY questions that exist in examen_B
    const questionCountPerTheme = useMemo(() => {
        const counts = {};
        themes.forEach(theme => {
            counts[theme.id] = 0;
        });
        
        // Only count questions from examen_B that are mapped to each theme
        allQuestions.forEach(q => {
            const cleanText = q.question.trim().toLowerCase().replace(/\s+/g, ' ');
            const themeIdSet = questionToThemeMap[cleanText];
            if (themeIdSet instanceof Set) {
                themeIdSet.forEach(themeId => {
                    if (counts.hasOwnProperty(themeId)) {
                        counts[themeId]++;
                    }
                });
            }
        });
        
        return counts;
    }, [themes, questionToThemeMap, allQuestions]);


    // Final filtered pool for the quiz
    const pool = useMemo(() => {
        let filtered = [];
        
        // We use activeSelectionPool which already includes exclusive if toggled
        if (includeNew) filtered.push(...activeSelectionPool.filter(q => !mastered.has(q.id) && !toReview.has(q.id)));
        if (includeErrors) filtered.push(...activeSelectionPool.filter(q => toReview.has(q.id)));
        if (includeMastered) filtered.push(...activeSelectionPool.filter(q => mastered.has(q.id)));

        return filtered;
    }, [activeSelectionPool, includeNew, includeErrors, includeMastered, mastered, toReview]);


    const handleLaunch = useCallback(() => {
        const shuffled = shuffle(pool);
        setQuizQuestions(shuffled.slice(0, quizSize));
        setViewMode('quiz');
    }, [pool, quizSize]);

    const handleLaunchSpecial = useCallback((type) => {
        let filtered = [];
        let title = '';
        if (type === 'new') {
            filtered = allQuestions.filter(q => !mastered.has(q.id) && !toReview.has(q.id));
            title = 'Nouvelles questions';
        } else if (type === 'review') {
            filtered = allQuestions.filter(q => toReview.has(q.id));
            title = 'Questions à revoir';
        } else if (type === 'mastered') {
            filtered = allQuestions.filter(q => mastered.has(q.id));
            title = 'Questions maîtrisées';
        }
        
        if (filtered.length === 0) return;
        
        setQuizQuestions(filtered);
        setListTitle(title);
        setVisibleCount(100);
        setViewMode('list');
    }, [allQuestions, mastered, toReview]);

    const handleFinish = useCallback(({ score, answers }) => {
        const newMastered = new Set(mastered);
        const newToReview = new Set(toReview);
        (answers || []).forEach(ans => {
            if (!ans) return;
            if (ans.isCorrect) {
                newMastered.add(ans.questionId);
                newToReview.delete(ans.questionId);
            } else {
                newToReview.add(ans.questionId);
            }
        });
        saveSet(STORAGE_MASTERED, newMastered);
        saveSet(STORAGE_TO_REVIEW, newToReview);
        setMastered(newMastered);
        setToReview(newToReview);
        
        // Cloud Sync
        if (onSaveProgress) {
            onSaveProgress(newMastered, newToReview);
        }
        
        // Navigate to results
        navigate('/resultats', {
            state: {
                score,
                total: quizQuestions.length,
                questions: quizQuestions,
                answers: answers,
                isExamMode: true,
                themeId: 'examen_B'
            }
        });

        setQuizQuestions([]);
    }, [mastered, toReview, quizQuestions, navigate]);

    const handleAiAnalysis = async (customQuestions = null) => {
        const apiKey = localStorage.getItem('groq_api_key');
        if (!apiKey) {
            alert("Veuillez d'abord configurer votre clé API Groq dans les paramètres.");
            return;
        }

        const mistakesQuestions = customQuestions || allQuestions.filter(q => toReview.has(q.id));
        if (mistakesQuestions.length === 0) {
            alert("Aucune erreur à analyser !");
            return;
        }

        setIsAnalyzing(true);
        setAiReport(null);

        try {
            const dataToAnalyze = mistakesQuestions.map(q => {
                const cleanText = q.question.trim().toLowerCase().replace(/\s+/g, ' ');
                const themeIds = questionToThemeMap[cleanText];
                const themeNames = themeIds 
                    ? [...themeIds].map(id => themes.find(t => t.id === id)?.name).filter(Boolean)
                    : ["Non classé"];
                return {
                    question: q.question,
                    themes: themeNames
                };
            });

            const report = await analyzeMistakes(dataToAnalyze, apiKey);
            setAiReport(report);
            
            // Scroll to report
            setTimeout(() => {
                const reportEl = document.querySelector('.eb-ai-report');
                if (reportEl) reportEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }, 100);

        } catch (err) {
            alert("Erreur lors de l'analyse : " + err.message);
        } finally {
            setIsAnalyzing(false);
        }
    };

    const handleReset = useCallback(() => {
        if (!window.confirm('Remettre toute la progression à zéro ?')) return;
        const empty = new Set();
        saveSet(STORAGE_MASTERED, empty);
        saveSet(STORAGE_TO_REVIEW, empty);
        setMastered(empty);
        setToReview(empty);
        if (onSaveProgress) {
            onSaveProgress(empty, empty);
        }
    }, [onSaveProgress]);

    if (viewMode === 'quiz') {
        return (
            <div style={{ paddingTop: '70px' }}>
                <Quiz
                    questions={quizQuestions}
                    themeName="Examen Blanc B"
                    onFinish={handleFinish}
                    onExit={() => setViewMode('config')}
                    instantFeedback={false}
                    autoPlayAudio={autoPlayAudio}
                    fileName="examen_B.json"
                />
            </div>
        );
    }

    if (viewMode === 'list') {
        return (
            <div className="eb-page eb-list-page">
                <div className="eb-list-header">
                    <button className="eb-back-btn" onClick={() => setViewMode('config')}>
                        <ArrowLeft size={18} /> Retour
                    </button>
                    <div className="eb-list-title-wrap">
                        <h1 className="eb-list-title">{listTitle}</h1>
                        
                        <div className="eb-list-meta">
                            <span className="eb-list-count">{quizQuestions.length} question{quizQuestions.length > 1 ? 's' : ''}</span>

                            {listTitle === 'Questions à revoir' && (
                                <button 
                                    className={`eb-ai-mini-btn ${isAnalyzing ? 'is-analyzing' : ''}`}
                                    onClick={() => handleAiAnalysis()}
                                    disabled={isAnalyzing}
                                    title="Lancer l'analyse pédagogique IA"
                                >
                                    <BrainCircuit size={16} />
                                    <span>{isAnalyzing ? "..." : "Analyser"}</span>
                                    {!isAnalyzing && <Sparkles size={12} className="eb-ai-sparkle" />}
                                </button>
                            )}
                            
                            <div className="eb-list-limit-selector">
                                <span className="eb-limit-label">Afficher :</span>
                                {[50, 100, 500, 'Tout'].map(limit => {
                                    const isToutActive = limit === 'Tout' && visibleCount >= quizQuestions.length && visibleCount !== 50 && visibleCount !== 100 && visibleCount !== 500;
                                    const isNumActive = typeof limit === 'number' && visibleCount === limit;
                                    
                                    return (
                                        <button 
                                            key={limit}
                                            className={`eb-limit-btn ${isNumActive || isToutActive ? 'active' : ''}`}
                                            onClick={() => setVisibleCount(limit === 'Tout' ? quizQuestions.length : limit)}
                                        >
                                            {limit}
                                        </button>
                                    );
                                })}
                            </div>
                        </div>
                    </div>
                </div>

                {listTitle === 'Questions à revoir' && aiReport && (
                    <div className="eb-ai-report-global-wrap anim-slide-down" style={{ marginBottom: '20px', padding: '0 20px' }}>
                         <div className="eb-ai-report" style={{ 
                            background: 'rgba(255, 255, 255, 0.03)', 
                            padding: '20px', 
                            borderRadius: '12px',
                            border: '1px solid rgba(168, 85, 247, 0.2)',
                            lineHeight: '1.6',
                            fontSize: '15px',
                            color: 'var(--text)',
                            position: 'relative'
                        }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '15px', color: '#a855f7' }}>
                                <BrainCircuit size={20} />
                                <span style={{ fontWeight: 700 }}>Analyse Pédagogique IA</span>
                            </div>
                            <ReactMarkdown>{aiReport}</ReactMarkdown>
                            <button 
                                onClick={() => setAiReport(null)}
                                style={{ marginTop: '15px', fontSize: '12px', color: 'var(--muted)', background: 'none', border: 'none', cursor: 'pointer', textDecoration: 'underline' }}
                            >
                                Masquer l'analyse
                            </button>
                        </div>
                    </div>
                )}

                <div className="eb-question-list">
                    {quizQuestions.slice(0, visibleCount).map((q, idx) => (
                        <div className="eb-list-card" key={q.id}>
                            <div className="eb-list-card-header">
                                <span className="eb-card-num">Question {idx + 1}</span>
                                <span className="eb-card-id">#{q.id}</span>
                            </div>
                            <div className="eb-list-card-body">
                                <div className="eb-card-img">
                                    {q.image ? <img src={q.image} alt="" /> : <div className="eb-img-placeholder" />}
                                </div>
                                <div className="eb-card-content">
                                    <div className="eb-card-question">{q.question}</div>
                                    
                                    {q.propositions && Array.isArray(q.propositions) && (
                                        <div className="eb-card-props">
                                            {q.propositions.map(p => (
                                                <div 
                                                    key={p.letter} 
                                                    className={`eb-prop-item ${p.letter === q.correctAnswer ? 'is-correct' : ''}`}
                                                >
                                                    <span className="eb-prop-letter">{p.letter}</span>
                                                    <span className="eb-prop-text">{p.text}</span>
                                                </div>
                                            ))}
                                        </div>
                                    )}

                                    {q.type === 'yes_no' && (
                                        <div className="eb-card-props">
                                            <div className={`eb-prop-item ${q.correctAnswer === 'OUI' ? 'is-correct' : ''}`}>
                                                <span className="eb-prop-letter">A</span>
                                                <span className="eb-prop-text">Oui</span>
                                            </div>
                                            <div className={`eb-prop-item ${q.correctAnswer === 'NON' ? 'is-correct' : ''}`}>
                                                <span className="eb-prop-letter">B</span>
                                                <span className="eb-prop-text">Non</span>
                                            </div>
                                        </div>
                                    )}

                                    <div className="eb-card-answer">
                                        <CheckCircle size={16} className="text-success" />
                                        <strong>Réponse attendue :</strong> {
                                            q.type === 'yes_no' 
                                                ? (q.correctAnswer === 'OUI' ? 'Oui (A)' : 'Non (B)')
                                                : q.correctAnswer
                                        }
                                    </div>
                                    {q.explanation && (
                                        <div className="eb-card-explanation">
                                            <div className="eb-expl-tag">ASTUCE</div>
                                            {q.explanation
                                                .replace(/^\s*INFO\W*PERMIS\W*DE\W*CONDUIRE\W*/i, "")
                                                .replace(/^\s*Signification\W*/i, "")
                                                .replace(/^\s*Explication\W*/i, "")
                                                .replace(/^\s*LE(?:Ç|C)ON\s*\d+(?:\s*[–\-:]\s*[^.\n]*)?(?:[.\n]\s*)?/i, "")
                                                .trim()}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                {visibleCount < quizQuestions.length && (
                    <div className="eb-load-more-wrap">
                        <button 
                            className="eb-load-more-btn" 
                            onClick={() => setVisibleCount(prev => prev + 100)}
                        >
                            Charger 100 questions supplémentaires
                        </button>
                        <p className="eb-load-more-info">
                            Affichage : {visibleCount} sur {quizQuestions.length}
                        </p>
                    </div>
                )}
            </div>
        );
    }

    const pctMastered = stats.total > 0 ? Math.round((stats.masteredCount / stats.total) * 100) : 0;
    const canLaunch = !isLoading && pool.length > 0;
    const launchCount = Math.min(pool.length, quizSize);

    return (
        <>
            <Hyperspeed />
            <div className="eb-page">

                <StatsHeader 
                    pctMastered={pctMastered}
                    stats={stats}
                    isLoading={isLoading}
                    onLaunchSpecial={handleLaunchSpecial}
                    isAnalyzing={isAnalyzing}
                />

                {aiReport && (
                    <div className="eb-ai-report-global-wrap anim-slide-down" style={{ marginBottom: '20px' }}>
                         <div className="eb-ai-report" style={{ 
                            background: 'rgba(255, 255, 255, 0.03)', 
                            padding: '20px', 
                            borderRadius: '12px',
                            border: '1px solid rgba(168, 85, 247, 0.2)',
                            lineHeight: '1.6',
                            fontSize: '15px',
                            color: 'var(--text)',
                            position: 'relative'
                        }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '15px', color: '#a855f7' }}>
                                <BrainCircuit size={20} />
                                <span style={{ fontWeight: 700 }}>Analyse Pédagogique IA</span>
                            </div>
                            <ReactMarkdown>{aiReport}</ReactMarkdown>
                            <button 
                                onClick={() => setAiReport(null)}
                                style={{ marginTop: '15px', fontSize: '12px', color: 'var(--muted)', background: 'none', border: 'none', cursor: 'pointer', textDecoration: 'underline' }}
                            >
                                Fermer le rapport
                            </button>
                        </div>
                    </div>
                )}

                <section className="eb-card">
                    <div className="eb-card-header">
                        <Settings2 size={17} />
                        Configurer le quiz
                    </div>

                    <div className="eb-toggles">
                        {selectedThemes.size === 0 && (
                            <div className="eb-config-hint">
                                <Info size={14} /> Sélectionnez au moins un thème pour configurer le quiz
                            </div>
                        )}
                        
                        <Toggle
                            checked={includeNew}
                            onChange={setIncludeNew}
                            label={<><Sparkles size={16} /> Nouvelles questions — {isLoading ? '…' : stats.selectionNewCount} dispo</>}
                            disabled={selectedThemes.size === 0}
                            colorOn="#0ea5e9"
                        />
                        <div className="eb-toggle-divider" />
                        <Toggle
                            checked={includeExclusive}
                            onChange={setIncludeExclusive}
                            label={<><Zap size={16} /> Questions exclusives — {isLoading ? '…' : (selectedThemes.size > 0 ? stats.totalByExclusive : 0)} dispo</>}
                            disabled={selectedThemes.size === 0}
                            colorOn="#a855f7"
                        />
                        <div className="eb-toggle-divider" />
                        <Toggle
                            checked={includeErrors}
                            onChange={setIncludeErrors}
                            label={<><RotateCw size={16} /> Erreurs à réviser — {stats.selectionToReviewCount} dispo</>}
                            disabled={selectedThemes.size === 0}
                            colorOn="#f59e0b"
                        />
                        <div className="eb-toggle-divider" />
                        <Toggle
                            checked={includeMastered}
                            onChange={setIncludeMastered}
                            label={<><Trophy size={16} /> Questions maîtrisées — {stats.selectionMasteredCount} dispo</>}
                            disabled={selectedThemes.size === 0}
                            colorOn="#22c55e"
                        />
                        <ThemeFilter 
                            themes={themes}
                            selectedThemes={selectedThemes}
                            setSelectedThemes={setSelectedThemes}
                            isThemesExpanded={isThemesExpanded}
                            setIsThemesExpanded={setIsThemesExpanded}
                            themeSearch={themeSearch}
                            setThemeSearch={setThemeSearch}
                            questionCountPerTheme={questionCountPerTheme}
                        />
                    </div>

                    {pool.length > 0 && (
                        <LiquidSlider 
                            poolLength={pool.length}
                            quizSize={quizSize}
                            setQuizSize={setQuizSize}
                        />
                    )}

                    {!isMappingLoading && (activeSelectionPool.length === 0) && !isLoading && (
                        <div className="eb-empty-warn">
                            Sélectionne au moins un thème ou le mode exclusif pour continuer.
                        </div>
                    )}
                    {!isMappingLoading && (activeSelectionPool.length > 0) && pool.length === 0 && !isLoading && (
                        <div className="eb-empty-warn">
                            Aucune question ne correspond aux filtres sélectionnés (Nouvelles/Erreurs/Maîtrisées).
                        </div>
                    )}



                    <button className="eb-launch-btn" onClick={handleLaunch} disabled={!canLaunch}>

                        {isLoading ? 'Chargement…' : canLaunch ? (
                            <><PlayCircle size={20} /> Lancer · {launchCount} question{launchCount > 1 ? 's' : ''}</>
                        ) : 'Aucune question sélectionnée'}
                    </button>
                </section>

                {stats.masteredCount === stats.total && stats.total > 0 && (
                    <div className="eb-congrats">
                        Félicitations ! Tu as maîtrisé toutes les questions de l'Examen B !
                    </div>
                )}

                <button className="eb-reset-btn" onClick={handleReset}>
                    <RotateCcw size={13} /> Réinitialiser la progression
                </button>
            </div>
        </>
    );
};

export default ExamenBPage;
