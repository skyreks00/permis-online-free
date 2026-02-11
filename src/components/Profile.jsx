import React, { useState, useEffect } from 'react';
import { Trophy, Target, AlertTriangle, Clock, Settings, ArrowLeft, LogOut, Key, Github, Save, RefreshCw } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { getUser } from '../utils/githubClient';
import { loadThemeQuestions } from '../utils/contentLoader';

const Profile = ({ progress, themesData, onBack, onReset, instantFeedback, onToggleInstantFeedback, autoPlayAudio, onToggleAutoPlayAudio }) => {
    const navigate = useNavigate();

    // --- Stats Calculation ---
    // Filter progress to only include actual themes (exclude 'erreurs' or other special keys)
    const validThemeIds = new Set((themesData.sections || []).flatMap(s => s.items).map(t => t.id));
    // Also include examen_B if it's considered a valid theme for stats, but usually it is.
    // If 'examen_B' is not in sections items, we might need to add it manually or check how it's handled.
    // Assuming 'themesData' contains all standard themes.

    const progressValues = Object.entries(progress)
        .filter(([key]) => validThemeIds.has(key) || key === 'examen_B') // Include examen_B if needed, but definitely exclude 'erreurs'
        .map(([, value]) => value);

    const totalQuizzes = progressValues.length;
    const totalBestScore = progressValues.reduce((acc, p) => acc + (p.bestScore || p.score || 0), 0);
    const totalMaxPossible = progressValues.reduce((acc, p) => acc + (p.total || 0), 0);
    const averageAccuracy = totalMaxPossible > 0 ? Math.round((totalBestScore / totalMaxPossible) * 100) : 0;
    const totalMistakes = totalMaxPossible - totalBestScore;

    const statedThemes = (themesData.sections || []).flatMap(section => section.items).filter(t => progress[t.id]);

    // --- Developer Mode State ---
    const [apiKey, setApiKey] = useState(() => localStorage.getItem('groq_api_key') || '');
    const [githubToken, setGithubToken] = useState(() => localStorage.getItem('github_token') || '');
    const [githubUser, setGithubUser] = useState(null);
    const [showConfirmReset, setShowConfirmReset] = useState(false);
    const [isLoadingReview, setIsLoadingReview] = useState(false);

    const fetchGithubUser = async (token) => {
        try {
            const user = await getUser(token);
            setGithubUser(user);
        } catch (e) {
            console.error("Invalid token:", e);
            setGithubUser(null);
        }
    };

    useEffect(() => {
        if (githubToken) {
            fetchGithubUser(githubToken);
        }
    }, []);

    const handleSaveKeys = () => {
        if (apiKey) localStorage.setItem('groq_api_key', apiKey);
        else localStorage.removeItem('groq_api_key');

        if (githubToken) {
            localStorage.setItem('github_token', githubToken);
            fetchGithubUser(githubToken);
        } else {
            localStorage.removeItem('github_token');
            setGithubUser(null);
        }
        alert('Paramètres sauvegardés !');
    };

    const handleReview = async (theme) => {
        const p = progress[theme.id];
        if (!p || !p.answers) return;

        setIsLoadingReview(true);
        try {
            // Load questions
            // We use the same loader as QuizPage
            const data = await loadThemeQuestions(theme.file);
            let loadedQuestions = data.questions || [];

            if (loadedQuestions.length === 0) {
                // Fallback fetch if needed
                const base = import.meta.env.BASE_URL || '/';
                const res = await fetch(`${base}data/${theme.file}`);
                const json = await res.json();
                loadedQuestions = json.questions || [];
            }

            // Map answers to questions
            // We need to reconstruct the "questions" array that was used
            // Logic: Filter loadedQuestions to find those present in p.answers
            // If p.answers has questionId, we use it. 
            // Note: If the quiz was random subset, we only want those 50 questions.
            // But usually p.answers contains all answered questions. 

            // Create a map for fast lookup
            const questionMap = new Map(loadedQuestions.map(q => [q.id, q]));

            const reviewQuestions = p.answers.map(ans => questionMap.get(ans.questionId)).filter(Boolean);

            // If for some reason we can't find questions (e.g. content changed), we might have issues.
            // But assuming IDs are stable:

            if (reviewQuestions.length > 0) {
                navigate('/resultats', {
                    state: {
                        results: {
                            score: p.score, // Use the score from that specific run (or bestScore? likely bestScore if we clicked on the item representing best score)
                            // Actually progress stores "score" (last) and "bestScore". 
                            // "answers" usually corresponds to the LAST run. 
                            // If we want to review the BEST run, we would need to save bestRunAnswers.
                            // For now, let's assume "answers" corresponds to the run we want to review.
                            // Limitation: If user retries and gets a worse score, "answers" might be overwritten?
                            // Let's check App.jsx: yes, "answers" is overwritten on every save.
                            // So we are reviewing the LATEST attempt.
                            answers: p.answers,
                            correct: p.score,
                            incorrect: p.total - p.score
                        },
                        questions: reviewQuestions,
                        total: p.total,
                        isExamMode: theme.id.includes('examen')
                    }
                });
            } else {
                alert("Impossible de charger le détail de ce quiz (questions non trouvées).");
            }

        } catch (error) {
            console.error("Failed to load review", error);
            alert("Erreur lors du chargement du quiz.");
        } finally {
            setIsLoadingReview(false);
        }
    };

    const handleStartMistakeQuiz = async () => {
        setIsLoadingReview(true);
        try {
            // 1. Identify all incorrect questions across all themes
            const mistakePromises = Object.entries(progress).map(async ([themeId, p]) => {
                if (!p.answers || p.answers.length === 0) return [];

                // Filter incorrect answers
                const mistakes = p.answers.filter(a => !a.isCorrect);
                if (mistakes.length === 0) return [];

                // We need to fetch the theme file to get the actual question objects
                // Find theme file using themesData
                const allThemes = (themesData.sections || []).flatMap(s => s.items);
                const themeInfo = allThemes.find(t => t.id === themeId);

                if (!themeInfo) return [];

                // Load questions
                const data = await loadThemeQuestions(themeInfo.file);
                let loadedQuestions = data.questions || [];

                if (loadedQuestions.length === 0) {
                    const base = import.meta.env.BASE_URL || '/';
                    const res = await fetch(`${base}data/${themeInfo.file}`);
                    const json = await res.json();
                    loadedQuestions = json.questions || [];
                }

                const questionMap = new Map(loadedQuestions.map(q => [q.id, q]));
                return mistakes.map(m => questionMap.get(m.questionId)).filter(Boolean);
            });

            const results = await Promise.all(mistakePromises);
            const allMistakeQuestions = results.flat();

            if (allMistakeQuestions.length === 0) {
                alert("Aucune erreur trouvée disponible pour la révision.");
                return;
            }

            // 2. Navigate to QuizPage with these questions
            // We use a dummy themeId 'erreurs' but pass data via state
            // QuizPage needs to be updated to inspect location.state
            navigate('/quiz/erreurs', {
                state: {
                    questions: allMistakeQuestions,
                    theme: {
                        id: 'erreurs',
                        name: 'Révision des Erreurs',
                        file: null
                    }
                }
            });

        } catch (error) {
            console.error("Failed to start mistake quiz", error);
            alert("Erreur lors de la préparation du quiz.");
        } finally {
            setIsLoadingReview(false);
        }
    };

    return (
        <div className="page container animate-fade-in" style={{ maxWidth: '1200px' }}>
            <div className="mb-6">
                <button
                    onClick={onBack}
                    className="btn-ghost flex items-center gap-2"
                >
                    <ArrowLeft size={20} /> Retour
                </button>
            </div>

            {/* Stats Grid */}
            <div className="profile-stats-grid">
                <div className="stat-card">
                    <div className="stat-icon primary">
                        <Trophy size={24} />
                    </div>
                    <div className="stat-content">
                        <div className="stat-label">Moyenne Globale</div>
                        <div className="stat-value">{averageAccuracy}%</div>
                    </div>
                </div>
                <div className="stat-card">
                    <div className="stat-icon info">
                        <Target size={24} />
                    </div>
                    <div className="stat-content">
                        <div className="stat-label">Quiz Terminés</div>
                        <div className="stat-value">{totalQuizzes}</div>
                    </div>
                </div>
                <div className="stat-card">
                    <div className="stat-icon danger">
                        <AlertTriangle size={24} />
                    </div>
                    <div className="stat-content">
                        <div className="stat-label">Fautes à revoir</div>
                        <div className="stat-value">{totalMistakes}</div>
                        <div className="stat-sub">{totalMistakes} erreurs au total</div>
                    </div>
                    {totalMistakes > 0 && (
                        <div className="mt-2 flex justify-center">
                            <button
                                onClick={handleStartMistakeQuiz}
                                disabled={isLoadingReview}
                                className="btn-xs btn-primary flex items-center gap-1"
                            >
                                {isLoadingReview ? <span className="loading loading-spinner loading-xs"></span> : <RefreshCw size={12} />}
                                Réviser
                            </button>
                        </div>
                    )}
                </div>
            </div>

            <div className="profile-content-grid">

                {/* Left Column: History & Progress */}
                <div className="card p-6 bg-surface-1 border border-border">
                    <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
                        <Clock size={20} /> Historique par Thème
                    </h2>

                    <div className="theme-history-list">
                        {statedThemes.length === 0 ? (
                            <div className="text-center text-muted py-8">
                                Aucun historique disponible. Commencez un quiz !
                            </div>
                        ) : (
                            statedThemes.map(theme => {
                                const p = progress[theme.id];
                                const best = p.bestScore || p.score || 0;
                                const total = p.total || 0;
                                const acc = total > 0 ? Math.round((best / total) * 100) : 0;
                                const scoreColor = acc >= 80 ? 'text-success' : acc >= 50 ? 'text-warning' : 'text-danger';

                                return (
                                    <div
                                        key={theme.id}
                                        className="theme-history-item cursor-pointer hover:bg-surface-2 transition-colors p-2 rounded"
                                        onClick={() => handleReview(theme)}
                                        title="Cliquez pour revoir vos fautes"
                                    >
                                        <div className="font-medium">{theme.name}</div>
                                        <div className={`font-mono font-bold ${scoreColor}`}>
                                            {best} / {total} ({acc}%)
                                        </div>
                                    </div>
                                );
                            })
                        )}
                    </div>

                    {Object.keys(progress).length > 0 && (
                        <div className="mt-8 pt-6 border-t border-border">
                            {!showConfirmReset ? (
                                <button
                                    onClick={() => setShowConfirmReset(true)}
                                    className="btn-ghost text-danger w-full flex items-center justify-center gap-2"
                                >
                                    <LogOut size={16} /> Réinitialiser la progression
                                </button>
                            ) : (
                                <div className="p-4 border border-danger rounded bg-danger/10 animate-fade-in">
                                    <p className="text-center mb-3 text-danger font-medium">Êtes-vous sûr ?</p>
                                    <div className="flex gap-3">
                                        <button onClick={() => setShowConfirmReset(false)} className="btn-ghost flex-1 text-sm">Annuler</button>
                                        <button onClick={() => { onReset(); setShowConfirmReset(false); }} className="btn-primary bg-danger border-danger hover:bg-danger/90 flex-1 text-white text-sm">Confirmer</button>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* Right Column: Settings & Developer Mode */}
                <div className="settings-list">

                    {/* Preferences Card */}
                    <div className="card p-6 bg-surface-1 border border-border">
                        <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
                            <Settings size={20} /> Préférences
                        </h2>

                        <div className="flex items-center justify-between mb-6">
                            <div>
                                <div className="font-semibold">Correction Instantanée</div>
                                <div className="text-sm text-muted">Voir la réponse juste après le clic.</div>
                            </div>
                            <label className="switch">
                                <input type="checkbox" checked={instantFeedback} onChange={onToggleInstantFeedback} />
                                <span className="slider round"></span>
                            </label>
                        </div>

                        <div className="flex items-center justify-between">
                            <div>
                                <div className="font-semibold">Lecture Audio Auto</div>
                                <div className="text-sm text-muted">Lire la question automatiquement.</div>
                            </div>
                            <label className="switch">
                                <input type="checkbox" checked={autoPlayAudio} onChange={onToggleAutoPlayAudio} />
                                <span className="slider round"></span>
                            </label>
                        </div>
                    </div>

                    {/* Developer / Contributor Card */}
                    <div className="card p-6 border-2 border-primary/20 bg-surface-1">
                        <h2 className="text-xl font-bold mb-4 flex items-center gap-2 text-primary">
                            <Key size={20} /> Mode Contributeur
                        </h2>

                        <div className="mb-5">
                            <label className="block mb-1.5 font-semibold text-sm">Groq API Key</label>
                            <p className="text-xs text-muted mb-2">
                                Requise pour corrections IA (Llama 3). <a href="https://console.groq.com/keys" target="_blank" rel="noreferrer" className="text-primary underline">Obtenir une clé</a>
                            </p>
                            <input
                                type="password"
                                className="input w-full"
                                value={apiKey}
                                onChange={e => setApiKey(e.target.value)}
                                placeholder="gsk_..."
                            />
                        </div>

                        <div className="mb-6">
                            <label className="block mb-1.5 font-semibold text-sm flex items-center gap-2">
                                <Github size={16} /> GitHub Token (Optionnel)
                            </label>
                            <p className="text-xs text-muted mb-2">
                                Requis pour proposer des corrections (Pull Requests).
                                <br />
                                <a href="https://github.com/settings/tokens/new?scopes=public_repo" target="_blank" rel="noreferrer" className="text-primary underline font-medium">
                                    Générer un token (Classic)
                                </a> avec le scope <code>public_repo</code>.
                            </p>

                            <input
                                type="password"
                                className="input w-full mb-3"
                                value={githubToken}
                                onChange={e => setGithubToken(e.target.value)}
                                placeholder="ghp_..."
                            />

                            {githubUser && (
                                <div className="flex items-center gap-2 p-2 bg-success/10 rounded-lg text-success text-sm border border-success/20">
                                    <img src={githubUser.avatar_url} alt="" style={{ width: '24px', height: '24px', borderRadius: '50%' }} />
                                    <span>Connecté en tant que <strong>{githubUser.login}</strong></span>
                                </div>
                            )}
                        </div>

                        <button onClick={handleSaveKeys} className="btn-primary w-full flex items-center justify-center gap-2">
                            <Save size={18} /> Enregistrer les clés
                        </button>
                    </div>
                </div>
            </div>

            <div className="h-10"></div>
        </div>
    );
};

export default Profile;
