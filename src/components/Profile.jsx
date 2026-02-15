import React, { useState, useEffect } from 'react';
import { Trophy, Target, AlertTriangle, Clock, Settings, ArrowLeft, CheckCircle2, Circle, Volume2, User, LogOut, Key, Github, Save, FileJson, Download, Upload } from 'lucide-react';
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
    const [apiKey, setApiKey] = useState(() => localStorage.getItem('groq_api_key') || '');
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
                                const acc = p.totalQuestions > 0 ? Math.round((p.bestScore / p.totalQuestions) * 100) : 0;
                                const scoreColor = acc >= 80 ? 'text-success' : acc >= 50 ? 'text-warning' : 'text-danger';

                                return (
                                    <div key={theme.id} className="theme-history-item">
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
                {/* Data Management Card */}
                <div className="card p-6 bg-surface-1 border border-border mt-6">
                    <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
                        <FileJson size={20} /> Gestion des Données
                    </h2>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <button 
                            onClick={() => {
                                const dataStr = localStorage.getItem('quizProgress');
                                if (!dataStr) {
                                    alert('Aucune donnée à exporter.');
                                    return;
                                }
                                const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
                                const exportFileDefaultName = 'sauvegarde-permis.json';
                                const linkElement = document.createElement('a');
                                linkElement.setAttribute('href', dataUri);
                                linkElement.setAttribute('download', exportFileDefaultName);
                                linkElement.click();
                            }}
                            className="btn-secondary flex items-center justify-center gap-2 p-4"
                        >
                            <Download size={20} /> Exporter ma progression
                        </button>

                        <label className="btn-primary flex items-center justify-center gap-2 p-4 cursor-pointer">
                            <Upload size={20} /> Importer une sauvegarde
                            <input 
                                type="file" 
                                accept=".json" 
                                className="hidden" 
                                onChange={(e) => {
                                    const fileReader = new FileReader();
                                    fileReader.readAsText(e.target.files[0], "UTF-8");
                                    fileReader.onload = e => {
                                        try {
                                            const json = JSON.parse(e.target.result);
                                            // Basic validation
                                            if (typeof json === 'object') {
                                                if (window.confirm('Attention : Ceci va ÉCRASER votre progression actuelle. Continuer ?')) {
                                                    localStorage.setItem('quizProgress', JSON.stringify(json));
                                                    alert('Importation réussie ! La page va se recharger.');
                                                    window.location.reload();
                                                }
                                            } else {
                                                alert('Fichier invalide.');
                                            }
                                        } catch (err) {
                                            console.error(err);
                                            alert('Erreur lors de la lecture du fichier.');
                                        }
                                    };
                                }}
                            />
                        </label>
                    </div>
                    <p className="text-sm text-muted mt-4">
                        Utilisez ces options pour transférer votre progression d'un appareil à l'autre ou pour faire une sauvegarde de sécurité.
                    </p>
                </div>
            </div>

            <div className="h-10"></div>
        </div>
    );
};

export default Profile;
