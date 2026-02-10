import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
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
    const [questions, setQuestions] = useState([]);
    const [theme, setTheme] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const loadData = async () => {
            setIsLoading(true);
            setError(null);

            // Find theme in sections
            let foundTheme = null;
            if (themeId === 'examen_B') {
                // Special case for exam mode if it's not in sections explicitly or if we need to construct it
                foundTheme = { id: 'examen_B', name: 'Examen Blanc', file: 'examen_B.json' };
                // Search in sections just in case
                for (const section of sections) {
                    const t = section.themes.find(t => t.id === themeId);
                    if (t) { foundTheme = t; break; }
                }
            } else {
                for (const section of sections) {
                    const t = section.themes.find(t => t.id === themeId);
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
                // Simplified loading logic compared to App.jsx debug/fallback complexity
                // We assume loadThemeQuestions handles the fetch
                const data = await loadThemeQuestions(foundTheme.file);
                let loaded = data.questions || [];

                if (loaded.length === 0) {
                    // Fallback to fetch if contentLoader didn't work as expected or for debug
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

        if (sections.length > 0) {
            loadData();
        }
    }, [themeId, sections]);

    const handleFinish = (payload) => {
        // Notify App to save progress
        const score = typeof payload === 'number' ? payload : payload.score;

        // We delegate the saving logic to App via onFinishQuiz
        // But App needs to know which theme and how many questions
        if (onFinishQuiz) {
            onFinishQuiz(theme.id, score, questions.length);
        }

        // Navigate to results
        navigate('/resultats', {
            state: {
                results: {
                    correct: score,
                    incorrect: questions.length - score,
                    score: score,
                    answers: payload.answers || []
                },
                questions: questions,
                total: questions.length,
                isExamMode: theme.id.includes('examen')
            }
        });
    };

    if (isLoading) return <div className="p-8 text-center">Chargement du quiz...</div>;
    if (error) return <div className="p-8 text-center text-error">{error} <br /><button onClick={() => navigate('/')} className="btn mt-4">Retour</button></div>;

    return (
        <>
            <TopControls
                showProfileButton={false}
                toggleTheme={toggleTheme}
                isDarkMode={isDarkMode}
            />
            {theme && (
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
