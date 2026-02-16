import React, { useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import Results from '../components/Results';

const ResultsPage = ({ toggleTheme, isDarkMode }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const state = location.state || {};

  // If no state exists (e.g. direct access or refresh), redirect or show error?
  // Usually, if they refresh on results, we might want to redirect to home.
  useEffect(() => {
    if (!location.state) {
      console.warn("No state found in ResultsPage, redirecting to home.");
      // For now, let's NOT redirect automatically to allow debugging, 
      // but in production, we should probably go back to themes.
    }
  }, [location.state]);

  const handleRestart = () => {
    if (state.questions && state.questions.length > 0) {
        // If it was a theme quiz, we might have the themeId
        const firstQ = state.questions[0];
        const themeId = firstQ.originalThemeId || (location.state.themeId);
        if (themeId) {
            navigate(`/quiz/${themeId}`);
        } else {
            navigate('/');
        }
    } else {
        navigate('/');
    }
  };

  const handleBackToThemes = () => {
    navigate('/');
  };

  const handleBackToProfile = () => {
    navigate('/profil');
  };

  // Flatten the results object if it exists (legacy/robustness)
  const resultsData = state.results ? { ...state, ...state.results } : state;

  return (
    <div className="page animate-fade-in">
      <Results 
        {...resultsData} 
        onRestart={handleRestart}
        onBackToThemes={handleBackToThemes}
        onBackToProfile={handleBackToProfile}
        toggleTheme={toggleTheme}
        isDarkMode={isDarkMode}
        showReview={true} 
      />
    </div>
  );
};

export default ResultsPage;
