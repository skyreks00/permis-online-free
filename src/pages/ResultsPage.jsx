import React, { useEffect } from 'react';
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import Results from '../components/Results';
import TopControls from '../components/TopControls';
import ChatAssistant from '../components/ChatAssistant';

const ResultsPage = ({ toggleTheme, isDarkMode }) => {
    const { state, pathname } = useLocation();
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    
    // Determine if we are in review mode either via State, URL Query, or Path
    const isReviewMode = state?.isReviewOnly || searchParams.get('review') === 'true' || pathname === '/revision';

    useEffect(() => {
        // If not in review mode and no results state, redirect home
        if (!isReviewMode && (!state || !state.results)) {
            navigate('/');
        }
    }, [state, navigate, isReviewMode]);

    if (!isReviewMode && (!state || !state.results)) return null;

    // Use state results or empty defaults if just reviewing via URL (though URL usually comes with state too)
    const results = state?.results || { score: 0, answers: [] };
    const questions = state?.questions || [];
    const total = state?.total || 0;
    const isExamMode = state?.isExamMode || false;
    const customErrorItems = state?.customErrorItems || null;

    // Prepare mistakes for ChatAssistant
    const mistakes = results.answers
        .map((a, index) => {
            if (a.isCorrect) return null;
            return {
                q: questions[index],
                a: a,
                questionIndex: index
            };
        })
        .filter(Boolean);

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
                isReviewOnly={isReviewMode}
                customErrorItems={customErrorItems}
                onBackToProfile={() => navigate('/profil')}
            />
            {mistakes.length > 0 && <ChatAssistant mistakes={mistakes} />}
        </>
    );
};

export default ResultsPage;
