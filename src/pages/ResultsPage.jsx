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

    if (!state || !state.results) return null;

    const { results, questions, total, isExamMode } = state;

    return (
        <>
            <TopControls
                toggleTheme={toggleTheme}
                isDarkMode={isDarkMode}
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
            />
        </>
    );
};

export default ResultsPage;
