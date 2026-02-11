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

    const { results, questions, total, isExamMode, themeId } = state;

    const handleRetakeOriginal = () => {
        if (themeId && themeId.startsWith('erreurs_')) {
            const originalId = themeId.replace('erreurs_', '');
            navigate(`/quiz/${originalId}`);
        } else {
            navigate('/');
        }
    };

    if (!state || !state.results) return null;

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
