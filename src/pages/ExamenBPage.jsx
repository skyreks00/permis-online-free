import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { BookOpen, RotateCcw, PlayCircle, FileText, Sparkles, Settings2 } from 'lucide-react';
import Quiz from '../components/Quiz';
import CountUp from '../components/CountUp';
import ShinyText from '../components/ShinyText';
import Hyperspeed from '../components/Hyperspeed';
import { loadThemeQuestions } from '../utils/contentLoader';

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

const Toggle = ({ checked, onChange, label, colorOn = '#22c55e' }) => (
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
);

const ExamenBPage = ({ autoPlayAudio }) => {
    const [allQuestions, setAllQuestions] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [mastered, setMastered] = useState(() => loadSet(STORAGE_MASTERED));
    const [toReview, setToReview] = useState(() => loadSet(STORAGE_TO_REVIEW));
    const [quizMode, setQuizMode] = useState(null);
    const [quizQuestions, setQuizQuestions] = useState([]);

    const [includeNew, setIncludeNew] = useState(true);
    const [includeErrors, setIncludeErrors] = useState(false);
    const [includeMastered, setIncludeMastered] = useState(false);
    const [quizSize, setQuizSize] = useState(50);

    const BASE = import.meta.env.BASE_URL || '/';

    useEffect(() => {
        const load = async () => {
            try {
                const data = await loadThemeQuestions('examen_B.json');
                let loaded = data.questions || [];
                if (loaded.length === 0) {
                    const res = await fetch(`${BASE}data/examen_B.json`);
                    const json = await res.json();
                    loaded = json.questions || [];
                }
                setAllQuestions(loaded);
            } catch (e) {
                console.error(e);
            } finally {
                setIsLoading(false);
            }
        };
        load();
    }, []);

    const stats = useMemo(() => {
        const total = allQuestions.length;
        const masteredCount = mastered.size;
        const toReviewCount = toReview.size;
        const newCount = allQuestions.filter(q => !mastered.has(q.id) && !toReview.has(q.id)).length;
        return { total, masteredCount, toReviewCount, newCount };
    }, [allQuestions, mastered, toReview]);

    const pool = useMemo(() => {
        let result = [];
        if (includeNew) result.push(...allQuestions.filter(q => !mastered.has(q.id) && !toReview.has(q.id)));
        if (includeErrors) result.push(...allQuestions.filter(q => toReview.has(q.id)));
        if (includeMastered) result.push(...allQuestions.filter(q => mastered.has(q.id)));
        return result;
    }, [allQuestions, mastered, toReview, includeNew, includeErrors, includeMastered]);

    const handleLaunch = useCallback(() => {
        const shuffled = shuffle(pool);
        setQuizQuestions(shuffled.slice(0, quizSize));
        setQuizMode('custom');
    }, [pool, quizSize]);

    const handleFinish = useCallback(({ answers }) => {
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
        setQuizMode(null);
        setQuizQuestions([]);
    }, [mastered, toReview]);

    const handleReset = useCallback(() => {
        if (!window.confirm('Remettre toute la progression à zéro ?')) return;
        const empty = new Set();
        saveSet(STORAGE_MASTERED, empty);
        saveSet(STORAGE_TO_REVIEW, empty);
        setMastered(empty);
        setToReview(empty);
    }, []);

    if (quizMode) {
        return (
            <div style={{ paddingTop: '70px' }}>
                <Quiz
                    questions={quizQuestions}
                    themeName="Examen Blanc B"
                    onFinish={handleFinish}
                    onExit={() => setQuizMode(null)}
                    instantFeedback={false}
                    autoPlayAudio={autoPlayAudio}
                    fileName="examen_B.json"
                />
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

                <header className="eb-hero">
                    <div className="eb-hero-badge">
                        <Sparkles size={13} />
                        Examen Blanc B
                    </div>
                    <h1 className="eb-hero-title">
                        Maîtrise les{' '}
                        <ShinyText
                            text="1 501 questions"
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
                        <a href={`${BASE}lecon/syntheseB.pdf`} target="_blank" rel="noreferrer" className="eb-resource-pill">
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

                <section className="eb-card">
                    <div className="eb-card-header">
                        <Settings2 size={17} />
                        Configurer le quiz
                    </div>

                    <div className="eb-toggles">
                        <Toggle
                            checked={includeNew}
                            onChange={setIncludeNew}
                            label={`✨ Nouvelles questions — ${isLoading ? '…' : stats.newCount} dispo`}
                            colorOn="#0ea5e9"
                        />
                        <div className="eb-toggle-divider" />
                        <Toggle
                            checked={includeErrors}
                            onChange={setIncludeErrors}
                            label={`🔁 Erreurs à réviser — ${stats.toReviewCount} dispo`}
                            colorOn="#f59e0b"
                        />
                        <div className="eb-toggle-divider" />
                        <Toggle
                            checked={includeMastered}
                            onChange={setIncludeMastered}
                            label={`🏆 Questions maîtrisées — ${stats.masteredCount} dispo`}
                            colorOn="#22c55e"
                        />
                    </div>

                    <div className="eb-size-row" style={{ padding: '20px 24px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', width: '100%' }}>
                            <label className="eb-size-label" style={{ margin: 0, opacity: 0.8, whiteSpace: 'nowrap', minWidth: 'fit-content' }}>
                                Nombre de questions
                            </label>
                            
                            <div className="eb-slider-container" style={{ flex: 1, margin: 0 }}>
                                <div className="eb-slider-wrapper" style={{ height: '24px' }}>
                                    <input
                                        type="range"
                                        min="1"
                                        max={pool.length || 1}
                                        step="1"
                                        value={quizSize === 9999 ? pool.length : Math.min(quizSize, pool.length)}
                                        onChange={e => {
                                            const val = parseInt(e.target.value, 10);
                                            setQuizSize(val >= pool.length ? 9999 : val);
                                        }}
                                        className="eb-range-input"
                                        style={{
                                            background: `linear-gradient(to right, var(--primary) ${((quizSize === 9999 ? pool.length : Math.min(quizSize, pool.length)) / pool.length) * 100}%, rgba(255, 255, 255, 0.05) ${((quizSize === 9999 ? pool.length : Math.min(quizSize, pool.length)) / pool.length) * 100}%)`,
                                            margin: 0
                                        }}
                                    />
                                </div>
                            </div>

                            <div className="eb-slider-value-badge" style={{ minWidth: '70px', height: '36px' }}>
                                {quizSize >= pool.length || quizSize === 9999 ? 'Toutes' : quizSize}
                            </div>
                        </div>

                        {pool.length > 0 && quizSize !== 9999 && quizSize > pool.length && (
                            <div style={{ marginTop: '16px', fontSize: '0.8rem', color: '#f59e0b', padding: '10px', background: 'rgba(245, 158, 11, 0.05)', borderRadius: '10px', border: '1px solid rgba(245, 158, 11, 0.1)' }}>
                                ⚠️ Seulement <strong>{pool.length}</strong> questions disponibles.
                            </div>
                        )}
                    </div>

                    {pool.length === 0 && !isLoading && (
                        <div className="eb-empty-warn">
                            ⚠️ Active au moins un type de questions pour lancer le quiz.
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
                        🏆 Félicitations ! Tu as maîtrisé toutes les questions de l'Examen B !
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
