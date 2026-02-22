import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { BookOpen, RotateCcw, PlayCircle, FileText, Sparkles, Settings2, ArrowLeft, CheckCircle, ChevronDown, ChevronUp, Filter, Search, BrainCircuit, Zap, ChevronRight } from 'lucide-react';
import Quiz from '../components/Quiz';
import CountUp from '../components/CountUp';
import ShinyText from '../components/ShinyText';
import Hyperspeed from '../components/Hyperspeed';
import { loadThemeQuestions, loadThemesIndex } from '../utils/contentLoader';

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

const Toggle = React.memo(({ checked, onChange, label, colorOn = '#22c55e' }) => (
    <label className="eb-toggle-row">
        <span className="eb-toggle-label">{label}</span>
        <button
            role="switch"
            aria-checked={checked}
            className={`eb-toggle ${checked ? 'eb-toggle--on' : ''}`}
            style={{ 
                '--on-color': colorOn,
                '--on-color-rgb': hexToRgb(colorOn)
            }}
            onClick={() => onChange(!checked)}
        >
            <span className="eb-toggle-thumb" />
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
const StatsHeader = React.memo(({ pctMastered, stats, isLoading }) => (
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
            <div className="eb-stat eb-stat--new">
                <GradientNum value={isLoading ? 0 : stats.newCount} gradient="linear-gradient(135deg, #38bdf8, #0ea5e9)" />
                <div className="eb-stat-lbl">Nouvelles</div>
            </div>
            <div className="eb-stat eb-stat--review">
                <GradientNum value={stats.toReviewCount} gradient="linear-gradient(135deg, #fbbf24, #f59e0b)" />
                <div className="eb-stat-lbl">À revoir</div>
            </div>
            <div className="eb-stat eb-stat--mastered">
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

const ThemeFilter = React.memo(({ themes, selectedThemes, setSelectedThemes, isThemesExpanded, setIsThemesExpanded, themeSearch, setThemeSearch }) => (
    <>
        <div 
            className="eb-toggle-row" 
            onClick={() => setIsThemesExpanded(!isThemesExpanded)}
        >
            <span className="eb-toggle-label" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <Filter size={18} />
                Filtrer par thèmes ({selectedThemes.size}/{themes.length})
            </span>
            <div style={{ color: 'var(--muted)' }}>
                {isThemesExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
            </div>
        </div>

        <div className="eb-theme-filter-section" style={{ margin: 0, border: 'none', borderRadius: 0, background: 'transparent' }}>
            {isThemesExpanded && themes.length > 0 && (
                <div className="eb-theme-grid-wrap anim-slide-down">
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
                            .filter(t => t.name.toLowerCase().includes(themeSearch.toLowerCase()))
                            .map(theme => {
                                const isActive = selectedThemes.has(theme.id);
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
                                    >
                                        {theme.name}
                                    </button>
                                );
                            })}
                    </div>
                </div>
            )}
            {isThemesExpanded && themes.length === 0 && (
                <div className="eb-theme-loading">
                    <span>Chargement des catégories...</span>
                </div>
            )}
        </div>
    </>
));

const ExamenBPage = ({ autoPlayAudio }) => {
    const navigate = useNavigate();
    const [allQuestions, setAllQuestions] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [mastered, setMastered] = useState(() => loadSet(STORAGE_MASTERED));
    const [toReview, setToReview] = useState(() => loadSet(STORAGE_TO_REVIEW));
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

                // Load Theory Themes for filtering asynchronously
                loadThemesIndex().then(async (themesIndex) => {
                    if (themesIndex && themesIndex.sections) {
                        const allTheoryItems = [];
                        themesIndex.sections.forEach(section => {
                            if (section.title.toLowerCase().includes('examen') || section.title.toLowerCase() === 'debug') return;
                            if (section.items) {
                                section.items.forEach(item => {
                                    if (item.file) {
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
                        }
                    }
                });
            } catch (e) {
                console.error(e);
                setIsLoading(false);
            }
        };
        load();
    }, []);

    // 1. Separate questions by type (Themed vs Exclusive) for more clarity
    const themedQuestionsPool = useMemo(() => {
        return allQuestions.filter(q => {
            const cleanText = q.question.trim().toLowerCase().replace(/\s+/g, ' ');
            return !!questionToThemeMap[cleanText];
        });
    }, [allQuestions, questionToThemeMap]);

    const exclusiveQuestionsPool = useMemo(() => {
        return allQuestions.filter(q => {
            const cleanText = q.question.trim().toLowerCase().replace(/\s+/g, ' ');
            return !questionToThemeMap[cleanText];
        });
    }, [allQuestions, questionToThemeMap]);

    // 2. Base selection pool (Additive: Themed Selection + Exclusive Selection)
    const baseSelectionPool = useMemo(() => {
        let pool = [];

        // Apply theme filter to themed portion
        if (themes.length === 0 || selectedThemes.size === themes.length) {
            pool.push(...themedQuestionsPool);
        } else if (selectedThemes.size > 0) {
            pool.push(...themedQuestionsPool.filter(q => {
                const cleanText = q.question.trim().toLowerCase().replace(/\s+/g, ' ');
                const tids = questionToThemeMap[cleanText];
                return tids && [...tids].some(tid => selectedThemes.has(tid));
            }));
        }

        // Add exclusive portion IF active
        if (includeExclusive) {
            pool.push(...exclusiveQuestionsPool);
        }

        return pool;
    }, [themedQuestionsPool, exclusiveQuestionsPool, themes, selectedThemes, includeExclusive, questionToThemeMap]);

    const stats = useMemo(() => {
        const total = allQuestions.length;
        const masteredCount = mastered.size;
        const toReviewCount = toReview.size;
        const newCount = allQuestions.filter(q => !mastered.has(q.id) && !toReview.has(q.id)).length;
        
        // Counts WITHIN THE SELECTION (for Nouvelles/Erreurs)
        const selectionNewCount = baseSelectionPool.filter(q => !mastered.has(q.id) && !toReview.has(q.id)).length;
        const selectionToReviewCount = baseSelectionPool.filter(q => toReview.has(q.id)).length;
        const selectionMasteredCount = baseSelectionPool.filter(q => mastered.has(q.id)).length;
        
        // Total count of exclusive questions (independent of theme filter)
        const totalByExclusive = exclusiveQuestionsPool.length;

        return { 
            total, masteredCount, toReviewCount, newCount,
            selectionNewCount, selectionToReviewCount, selectionMasteredCount,
            totalByExclusive
        };
    }, [allQuestions, mastered, toReview, baseSelectionPool, exclusiveQuestionsPool]);

    // Final filtered pool for the quiz
    const pool = useMemo(() => {
        let filtered = [];
        if (includeNew) filtered.push(...baseSelectionPool.filter(q => !mastered.has(q.id) && !toReview.has(q.id)));
        if (includeErrors) filtered.push(...baseSelectionPool.filter(q => toReview.has(q.id)));
        if (includeMastered) filtered.push(...baseSelectionPool.filter(q => mastered.has(q.id)));
        return filtered;
    }, [baseSelectionPool, includeNew, includeErrors, includeMastered, mastered, toReview]);


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

        setViewMode('config');
        setQuizQuestions([]);
    }, [mastered, toReview, quizQuestions, navigate]);

    const handleReset = useCallback(() => {
        if (!window.confirm('Remettre toute la progression à zéro ?')) return;
        const empty = new Set();
        saveSet(STORAGE_MASTERED, empty);
        saveSet(STORAGE_TO_REVIEW, empty);
        setMastered(empty);
        setToReview(empty);
    }, []);

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
                />

                <section className="eb-card">
                    <div className="eb-card-header">
                        <Settings2 size={17} />
                        Configurer le quiz
                    </div>

                    <div className="eb-toggles">
                        <Toggle
                            checked={includeNew}
                            onChange={setIncludeNew}
                            label={`Nouvelles questions — ${isLoading ? '…' : stats.selectionNewCount} dispo`}
                            colorOn="#0ea5e9"
                        />
                        <div className="eb-toggle-divider" />
                        <Toggle
                            checked={includeExclusive}
                            onChange={setIncludeExclusive}
                                    label={`Questions exclusives — ${isLoading ? '…' : stats.totalByExclusive} dispo`}
                            colorOn="#a855f7"
                        />
                        <div className="eb-toggle-divider" />
                        <Toggle
                            checked={includeErrors}
                            onChange={setIncludeErrors}
                            label={`Erreurs à réviser — ${stats.selectionToReviewCount} dispo`}
                            colorOn="#f59e0b"
                        />
                        <div className="eb-toggle-divider" />
                        <Toggle
                            checked={includeMastered}
                            onChange={setIncludeMastered}
                                    label={`Questions maîtrisées — ${stats.selectionMasteredCount} dispo`}
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
                        />
                    </div>


                    {pool.length > 0 && (
                        <LiquidSlider 
                            poolLength={pool.length}
                            quizSize={quizSize}
                            setQuizSize={setQuizSize}
                        />
                    )}

                    {baseSelectionPool.length === 0 && !isLoading && (
                        <div className="eb-empty-warn">
                            Sélectionne au moins un thème ou le mode exclusif pour continuer.
                        </div>
                    )}
                    {baseSelectionPool.length > 0 && pool.length === 0 && !isLoading && (
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
