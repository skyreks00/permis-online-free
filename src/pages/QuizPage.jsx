import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import Quiz from '../components/Quiz';
import TopControls from '../components/TopControls';
import { loadThemeQuestions } from '../utils/contentLoader';

const QuizPage = ({
    sections,
    onFinishQuiz, // App callback to save progress
    onPatchProgress, // New callback to patch progress (for reviews)
    instantFeedback,
    autoPlayAudio,
    toggleTheme,
    isDarkMode,
    onMistakesCorrected
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

            // Check if we have custom questions passed via navigation state (e.g. for Review/Mistakes)
            if (location.state && location.state.questions) {
                setTheme({ 
                    id: 'review', 
                    name: location.state.title || 'Révision des erreurs', 
                    file: null 
                });
                setQuestions(location.state.questions);
                setIsLoading(false);
                return;
            }

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

                const shuffled = [...loaded];
                for (let i = shuffled.length - 1; i > 0; i--) {
                    const j = Math.floor(Math.random() * (i + 1));
                    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
                }

                // Determine how many questions to use
                if (foundTheme.id === 'examen_B') {
                    // Examen B: use 50 random questions
                    setQuestions(shuffled.slice(0, 50));
                } else if (foundTheme.id === 'permis_B_complet') {
                    // Permis B Complet: use ALL questions
                    setQuestions(shuffled);
                } else {
                    // Regular themes: use all questions
                    setQuestions(shuffled);
                }
            } catch (err) {
                console.error("Failed to load questions", err);
                setError("Erreur de chargement des questions");
            } finally {
                setIsLoading(false);
            }
        };

        if (sections.length > 0 || (location.state && location.state.questions)) {
            loadData();
        }
    }, [themeId, sections, location.state]);

    const handleFinish = (payload) => {
        // Notify App to save progress
        const score = typeof payload === 'number' ? payload : payload.score;
        const answers = typeof payload === 'object' ? payload.answers : [];

        // We delegate the saving logic to App via onFinishQuiz
        // But App needs to know which theme and how many questions
        
        // Check if we are in a review mode (custom questions via state)
        // If so, we likely DON'T want to save this as a new attempt for the theme, 
        // effectively treating it as a practice run.
        const isReviewMode = location.state && location.state.isReview;

        if (onFinishQuiz && !isReviewMode) {
            // Fix: Pass payload.answers to saveProgress so they are stored in localStorage
            onFinishQuiz(theme.id, score, questions.length, payload.answers);
        } else if (isReviewMode && onPatchProgress) {
            // Processing review results to patch original progress
            const answers = payload.answers || []; // [{ questionId, isCorrect, ... }]
            const correctAnswers = answers.filter(a => a && a.isCorrect);

            if (correctAnswers.length > 0) {
                // We need to group by themeId (handleReviewAll involves multiple themes)
                // The question objects in 'questions' state have 'originalThemeId' attached
                
                // Map questionId -> originalThemeId
                const questionThemeMap = {};
                questions.forEach(q => {
                    if (q.originalThemeId) {
                        questionThemeMap[q.id] = q.originalThemeId;
                    }
                });

                // Group correct answers by theme
                const updatesByTheme = {}; // { themeId: [answerObjects] }
                
                correctAnswers.forEach(ans => {
                    const tId = questionThemeMap[ans.questionId];
                    if (tId) {
                        if (!updatesByTheme[tId]) updatesByTheme[tId] = [];
                        updatesByTheme[tId].push(ans);
                    }
                });

                // Dispatch updates
                Object.keys(updatesByTheme).forEach(tId => {
                    onPatchProgress(tId, updatesByTheme[tId]);
                });
            }
        }

        // Navigate to results
        // If it was a review, we might want to differentiate the results page too?
        navigate('/resultats', {
            state: {
                score: score,
                total: questions.length,
                questions: questions,
                answers: answers,
                isExamMode: theme.id === 'examen_B' || theme.id === 'permis_B_complet',
                isReviewSession: isReviewMode
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
                    instantFeedback={instantFeedback && !(theme.id === 'examen_B' || theme.id === 'permis_B_complet')}
                    autoPlayAudio={autoPlayAudio}
                    fileName={theme.file}
                />
            )}
        </>
    );
};

export default QuizPage;
