import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { BrainCircuit, Search, ChevronLeft, Sparkles, Loader2, AlertCircle, CheckCircle2, ShieldCheck, Zap } from 'lucide-react';
import { loadThemesIndex } from '../utils/contentLoader';
import Groq from "groq-sdk";
import '../assets/AIGeneratedPage.css';

const AIGeneratedPage = () => {
    const navigate = useNavigate();
    const [themes, setThemes] = useState([]);
    const [selectedThemes, setSelectedThemes] = useState(new Set());
    const [search, setSearch] = useState('');
    const [isGenerating, setIsGenerating] = useState(false);
    const [generatedQuestions, setGeneratedQuestions] = useState([]);
    const [userAnswers, setUserAnswers] = useState({}); // { idx: letter }
    const [error, setError] = useState(null);
    const [apiKey, setApiKey] = useState(localStorage.getItem('groq_api_key') || '');
    const [numQuestions, setNumQuestions] = useState(10);
    const [showKeyPrompt, setShowKeyPrompt] = useState(!apiKey);
    const [isKeyError, setIsKeyError] = useState(false);

    const BASE = import.meta.env.BASE_URL || '/';

    useEffect(() => {
        const load = async () => {
            const index = await loadThemesIndex();
            if (index && index.sections) {
                const flattened = [];
                index.sections.forEach(s => {
                    if (s.items) {
                        s.items.forEach(item => {
                            if (item.file) flattened.push(item);
                        });
                    }
                });
                setThemes(flattened);
            }
        };
        load();
    }, []);

    const toggleTheme = (id) => {
        const next = new Set(selectedThemes);
        if (next.has(id)) next.delete(id);
        else next.add(id);
        setSelectedThemes(next);
    };

    const handleGenerate = async () => {
        if (selectedThemes.size === 0) {
            setError("Veuillez sélectionner au moins un thème.");
            return;
        }
        if (!apiKey) {
            setShowKeyPrompt(true);
            return;
        }

        setIsGenerating(true);
        setError(null);
        setGeneratedQuestions([]);
        setUserAnswers({});
        let allNewQuestions = [];
        
        try {
            const selectedItems = themes.filter(t => selectedThemes.has(t.id));
            const themeNames = selectedItems.map(t => t.name).join(', ');
            
            // Fetch lesson content for context
            let lessonContext = "";
            for (const item of selectedItems) {
                const lessonFile = item.file.replace('.json', '.html');
                try {
                    const res = await fetch(`${BASE}lecon/${lessonFile}`);
                    if (res.ok) {
                        const html = await res.text();
                        const text = html.replace(/<[^>]*>?/gm, '').substring(0, 1500); 
                        lessonContext += `\nCONTEXTE POUR LE THÈME ${item.name}:\n${text}\n`;
                    }
                } catch (e) {
                    console.warn(`Could not load lesson ${lessonFile} for context`);
                }
            }

            const groq = new Groq({ apiKey, dangerouslyAllowBrowser: true });

            // Split into batches to avoid JSON truncation on large counts
            const batchSize = 10;
            const totalBatches = Math.ceil(numQuestions / batchSize);

            for (let i = 0; i < totalBatches; i++) {
                const currentBatchCount = Math.min(batchSize, numQuestions - (i * batchSize));
                console.log(`📡 Génération Groq du lot ${i + 1}/${totalBatches} (${currentBatchCount} questions)...`);
                
                const completion = await groq.chat.completions.create({
                    messages: [
                        {
                            role: "system",
                            content: `Tu es un expert du code de la route BELGE (catégorie B). 
                            Tu génères des questions d'examen basées uniquement sur le contexte fourni. 
                            Format de sortie: JSON pur (un simple tableau d'objets) sans texte explicatif.`
                        },
                        {
                            role: "user",
                            content: `Génère EXACTEMENT ${currentBatchCount} questions d'examen basées sur : ${themeNames}.
                    
                            Contenu des leçons :
                            ${lessonContext}
                            
                            STRUCTURE JSON:
                            [{ "question": "...", "propositions": { "A": "...", "B": "...", "C": "..." }, "reponse": "A", "explication": "...", "type": "multiple_choice" }]`
                        }
                    ],
                    model: "llama-3.3-70b-versatile",
                    response_format: { type: "json_object" }
                });

                const text = completion.choices[0].message.content;
                const result = JSON.parse(text);
                
                // Groq response format can vary if not wrapped in a key
                const questions = Array.isArray(result) ? result : (result.questions || result.data || Object.values(result)[0]);
                
                if (Array.isArray(questions)) {
                    allNewQuestions = [...allNewQuestions, ...questions];
                    setGeneratedQuestions(prev => [...questions, ...prev]);
                }
            }
            
            localStorage.setItem('groq_api_key', apiKey);
            setIsKeyError(false);
        } catch (err) {
            console.error(err);
            if (err.message?.includes('401') || err.status === 401 || err.code === 'invalid_api_key') {
                setIsKeyError(true);
                setError("Clé API Groq invalide. Veuillez vérifier votre clé ou en saisir une nouvelle.");
            } else {
                setError(`Erreur: ${err.message || "Vérifiez votre clé API ou quota Groq."}`);
            }
        } finally {
            setIsGenerating(false);
        }
    };

    const handleAnswer = (questionIdx, letter) => {
        if (userAnswers[questionIdx]) return; // Already answered
        
        setUserAnswers(prev => ({
            ...prev,
            [questionIdx]: letter
        }));
    };

    const handleResetKey = () => {
        setApiKey('');
        localStorage.removeItem('groq_api_key');
        setShowKeyPrompt(true);
        setIsKeyError(false);
        setError(null);
    };

    return (
        <div className="ai-gen-page">
            <header className="ai-gen-header">
                <button className="ai-back-btn" onClick={() => navigate('/examen-b')}>
                    <ChevronLeft size={20} />
                    Retour à l'Examen
                </button>
                <div className="ai-header-title">
                    <BrainCircuit size={24} className="ai-icon-glow" />
                    <div>
                        <h1>Générateur de Questions IA</h1>
                        <p>Questions personnalisées basées sur tes leçons</p>
                    </div>
                </div>
            </header>

            <main className="ai-gen-content">
                <div className="ai-sidebar">
                    <section className="ai-section">
                        <div className="ai-section-title">
                            <Search size={16} />
                            Rechercher des thèmes
                        </div>
                        <div className="ai-search-box">
                            <input 
                                type="text" 
                                name="theme-search"
                                autoComplete="off"
                                placeholder="Priorité, Vitesse, Autoroute..." 
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                            />
                        </div>
                        <div className="ai-theme-list">
                            {themes
                                .filter(t => t.name.toLowerCase().includes(search.toLowerCase()))
                                .map(t => (
                                    <button 
                                        key={t.id}
                                        className={`ai-theme-item ${selectedThemes.has(t.id) ? 'active' : ''}`}
                                        onClick={() => toggleTheme(t.id)}
                                    >
                                        {t.name}
                                        {selectedThemes.has(t.id) && <Sparkles size={12} />}
                                    </button>
                                ))
                            }
                        </div>
                    </section>

                    <div className="ai-api-box">
                        <div className="ai-api-status">
                            <Zap size={14} style={{ color: apiKey.startsWith('gsk_') ? '#10b981' : '#f59e0b' }} />
                            <span>Clé API Groq {apiKey ? (apiKey.startsWith('gsk_') ? 'valide' : 'configurée') : 'manquante'}</span>
                        </div>
                        {(isKeyError || !apiKey) && (
                            <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                <input 
                                    type="password" 
                                    placeholder="Coller votre clé Groq (gsk_...)" 
                                    className="ai-api-input"
                                    value={apiKey}
                                    onChange={(e) => setApiKey(e.target.value)}
                                />
                                {apiKey && !apiKey.startsWith('gsk_') && (
                                    <div style={{ fontSize: '11px', color: 'var(--danger)', opacity: 0.8 }}>
                                        Format attendu : gsk_xxx...
                                    </div>
                                )}
                            </div>
                        )}
                        {apiKey && isKeyError && (
                            <button className="ai-reset-key-btn" onClick={handleResetKey} style={{
                                width: '100%',
                                background: 'rgba(239, 68, 68, 0.1)',
                                color: '#ef4444',
                                border: '1px solid rgba(239, 68, 68, 0.2)',
                                padding: '8px',
                                borderRadius: '6px',
                                fontSize: '13px',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: '8px'
                            }}>
                                <AlertCircle size={14} />
                                Réinitialiser la clé
                            </button>
                        )}
                        <div className="ai-quantity-selector">
                            <label>Nombre de questions :</label>
                            <div className="ai-qty-pills">
                                {[3, 10, 30, 50].map(n => (
                                    <button 
                                        key={n} 
                                        className={`ai-qty-pill ${numQuestions === n ? 'active' : ''}`}
                                        onClick={() => setNumQuestions(n)}
                                    >
                                        {n}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <button 
                            className="ai-gen-trigger" 
                            disabled={isGenerating || selectedThemes.size === 0}
                            onClick={handleGenerate}
                        >
                            {isGenerating ? (
                                <>
                                    <Loader2 size={18} className="anim-spin" />
                                    Génération de {numQuestions}...
                                </>
                            ) : (
                                <>
                                    <Sparkles size={18} />
                                    Générer {numQuestions} questions
                                </>
                            )}
                        </button>
                    </div>
                </div>

                <div className="ai-results">
                    {generatedQuestions.length > 0 && (
                        <div className="ai-score-banner anim-slide-up">
                            <div className="ai-score-stats">
                                <Sparkles size={20} className="ai-icon-glow" />
                                <div>
                                    <span className="ai-score-label">Votre progression :</span>
                                    <span className="ai-score-value">
                                        {Object.values(userAnswers).filter((ans, i) => ans === generatedQuestions[i]?.reponse).length} / {generatedQuestions.length}
                                    </span>
                                </div>
                            </div>
                            <div className="ai-score-progress">
                                <div 
                                    className="ai-progress-bar" 
                                    style={{ width: `${(Object.keys(userAnswers).length / generatedQuestions.length) * 100}%` }}
                                ></div>
                            </div>
                        </div>
                    )}

                    {error && (
                        <div className="ai-error-banner">
                            <AlertCircle size={20} />
                            {error}
                        </div>
                    )}

                    {generatedQuestions.length === 0 && !isGenerating && (
                        <div className="ai-empty-state">
                            <BrainCircuit size={48} />
                            <h3>Prêt à apprendre ?</h3>
                            <p>Sélectionne un ou plusieurs thèmes à gauche pour générer des questions d'entraînement sur mesure.</p>
                        </div>
                    )}

                    <div className="ai-questions-grid">
                        {generatedQuestions.map((q, idx) => {
                            const userAnswer = userAnswers[idx];
                            const isAnswered = !!userAnswer;
                            const isCorrect = userAnswer === q.reponse;

                            return (
                                <div key={idx} className={`ai-q-card anim-slide-up ${isAnswered ? 'answered' : ''}`} style={{ animationDelay: `${idx * 0.1}s` }}>
                                    <div className="ai-q-header">
                                        <span className="ai-q-badge">Question {idx + 1}</span>
                                        {isAnswered && (
                                            <div className={`ai-q-status ${isCorrect ? 'correct' : 'incorrect'}`}>
                                                {isCorrect ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />}
                                                <span>{isCorrect ? 'Correct' : 'Incorrect'}</span>
                                            </div>
                                        )}
                                    </div>
                                    <div className="ai-q-text">{q.question}</div>
                                    <div className="ai-q-props">
                                        {Object.entries(q.propositions).map(([letter, text]) => {
                                            const isSelected = userAnswer === letter;
                                            const isCorrectChoice = q.reponse === letter;
                                            
                                            let stateClass = '';
                                            if (isAnswered) {
                                                if (isCorrectChoice) stateClass = 'correct';
                                                else if (isSelected) stateClass = 'incorrect';
                                                else stateClass = 'disabled';
                                            }

                                            return (
                                                <button 
                                                    key={letter} 
                                                    className={`ai-q-prop ${stateClass} ${isSelected ? 'selected' : ''}`}
                                                    onClick={() => handleAnswer(idx, letter)}
                                                    disabled={isAnswered}
                                                >
                                                    <span className="ai-prop-letter">{letter}</span>
                                                    <span className="ai-prop-text">{text}</span>
                                                </button>
                                            );
                                        })}
                                    </div>
                                    
                                    {isAnswered && (
                                        <div className="ai-q-expl anim-fade-in">
                                            <strong>Explication :</strong> {q.explication}
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </div>
            </main>
        </div>
    );
};

export default AIGeneratedPage;
