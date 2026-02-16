import React, { useState, useEffect } from 'react';
import { Trophy, Target, AlertTriangle, Clock, Settings, ArrowLeft, CheckCircle2, Circle, Volume2, User, LogOut, Key, Github, Save, Filter, RefreshCcw } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { loadThemeQuestions } from '../utils/contentLoader';
import { loginWithGitHub, logout, auth } from '../utils/firebase';
import { GithubAuthProvider } from 'firebase/auth';

const Profile = ({ progress, themesData, onBack, onReset, instantFeedback, onToggleInstantFeedback, autoPlayAudio, onToggleAutoPlayAudio }) => {
    const navigate = useNavigate();
    const [showErrorsOnly, setShowErrorsOnly] = useState(false);
    const [isLoadingReview, setIsLoadingReview] = useState(false);

    // --- Stats Calculation ---
    const getNormalizedProgress = (p) => {
        const score = p.bestScore !== undefined ? p.bestScore : (p.score || 0);
        const total = p.totalQuestions !== undefined ? p.totalQuestions : (p.total || 0);
        return { score, total };
    };

    const progressValues = Object.entries(progress)
        .filter(([key]) => key !== 'metadata')
        .map(([, value]) => value);
    const totalQuizzes = progressValues.length;
    
    const globalStats = progressValues.reduce((acc, p) => {
        const { score, total } = getNormalizedProgress(p);
        return {
            bestScore: acc.bestScore + score,
            totalQuestions: acc.totalQuestions + total
        };
    }, { bestScore: 0, totalQuestions: 0 });

    const totalBestScore = globalStats.bestScore;
    const totalMaxPossible = globalStats.totalQuestions;
    const averageAccuracy = totalMaxPossible > 0 ? Math.round((totalBestScore / totalMaxPossible) * 100) : 0;
    const totalMistakes = totalMaxPossible - totalBestScore;

    const statedThemes = (themesData.sections || [])
        .flatMap(section => section.items || section.themes || [])
        .filter(t => t && t.id && t.id !== 'metadata' && progress[t.id]);

    const filteredThemes = showErrorsOnly 
        ? statedThemes.filter(t => {
            const { score, total } = getNormalizedProgress(progress[t.id]);
            return score < total;
        })
        : statedThemes;

    const [apiKey, setApiKey] = useState(() => localStorage.getItem('groq_api_key') || '');
    const [githubUser, setGithubUser] = useState(auth.currentUser);
    const [showConfirmReset, setShowConfirmReset] = useState(false);

    useEffect(() => {
        const unsubscribe = auth.onAuthStateChanged((user) => {
            setGithubUser(user);
        });
        return () => unsubscribe();
    }, []);

    const handleLogin = async () => {
        try {
            setIsLoadingReview(true);
            const result = await loginWithGitHub();
            const credential = GithubAuthProvider.credentialFromResult(result);
            const token = credential.accessToken;
            if (token) {
                localStorage.setItem('github_token', token);
            }
        } catch (e) {
            console.error("Login failed:", e);
            alert("Erreur de connexion : " + e.message);
        } finally {
            setIsLoadingReview(false);
        }
    };

    const handleLogout = async () => {
        try {
            await logout();
            localStorage.removeItem('github_token');
        } catch (e) {
            console.error("Logout failed:", e);
        }
    };

    const handleSaveKeys = () => {
        if (apiKey) localStorage.setItem('groq_api_key', apiKey);
        else localStorage.removeItem('groq_api_key');
        alert('Clé IA sauvegardée !');
    };

    const handleReview = async (theme) => {
        setIsLoadingReview(true);
        try {
            // Load questions for the theme
            let questions = [];
            try {
                const data = await loadThemeQuestions(theme.file);
                questions = data.questions || [];
            } catch (e) {
                // Fallback fetch
                const res = await fetch(`data/${theme.file}`);
                const json = await res.json();
                questions = json.questions || [];
            }

            if (questions.length === 0) {
                alert("Impossible de charger les questions pour la révision.");
                return;
            }

            const p = progress[theme.id];
            const savedAnswers = p.answers || []; // Array of { questionId, userAnswer, isCorrect ... } (hopefully)

            // Map saved answers to questions by ID
            // If p.answers is array of objects with questionId, great.
            // If it's old array of undefined/objects, we try our best.
            // Current Quiz.jsx saves: { questionId, userAnswer, correctAnswer, isCorrect }
            
            const questionsToReview = [];
            
            // Iterate over SAVED ANSWERS if available to match with questions
            if (savedAnswers.length > 0) {
                savedAnswers.forEach((ans) => {
                    if (ans && ans.isCorrect === false) {
                        // Use loose equality for ID matching
                        const q = questions.find(q => q.id == ans.questionId);
                        if (q) {
                            // Attach originalThemeId and sourceFile for tracking
                            questionsToReview.push({ 
                                ...q, 
                                originalThemeId: theme.id,
                                sourceFile: theme.file 
                            });
                        }
                    }
                });
            }

            if (questionsToReview.length === 0) {
                alert("Erreur: Impossible de retrouver les questions.");
                return;
            }



            navigate('/quiz/review', {
                state: {
                    questions: questionsToReview,
                    title: `Révision: ${theme.name}`,
                    isReview: true
                }
            });

        } catch (error) {
            console.error("Erreur révision:", error);
            alert("Erreur lors du chargement de la révision.");
        } finally {
            setIsLoadingReview(false);
        }
    };

    const handleReviewAll = async () => {
        setIsLoadingReview(true);
        try {
            const allErrors = [];
            
            // Get all themes that have progress
            const themesToReview = statedThemes.filter(t => {
                const { score, total } = getNormalizedProgress(progress[t.id]);
                return score < total;
            });

            if (themesToReview.length === 0) {
                alert("Aucune faute à réviser !");
                setIsLoadingReview(false);
                return;
            }

            for (const theme of themesToReview) {
                 let questions = [];
                try {
                    const data = await loadThemeQuestions(theme.file);
                    questions = data.questions || [];
                } catch (e) {
                    const res = await fetch(`data/${theme.file}`);
                    const json = await res.json();
                    questions = json.questions || [];
                }

                const p = progress[theme.id];
                const savedAnswers = p.answers || [];

                if (savedAnswers.length > 0) {
                     savedAnswers.forEach((ans) => {
                        if (ans && ans.isCorrect === false) {
                            // Use loose equality
                            const q = questions.find(q => q.id == ans.questionId);
                            if (q) {
                                // Include themeId and sourceFile so we can patch it later
                                allErrors.push({ 
                                    q, 
                                    a: ans, 
                                    idx: allErrors.length, 
                                    themeId: theme.id,
                                    sourceFile: theme.file 
                                });
                            }
                        }
                    });
                }
            }

            if (allErrors.length === 0) {
                alert("Aucune erreur trouvée dans les sauvegardes.");
                return;
            }

            // Extract just the question objects, injecting the theme ID for tracking
            const questionsToReview = allErrors.map(item => ({
                ...item.q,
                originalThemeId: item.themeId,
                sourceFile: item.sourceFile
            }));

            navigate('/quiz/review', {
                state: {
                    questions: questionsToReview,
                    title: "Révision des fautes (Global)",
                    isReview: true
                }
            });

        } catch(e) {
            console.error(e);
            alert("Erreur lors de la préparation de la révision globale.");
        } finally {
             setIsLoadingReview(false);
        }
    };

    if (isLoadingReview) {
        return <div className="page container flex items-center justify-center h-screen">Chargement de la révision...</div>;
    }

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
                <div className="stat-card relative overflow-hidden">
                    <div className="stat-icon danger">
                        <AlertTriangle size={24} />
                    </div>
                    <div className="stat-content z-10 relative w-full">
                        <div className="stat-label">Fautes à revoir</div>
                        <div className="stat-value">{totalMistakes}</div>
                        <div className="flex flex-row items-center justify-between w-full mt-1">
                            <div className="stat-sub">{totalMistakes} erreurs au total</div>
                            {totalMistakes > 0 && (
                                <button 
                                    onClick={handleReviewAll}
                                    className="btn-primary btn-sm flex items-center gap-1 px-3 py-2"
                                >
                                    <RefreshCcw size={16} /> Réviser
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            <div className="profile-content-grid">

                {/* Left Column: History & Progress */}
                <div className="card p-6 bg-surface-1 border border-border">
                    <div className="flex items-center justify-between mb-6">
                        <h2 className="text-xl font-bold flex items-center gap-2">
                            <Clock size={20} /> Historique
                        </h2>
                        <button
                            onClick={() => setShowErrorsOnly(!showErrorsOnly)}
                            className={`btn-sm flex items-center gap-2 ${showErrorsOnly ? 'btn-danger' : 'btn-ghost'}`}
                        >
                            <Filter size={16} /> {showErrorsOnly ? 'Tout voir' : 'Voir les fautes'}
                        </button>
                    </div>

                    <div className="theme-history-list">
                        {filteredThemes.length === 0 ? (
                            <div className="text-center text-muted py-8">
                                {showErrorsOnly ? 'Aucune faute trouvée ! Bravo ! 🎉' : 'Aucun historique disponible. Commencez un quiz !'}
                            </div>
                        ) : (
                            filteredThemes.map(theme => {
                                const p = progress[theme.id];
                                const { score, total } = getNormalizedProgress(p);
                                const acc = total > 0 ? Math.round((score / total) * 100) : 0;
                                
                                // Color Logic: Green ONLY for 100%
                                // Orange for >= 50% but < 100%
                                // Red for < 50%
                                let scoreColor;
                                if (acc === 100) scoreColor = 'text-success';
                                else if (acc >= 50) scoreColor = 'text-warning';
                                else scoreColor = 'text-danger';

                                return (
                                    <div key={theme.id} className="theme-history-item flex items-center justify-between">
                                        <div>
                                            <div className="font-medium">{theme.name}</div>
                                            <div className={`font-mono font-bold ${scoreColor}`}>
                                                {score} / {total} ({acc}%)
                                            </div>
                                        </div>
                                        {score < total && (
                                            <button 
                                                onClick={() => handleReview(theme)}
                                                className="btn-ghost text-primary btn-sm flex items-center gap-1 hover:bg-primary/10"
                                            >
                                                <RefreshCcw size={14} /> Réviser
                                            </button>
                                        )}
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
                                <Github size={16} /> Synchronisation GitHub
                            </label>
                            <p className="text-xs text-muted mb-4">
                                Connectez-vous à GitHub pour sauvegarder votre progression automatiquement.
                            </p>

                            {!githubUser ? (
                                <button onClick={handleLogin} className="btn-secondary w-full flex items-center justify-center gap-2 py-3 border-2 border-primary/20 hover:border-primary/50 transition-all">
                                    <Github size={20} /> Se connecter avec GitHub
                                </button>
                            ) : (
                                <div className="space-y-3">
                                    <div className="flex items-center justify-between p-3 bg-success/10 rounded-lg text-success text-sm border border-success/20">
                                        <div className="flex items-center gap-2">
                                            {githubUser.photoURL ? (
                                                <img src={githubUser.photoURL} alt="" style={{ width: '32px', height: '32px', borderRadius: '50%' }} />
                                            ) : (
                                                <User size={24} />
                                            )}
                                            <div className="flex flex-col">
                                                <span className="font-bold">{githubUser.displayName || githubUser.email}</span>
                                                <span className="text-[10px] opacity-70">Connecté via Firebase</span>
                                            </div>
                                        </div>
                                        <button onClick={handleLogout} className="p-1 hover:bg-danger/20 rounded-full text-danger transition-colors" title="Se déconnecter">
                                            <LogOut size={18} />
                                        </button>
                                    </div>
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
