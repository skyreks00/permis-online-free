import React, { useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import Results from '../components/Results';
import TopControls from '../components/TopControls';

const ResultsPage = ({ toggleTheme, isDarkMode }) => {
    const { state } = useLocation();
    const navigate = useNavigate();

    useEffect(() => {
        if (!state || !state.results) {
            navigate('/');
        }
    }, [state, navigate]);

    // Safety check for state
    if (!state || !state.results) return null;

    const { results, questions, total, isExamMode, themeId } = state;

    const handleRetakeOriginal = () => {
        if (themeId && themeId.startsWith('erreurs_')) {
            const originalId = themeId.replace('erreurs_', '');
            navigate(`/quiz/${originalId}`);
        } else {
            navigate('/');
        }
    };

    const handleReviewRemaining = () => {
        // Filter questions that were answered incorrectly in THIS session
        const incorrectIndices = results.answers
            .map((a, index) => (!a.isCorrect ? index : -1))
            .filter(index => index !== -1);

        const remainingQuestions = incorrectIndices.map(index => questions[index]);

        if (remainingQuestions.length > 0) {
            navigate('/quiz/erreurs', {
                state: {
                    questions: remainingQuestions,
                    theme: {
                        id: themeId, // Keep same ID (e.g. 'erreurs' or 'erreurs_themeId')
                        name: 'Révision (Suite)',
                        file: null
                    }
                }
            });
        }
    };

    return (
        <>
            <TopControls
                toggleTheme={toggleTheme}
                isDarkMode={isDarkMode}
                onOpenProfile={() => navigate('/profil')}
            />
            <Results
                score={results.score}
                total={total}
                questions={questions}
                answers={results.answers}
                showReview={true}
                onRestart={() => navigate(-1)} // Go back to quiz (will reload it)
                onBackToThemes={() => navigate('/')}
                isExamMode={isExamMode}
                themeId={themeId}
                onRetakeFullQuiz={handleRetakeOriginal}
                onReviewRemaining={handleReviewRemaining}
            />
        </>
    );
};

export default ResultsPage;
