import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import Quiz from '../components/Quiz';
import TopControls from '../components/TopControls';
import { loadThemeQuestions } from '../utils/contentLoader';

const QuizPage = ({
    sections,
    onFinishQuiz, // App callback to save progress
    instantFeedback,
    autoPlayAudio,
    toggleTheme,
    isDarkMode
}) => {
    const { themeId } = useParams();
    const navigate = useNavigate();
    const location = useLocation();
    const [questions, setQuestions] = useState([]);
    const [theme, setTheme] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const loadData = async () => {
            // Check if questions are passed via state (e.g. for Mistake Quiz)
            if (location.state?.questions && location.state?.theme) {
                setTheme(location.state.theme);
                setQuestions(location.state.questions);
                setIsLoading(false);
                return;
            }

            // If sections are not loaded yet (refresh case), wait.
            // App.jsx will trigger a re-render when sections are updated.
            if (!sections || sections.length === 0) {
                return;
            }

            setIsLoading(true);
            setError(null);

            // Find theme in sections
            let foundTheme = null;
            if (themeId === 'examen_B') {
                foundTheme = { id: 'examen_B', name: 'Examen Blanc', file: 'examen_B.json' };
            } else {
                for (const section of sections) {
                    const items = section.items || section.themes || [];
                    const t = items.find(t => t.id === themeId);
                    if (t) {
                        foundTheme = t;
                        break;
                    }
                }
            }

            if (!foundTheme) {
                setError("Thème non trouvé");
                setIsLoading(false);
                return;
            }

            setTheme(foundTheme);

            try {
                // Load questions
                const data = await loadThemeQuestions(foundTheme.file);
                let loaded = data.questions || [];

                if (loaded.length === 0) {
                    // Fallback
                    const base = import.meta.env.BASE_URL || '/';
                    const res = await fetch(`${base}data/${foundTheme.file}`);
                    const json = await res.json();
                    loaded = json.questions || [];
                }

                // Shuffle
                const shuffled = [...loaded].sort(() => Math.random() - 0.5);

                if (foundTheme.id.includes('examen')) {
                    setQuestions(shuffled.slice(0, 50));
                } else {
                    setQuestions(shuffled);
                }
            } catch (err) {
                console.error("Failed to load questions", err);
                setError("Erreur de chargement des questions");
            } finally {
                setIsLoading(false);
            }
        };

        loadData();
    }, [themeId, sections]);

    const handleFinish = (payload) => {
        // Notify App to save progress
        const score = typeof payload === 'number' ? payload : payload.score;
        const answers = typeof payload === 'object' ? payload.answers : [];

        // We delegate the saving logic to App via onFinishQuiz
        if (onFinishQuiz && theme) {
            onFinishQuiz(theme.id, score, questions.length, answers);
        }

        // Check for corrections in revision mode
        if (onMistakesCorrected && theme && theme.id.includes('erreurs')) {
            const corrections = answers
                .filter(a => a.isCorrect)
                .map(a => {
                    const q = questions.find(q => q.id === a.questionId);
                    return q && q.sourceThemeId ? { themeId: q.sourceThemeId, questionId: q.id } : null;
                })
                .filter(Boolean);

            if (corrections.length > 0) {
                onMistakesCorrected(corrections);
            }
        }

        // Navigate to results
        navigate('/resultats', {
            state: {
                results: {
                    correct: score,
                    incorrect: questions.length - score,
                    score: score,
                    answers: answers
                },
                questions: questions,
                total: questions.length,
                isExamMode: theme && theme.id.includes('examen')
            }
        });
    };

    // Show loading state if we are fetching data OR if we are waiting for sections (refresh case)
    if (isLoading || !sections || sections.length === 0) {
        return <div className="p-8 text-center"><span className="loading loading-spinner loading-lg"></span><br />Chargement du quiz...</div>;
    }

    if (error) {
        return <div className="p-8 text-center text-error">{error} <br /><button onClick={() => navigate('/')} className="btn mt-4">Retour</button></div>;
    }

    return (
        <>
            <TopControls
                showProfileButton={false}
                toggleTheme={toggleTheme}
                isDarkMode={isDarkMode}
            />
            {theme && questions.length > 0 && (
                <Quiz
                    questions={questions}
                    themeName={theme.name}
                    onFinish={handleFinish}
                    onExit={() => navigate('/')}
                    instantFeedback={instantFeedback && !theme.id.includes('examen')}
                    autoPlayAudio={autoPlayAudio}
                    fileName={theme.file}
                />
            )}
        </>
    );
};

export default QuizPage;
