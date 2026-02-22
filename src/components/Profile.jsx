import React, { useState, useEffect } from 'react';
import { 
    Trophy, Target, AlertTriangle, Clock, Settings, ArrowLeft, 
    CheckCircle2, Circle, Volume2, User, LogOut, Key, Github, 
    Save, Filter, RefreshCcw, Sparkles, Lock, PlayCircle, Mic, ExternalLink, HelpCircle
} from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { loadThemeQuestions } from '../utils/contentLoader';
import { loginWithGitHub, logout, auth } from '../utils/firebase';
import { GithubAuthProvider, onAuthStateChanged } from 'firebase/auth';
import { playText, stopAudio } from '../utils/textToSpeech';

const PRESET_VOICES = [
    { id: 'pNInz6obpgDQGcFmaJgB', name: 'Adam', icon: User, desc: 'Américain profond' },
    { id: '21m00Tcm4TlvDq8ikWAM', name: 'Rachel', icon: User, desc: 'Américaine calme' },
    { id: 'ErXwobaYiN019PkySvjV', name: 'Antoni', icon: User, desc: 'Américain posé' },
    { id: 'TxGEqnHWrfWFTfGW9XjX', name: 'Josh', icon: User, desc: 'Grave & profond' },
    { id: 'EXAVITQu4vr4xnSDxMaL', name: 'Bella', icon: User, desc: 'Douce & claire' },
];

const CustomVoiceSelect = ({ voices, selectedId, onSelect, onPreview }) => {
    const [isOpen, setIsOpen] = useState(false);
    const selectedVoice = voices.find(v => v.id === selectedId);
    const SelectedIcon = selectedVoice?.icon || Mic;

    return (
        <div className="relative">
            {/* TRIGGER BUTTON */}
            <button 
                onClick={() => setIsOpen(!isOpen)}
                className="w-full flex items-center justify-between p-3 bg-surface-2 hover:bg-surface-3 border border-transparent hover:border-border rounded-xl transition-all group"
            >
                <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-surface-1 flex items-center justify-center text-lg shadow-sm border border-border">
                        <SelectedIcon size={16} />
                    </div>
                    <div className="text-left">
                        <div className="font-semibold text-sm leading-tight group-hover:text-primary transition-colors">
                            {selectedVoice?.name || 'Sélectionnez une voix'}
                        </div>
                        <div className="text-[10px] text-muted leading-tight">
                            {selectedVoice?.desc || 'Cliquez pour changer'}
                        </div>
                    </div>
                </div>
                <div className="text-muted group-hover:text-text transition-colors">
                    {isOpen ? <Settings className="rotate-90 transition-transform" size={16} /> : <Settings size={16} />}
                </div>
            </button>

            {/* DROPDOWN MENU */}
            {isOpen && (
                <>
                    <div className="fixed inset-0 z-10" onClick={() => setIsOpen(false)} />
                    <div className="absolute top-full left-0 right-0 mt-2 bg-surface-1/95 backdrop-blur-xl border border-border/50 rounded-xl shadow-2xl z-20 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                        <div className="max-h-[300px] overflow-y-auto p-1.5 space-y-1">
                            {voices.map(v => (
                                <div 
                                    key={v.id} 
                                    className={`
                                        flex items-center justify-between p-2 rounded-lg cursor-pointer transition-colors group/item
                                        ${selectedId === v.id ? 'bg-primary/10' : 'hover:bg-surface-2'}
                                    `}
                                    onClick={() => {
                                        onSelect(v.id);
                                        setIsOpen(false);
                                    }}
                                >
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-full bg-surface-2 flex items-center justify-center text-sm">
                                            <v.icon size={14} />
                                        </div>
                                        <div>
                                            <div className={`text-sm font-medium ${selectedId === v.id ? 'text-primary' : 'text-text'}`}>
                                                {v.name}
                                            </div>
                                            <div className="text-[10px] text-muted">{v.desc}</div>
                                        </div>
                                    </div>
                                    
                                    <button 
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            onPreview(v);
                                        }}
                                        className="p-2 text-muted hover:text-primary hover:bg-primary/10 rounded-full transition-colors"
                                        title="Écouter un extrait"
                                    >
                                        <Volume2 size={16} />
                                    </button>
                                </div>
                            ))}
                            <div className="h-px bg-border mx-2 my-1" />
                            <button 
                                onClick={() => {
                                    onSelect('custom');
                                    setIsOpen(false);
                                }}
                                className="w-full text-left p-2 rounded-lg hover:bg-surface-2 text-xs font-medium text-muted hover:text-text flex items-center gap-2"
                            >
                                <Settings size={14} /> Entrer un ID personnalisé...
                            </button>
                        </div>
                    </div>
                </>
            )}
        </div>
    );
};

