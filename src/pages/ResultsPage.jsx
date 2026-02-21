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
    // Flatten the results object if it exists (legacy/robustness)
    const resultsData = state.results ? { ...state, ...state.results } : state;
    
    if (resultsData.isReviewSession) {
        // Filter only the questions that were answered incorrectly in the current session
        const mistakeQuestions = (resultsData.questions || []).filter((q, idx) => {
            const ans = resultsData.answers?.[idx];
            return ans && ans.isCorrect === false;
        });

        if (mistakeQuestions.length > 0) {
            navigate('/quiz/review', {
                state: {
                    questions: mistakeQuestions,
                    title: resultsData.title || 'Révision des erreurs',
                    isReview: true
                }
            });
            return;
        }
    }

    if (resultsData.questions && resultsData.questions.length > 0) {
        // If it was a theme quiz, we might have the themeId
        const firstQ = resultsData.questions[0];
        const themeId = firstQ.originalThemeId || resultsData.themeId;
        if (themeId === 'examen_B') {
            navigate('/examen-b');
        } else if (themeId) {
            navigate(`/quiz/${themeId}`);
        } else {
            navigate('/');
        }
    } else {
        if (resultsData.themeId === 'examen_B') {
            navigate('/examen-b');
        } else {
            navigate('/');
        }
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
