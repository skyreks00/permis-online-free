import React, { useState, useEffect } from 'react';
import { Trophy, Target, AlertTriangle, Clock, Settings, ArrowLeft, CheckCircle2, Circle, Volume2, User, LogOut, Key, Github, Save } from 'lucide-react';
import { getUser } from '../utils/githubClient';

const Profile = ({ progress, themesData, onBack, onReset, instantFeedback, onToggleInstantFeedback, autoPlayAudio, onToggleAutoPlayAudio }) => {
    // --- Stats Calculation ---
    const progressValues = Object.values(progress);
    const totalQuizzes = progressValues.length;
    const totalBestScore = progressValues.reduce((acc, p) => acc + p.bestScore, 0);
    const totalMaxPossible = progressValues.reduce((acc, p) => acc + p.totalQuestions, 0);
    const averageAccuracy = totalMaxPossible > 0 ? Math.round((totalBestScore / totalMaxPossible) * 100) : 0;
    const totalMistakes = totalMaxPossible - totalBestScore;

    const statedThemes = (themesData.sections || []).flatMap(section => section.items).filter(t => progress[t.id]);

    // --- Developer Mode State ---
    const [apiKey, setApiKey] = useState(() => localStorage.getItem('gemini_api_key') || '');
    const [githubToken, setGithubToken] = useState(() => localStorage.getItem('github_token') || '');
    const [githubUser, setGithubUser] = useState(null);
    const [showConfirmReset, setShowConfirmReset] = useState(false);

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
        if (apiKey) localStorage.setItem('gemini_api_key', apiKey);
        else localStorage.removeItem('gemini_api_key');

        if (githubToken) {
            localStorage.setItem('github_token', githubToken);
            fetchGithubUser(githubToken);
        } else {
            localStorage.removeItem('github_token');
            setGithubUser(null);
        }
        alert('Paramètres sauvegardés !');
    };

    return (
        <div className="page container animate-fade-in" style={{ maxWidth: '1200px' }}>
            {/* Header */}
            <div className="flex items-center justify-between mb-8">
                <button onClick={onBack} className="btn-ghost flex items-center gap-2 pl-0 font-medium">
                    <ArrowLeft size={20} /> Retour à l'accueil
                </button>
                <h1 className="text-3xl font-bold m-0">Mon Profil</h1>
            </div>

            {/* Stats Row */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-10">
                <div className="card p-5 flex items-center gap-4 border-none bg-surface-2">
                    <div className="w-12 h-12 rounded-xl bg-primary/20 text-primary grid place-items-center">
                        <Trophy size={24} />
                    </div>
                    <div>
                        <div className="text-muted text-sm mb-1">Moyenne Globale</div>
                        <div className="text-3xl font-bold leading-none">{averageAccuracy}%</div>
                    </div>
                </div>
                <div className="card p-5 flex items-center gap-4 border-none bg-surface-2">
                    <div className="w-12 h-12 rounded-xl bg-info/20 text-info grid place-items-center">
                        <Target size={24} />
                    </div>
                    <div>
                        <div className="text-muted text-sm mb-1">Quiz Terminés</div>
                        <div className="text-3xl font-bold leading-none">{totalQuizzes}</div>
                    </div>
                </div>
                <div className="card p-5 flex items-center gap-4 border-none bg-surface-2">
                    <div className="w-12 h-12 rounded-xl bg-danger/20 text-danger grid place-items-center">
                        <AlertTriangle size={24} />
                    </div>
                    <div>
                        <div className="text-muted text-sm mb-1">Fautes à revoir</div>
                        <div className="text-3xl font-bold leading-none">{totalMistakes}</div>
                        <div className="text-xs text-muted mt-1">{totalMistakes} erreurs au total</div>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-[1fr_380px] gap-8 items-start">

                {/* Left Column: History & Progress */}
                <div>
                    <h2 className="text-xl font-bold mb-5 flex items-center gap-2">
                        <Clock size={20} /> Historique par Thème
                    </h2>

                    <div className="flex flex-col gap-3">
                        {statedThemes.length === 0 ? (
                            <div className="card p-8 text-center bg-surface-2 border-none text-muted">
                                Aucun historique disponible. Commencez un quiz !
                            </div>
                        ) : (
                            statedThemes.map(theme => {
                                const p = progress[theme.id];
                                const acc = p.totalQuestions > 0 ? Math.round((p.bestScore / p.totalQuestions) * 100) : 0;
                                const scoreColor = acc >= 80 ? 'text-success' : acc >= 50 ? 'text-warning' : 'text-danger';

                                return (
                                    <div key={theme.id} className="card p-4 bg-surface-2 border-none flex justify-between items-center">
                                        <div className="font-medium">{theme.name}</div>
                                        <div className={`font-mono font-bold ${scoreColor}`}>
                                            {p.bestScore} / {p.totalQuestions} ({acc}%)
                                        </div>
                                    </div>
                                );
                            })
                        )}
                    </div>

                    {Object.keys(progress).length > 0 && (
                        <div className="mt-8">
                            {!showConfirmReset ? (
                                <button
                                    onClick={() => setShowConfirmReset(true)}
                                    className="btn-ghost text-danger w-full flex items-center justify-center gap-2"
                                >
                                    <LogOut size={16} /> Réinitialiser la progression
                                </button>
                            ) : (
                                <div className="p-4 border border-danger rounded bg-danger/10">
                                    <p className="text-center mb-3 text-danger font-medium">Êtes-vous sûr ? Cette action est irréversible.</p>
                                    <div className="flex gap-3">
                                        <button onClick={() => setShowConfirmReset(false)} className="btn-ghost flex-1">Annuler</button>
                                        <button onClick={() => { onReset(); setShowConfirmReset(false); }} className="btn-primary bg-danger border-danger hover:bg-danger/90 flex-1 text-white">Confirmer</button>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* Right Column: Settings & Developer Mode */}
                <div className="flex flex-col gap-6">

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
                            <label className="block mb-1.5 font-semibold text-sm">Gemini API Key</label>
                            <p className="text-xs text-muted mb-2">Requise pour générer des corrections IA.</p>
                            <input
                                type="password"
                                className="input w-full"
                                value={apiKey}
                                onChange={e => setApiKey(e.target.value)}
                                placeholder="AIzaSy..."
                            />
                        </div>

                        <div className="mb-6">
                            <label className="block mb-1.5 font-semibold text-sm flex items-center gap-2">
                                <Github size={16} /> GitHub Token (Optionnel)
                            </label>
                            <p className="text-xs text-muted mb-2">
                                Requis pour proposer des corrections (Pull Requests).
                                <br />
                                <a href="https://github.com/settings/tokens/new?scopes=public_repo" target="_blank" rel="noreferrer" className="text-primary underline">
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
                                    <img src={githubUser.avatar_url} alt="" className="w-6 h-6 rounded-full" />
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