const Profile = ({ progress, themesData, onBack, onReset, instantFeedback, onToggleInstantFeedback, autoPlayAudio, onToggleAutoPlayAudio }) => {
    const navigate = useNavigate();
    const [user, setUser] = useState(auth.currentUser);
    const [apiKey, setApiKey] = useState(() => localStorage.getItem('groq_api_key') || '');
    const [elevenLabsKey, setElevenLabsKey] = useState(() => localStorage.getItem('elevenlabs_api_key') || '');
    const [voiceId, setVoiceId] = useState(() => localStorage.getItem('elevenlabs_voice_id') || PRESET_VOICES[0].id);
    const [showApiKeyPrompt, setShowApiKeyPrompt] = useState(false);
    const [pendingKey, setPendingKey] = useState('');
    const [showChangeKey, setShowChangeKey] = useState(false);

    // Calculate Stats
    const totalQuestions = Object.values(themesData).reduce((acc, theme) => acc + (theme.questions ? theme.questions.length : 0), 0);
    
    // Assuming progress is { themeId: { totalAnswered: N, correctAnswers: M } } or similar structure
    // If progress is structured differently, this might need adjustment.
    // Based on typical usage:
    let totalAnswered = 0;
    let correctAnswers = 0;
    
    if (progress) {
        Object.values(progress).forEach(p => {
             if (p) {
                 totalAnswered += (p.totalAnswered || 0);
                 correctAnswers += (p.correctAnswers || 0);
             }
        });
    }

    const successRate = totalAnswered > 0 ? Math.round((correctAnswers / totalAnswered) * 100) : 0;
    const progressPercent = totalQuestions > 0 ? Math.round((totalAnswered / totalQuestions) * 100) : 0;

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
            setUser(currentUser);
        });
        return () => unsubscribe();
    }, []);

    const handleSelectVoice = (id) => {
        setVoiceId(id);
        // Only save to localStorage if it's a valid ID (not empty/cleared for custom entry)
        if (id) localStorage.setItem('elevenlabs_voice_id', id);
    };

    const handleSaveKeys = () => {
        if (apiKey) localStorage.setItem('groq_api_key', apiKey);
        else localStorage.removeItem('groq_api_key');

        if (elevenLabsKey) localStorage.setItem('elevenlabs_api_key', elevenLabsKey);
        else localStorage.removeItem('elevenlabs_api_key');

        localStorage.setItem('elevenlabs_voice_id', voiceId);

        alert('Configuration sauvegardée !');
    };

    const handleToggleAudio = () => {
        if (!autoPlayAudio && !elevenLabsKey) {
            setShowApiKeyPrompt(true);
            setPendingKey('');
        } else {
            onToggleAutoPlayAudio();
            if (autoPlayAudio) setShowApiKeyPrompt(false);
        }
    };

    const handleSavePendingKey = () => {
        if (!pendingKey.trim()) return;
        const key = pendingKey.trim();
        setElevenLabsKey(key);
        localStorage.setItem('elevenlabs_api_key', key);
        setShowApiKeyPrompt(false);
        setPendingKey('');
        if (!autoPlayAudio) onToggleAutoPlayAudio();
    };

    const handlePreviewVoice = (voice) => {
        if (!elevenLabsKey) return;
        const text = `Bonjour, je suis ${voice.name || 'une voix personnalisée'}. Voici un exemple.`;
        // Use the override (3rd arg) to play specifically THIS voice ID
        playText(text, null, voice.id);
    };

    const handleLogin = async () => {
        try {
            await loginWithGitHub();
        } catch (error) {
            console.error("Login failed:", error);
            alert("Erreur de connexion GitHub");
        }
    };

    const handleLogout = async () => {
        try {
            await logout();
        } catch (error) {
            console.error("Logout failed:", error);
        }
    };

    useEffect(() => {
        window.scrollTo(0, 0);
    }, []);

    // Force styles to ensure padding is applied regardless of Tailwind/CSS issues
    return (
        <div 
            className="max-w-md mx-auto animate-fade-in" // Reduced width to max-w-md
            style={{ 
                marginTop: '180px', // Using MARGIN instead of padding (sometimes safer)
                paddingBottom: '48px', 
                paddingLeft: '32px', // More side padding
                paddingRight: '32px',
                width: '100%' 
            }}
        > 
            
            <div className="space-y-8">
                {/* Stats Removed as per request */}

                {/* Settings Card */}
                <div style={{ background: 'var(--surface)', borderRadius: '16px', border: '1px solid var(--border)', padding: '20px 24px' }}>
                    <h2 style={{ margin: '0 0 20px 0', fontSize: '1rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <Settings size={18} style={{ color: 'var(--primary)' }} />
                        Préférences
                    </h2>

                    {/* ... (Toggles remain same) ... */}
                    {/* Correction Instantanée */}
                    <div className="flex items-center justify-between mb-6">
                        <div>
                            <div className="font-semibold text-base flex items-center gap-2">Correction Instantanée</div>
                            <div className="text-sm text-muted">Affiche la réponse directement.</div>
                        </div>
                        <label className="switch scale-110">
                            <input type="checkbox" checked={instantFeedback} onChange={onToggleInstantFeedback} />
                            <span className="slider round"></span>
                        </label>
                    </div>

                    {/* Lecture Audio Auto */}
                    <div style={{ marginBottom: '8px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: showApiKeyPrompt ? '12px' : '24px' }}>
                            <div>
                                <div className="font-semibold text-base flex items-center gap-2">
                                    Lecture Audio Auto
                                </div>
                                <div className="text-sm text-muted">
                                    {!elevenLabsKey ? 'Clé API ElevenLabs requise.' : 'Lecture vocale automatique.'}
                                </div>
                            </div>
                            <label className="switch scale-110">
                                <input type="checkbox" checked={autoPlayAudio} onChange={handleToggleAudio} />
                                <span className="slider round"></span>
                            </label>
                        </div>

                        {/* INLINE KEY PROMPT */}
                        {showApiKeyPrompt && (
                            <div style={{ background: 'var(--surface-2, rgba(255,255,255,0.05))', border: '1px solid var(--primary)', borderRadius: '12px', padding: '14px 16px', marginBottom: '20px' }}>
                                <div style={{ fontSize: '0.8rem', fontWeight: 600, marginBottom: '8px', color: 'var(--primary)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                    <Key size={14} /> Entrez votre clé API ElevenLabs
                                </div>
                                <div style={{ display: 'flex', gap: '8px' }}>
                                    <input
                                        type="password"
                                        className="input"
                                        placeholder="sk_..."
                                        value={pendingKey}
                                        onChange={e => setPendingKey(e.target.value)}
                                        onKeyDown={e => e.key === 'Enter' && handleSavePendingKey()}
                                        autoFocus
                                        style={{ flex: 1, fontSize: '0.85rem' }}
                                    />
                                    <button
                                        className="btn-primary"
                                        onClick={handleSavePendingKey}
                                        disabled={!pendingKey.trim()}
                                        style={{ whiteSpace: 'nowrap', padding: '0 14px' }}
                                    >
                                        Valider
                                    </button>
                                    <button
                                        className="btn-ghost"
                                        onClick={() => setShowApiKeyPrompt(false)}
                                        style={{ border: '1px solid var(--border)', padding: '0 10px' }}
                                    >
                                        ✕
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* PREMIUM VOICE CONFIG */}
                    {autoPlayAudio && (
                    <div style={{ marginTop: '24px', paddingTop: '20px', borderTop: '1px solid var(--border)' }}>
                         <div className="flex items-center justify-between mb-5">
                            <div>
                                <div className="font-bold text-lg flex items-center gap-2 text-primary">
                                    <Sparkles size={18} className="text-yellow-400 fill-yellow-400/20" /> Voix Premium
                                </div>
                                <div className="text-sm text-muted mt-1">Moteur ElevenLabs (Ultra-réaliste)</div>
                            </div>
                        </div>
                        
                        <div className="space-y-6">
                            {/* API KEY INPUT */}
                            <div>
                                {elevenLabsKey && !showChangeKey ? (
                                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.85rem', color: 'var(--success, #22c55e)' }}>
                                            <Key size={14} /> Clé API configurée ✓
                                        </div>
                                        <button
                                            className="btn-ghost"
                                            onClick={() => setShowChangeKey(true)}
                                            style={{ fontSize: '0.75rem', padding: '4px 10px', border: '1px solid var(--border)' }}
                                        >
                                            Changer
                                        </button>
                                    </div>
                                ) : (
                                    <div style={{ display: 'flex', gap: '8px' }}>
                                        <input
                                            type="password"
                                            className="input"
                                            placeholder="sk_..."
                                            value={elevenLabsKey}
                                            onChange={e => {
                                                setElevenLabsKey(e.target.value);
                                                if (e.target.value) localStorage.setItem('elevenlabs_api_key', e.target.value);
                                                else localStorage.removeItem('elevenlabs_api_key');
                                            }}
                                            autoFocus
                                            style={{ flex: 1, fontSize: '0.85rem' }}
                                        />
                                        {elevenLabsKey && (
                                            <button
                                                className="btn-ghost"
                                                onClick={() => setShowChangeKey(false)}
                                                style={{ border: '1px solid var(--border)', padding: '0 10px' }}
                                            >
                                                ✓
                                            </button>
                                        )}
                                    </div>
                                )}
                            </div>

                            {/* VOICE SELECTOR (Custom) */}
                            <div className={`transition-all duration-300 ${!elevenLabsKey ? 'opacity-40 pointer-events-none grayscale' : 'opacity-100'}`}>
                                <label className="text-[10px] font-bold uppercase tracking-wider text-muted mb-2 block">Voix Active</label>

                                {/* CUSTOM ID INPUT MODE */}
                                {(!PRESET_VOICES.find(v => v.id === voiceId) && voiceId !== undefined) ? (
                                    <div className="bg-surface-2 p-1.5 rounded-xl border border-primary/20 flex gap-2 animate-fade-in items-center">
                                        <div className="relative flex-1">
                                            <input 
                                                type="text" 
                                                className="w-full bg-surface-1 text-sm pl-9 pr-3 py-2.5 rounded-lg border-2 border-primary/10 focus:border-primary focus:ring-0 text-primary font-medium transition-all placeholder:text-muted/50"
                                                value={voiceId}
                                                onChange={e => handleSelectVoice(e.target.value)}
                                                placeholder="Collez l'ID de la voix ici..."
                                                autoFocus
                                            />
                                            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-primary">
                                                <Settings size={14} />
                                            </div>
                                        </div>
                                        
                                        <div className="flex gap-1">
                                            <button 
                                                onClick={() => playText("Test de la voix personnalisée. 1, 2, 3.", null, voiceId)}
                                                className="p-3 text-primary hover:bg-primary/10 rounded-lg transition-colors"
                                                title="Tester cet ID"
                                                disabled={!voiceId}
                                            >
                                                <Volume2 size={20} />
                                            </button>
                                            <button 
                                                onClick={() => handleSelectVoice(PRESET_VOICES[0].id)} 
                                                className="p-3 text-muted hover:text-text hover:bg-surface-3 rounded-lg transition-colors"
                                                title="Retour aux favoris"
                                            >
                                                <LogOut size={20} className="rotate-180" />
                                            </button>
                                        </div>
                                    </div>
                                ) : (
                                    /* PRESET CUSTOM DROPDOWN */
                                    <CustomVoiceSelect 
                                        voices={PRESET_VOICES} 
                                        selectedId={voiceId}
                                        onSelect={(id) => {
                                            if (id === 'custom') handleSelectVoice('');
                                            else handleSelectVoice(id);
                                        }}
                                        onPreview={handlePreviewVoice}
                                    />
                                )}
                                
                                <div className="mt-2 pl-1 flex items-center justify-between">
                                    <p className="text-[10px] text-muted flex items-center gap-1.5">
                                        {(!PRESET_VOICES.find(v => v.id === voiceId)) 
                                            ? <><span className="w-1.5 h-1.5 rounded-full bg-yellow-400"></span> Mode ID Personnalisé</>
                                            : <><span className="w-1.5 h-1.5 rounded-full bg-green-500"></span> Voix Standard</>}
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                    )}
                </div>

                {/* API & Cloud */}
                <div className="bg-surface-1 rounded-2xl border border-border p-5 shadow-sm">
                    <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
                        <User size={20} className="text-primary" /> Connexion & API
                    </h2>

                    {/* GitHub */}
                    <div className="mb-6 pb-6 border-b border-border">
                        <label className="text-[10px] font-bold uppercase tracking-wider text-muted mb-2 block">Compte GitHub</label>
                        {user ? (
                            <div className="flex items-center justify-between bg-surface-2 p-3 rounded-xl border border-border">
                                <div className="flex items-center gap-3">
                                    <img src={user.photoURL} alt="Avatar" style={{ width: '40px', height: '40px', borderRadius: '12px', border: '1px solid var(--border)' }} />
                                    <div>
                                        <div className="font-bold text-sm">{user.displayName}</div>
                                        <div className="text-xs text-muted">{user.email}</div>
                                    </div>
                                </div>
                                <button onClick={handleLogout} className="btn-secondary text-xs px-3 py-1.5 flex items-center gap-2">
                                    <LogOut size={14} /> Déconnexion
                                </button>
                            </div>
                        ) : (
                            <button onClick={handleLogin} className="w-full btn-primary py-3 flex items-center justify-center gap-2">
                                <Github size={18} /> Se connecter avec GitHub
                            </button>
                        )}
                        <p className="text-[10px] text-muted mt-2">Nécessaire pour sauvegarder votre progression en ligne.</p>
                    </div>

                    <div>
                        <div className="flex items-center justify-between mb-2">
                            <label className="text-[10px] font-bold uppercase tracking-widest text-muted flex items-center gap-2">
                                <Key size={12} className="text-primary" /> Clé API Groq (Optionnel)
                            </label>
                            
                            {/* PREMIUM HELP LINK */}
                            <a 
                                href="https://console.groq.com/keys" 
                                target="_blank" 
                                rel="noreferrer" 
                                className="
                                    group relative flex items-center gap-2 px-3 py-1.5 
                                    text-[10px] font-bold uppercase tracking-wider
                                    bg-surface-2 hover:bg-surface-3
                                    text-primary hover:text-text
                                    border border-primary/20 hover:border-primary/50
                                    rounded-lg transition-all duration-300
                                    shadow-lg shadow-primary/5 hover:shadow-primary/20
                                    active:scale-95 overflow-hidden no-underline
                                "
                                style={{ textDecoration: 'none' }}
                            >
                                {/* Glow Effect Background */}
                                <div className="absolute inset-0 bg-gradient-to-r from-primary/0 via-primary/5 to-primary/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700" />
                                
                                <span>Créer ma clé gratuite</span>
                            </a>
                        </div>
                        <input 
                            type="password" 
                            className="input text-sm w-full mb-2 bg-surface-2"
                            value={apiKey}
                            onChange={e => setApiKey(e.target.value)}
                            placeholder="gsk_..."
                        />
                        <p className="text-xs text-muted">Laissez vide pour utiliser la clé par défaut (limitée).</p>
                    </div>

                    <div className="mt-6 flex justify-end">
                        <button onClick={handleSaveKeys} className="btn-primary flex items-center gap-2 px-6">
                            <Save size={18} /> Sauvegarder les clés
                        </button>
                    </div>
                </div>

                {/* Danger Zone */}
                <div className="bg-red-500/5 rounded-2xl border border-red-500/20 p-5">
                    <h2 className="text-sm font-bold text-red-500 mb-2 flex items-center gap-2">
                        <AlertTriangle size={16} /> Zone de Danger
                    </h2>
                    <div className="flex items-center justify-between">
                        <p className="text-xs text-muted">Effacer toute la progression locale.</p>
                        <button 
                            onClick={() => {
                                if(confirm('Êtes-vous sûr ? Tout sera effacé.')) onReset();
                            }} 
                            className="bg-surface hover:bg-red-500 hover:text-white text-red-500 border border-red-500/20 px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-2"
                        >
                            <RefreshCcw size={14} /> Réinitialiser
                        </button>
                    </div>
                </div>
                
            </div>
        </div>
    );
};

export default Profile;
