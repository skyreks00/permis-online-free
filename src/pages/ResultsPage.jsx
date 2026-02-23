import React, { useEffect, useState, useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import Results from '../components/Results';
import { analyzeMistakesWithGroq } from '../utils/groq';
import { loadThemesIndex, loadThemeQuestions } from '../utils/contentLoader';

const ResultsPage = ({ toggleTheme, isDarkMode }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const state = location.state || {};
  
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [aiReport, setAiReport] = useState(null);
  const [questionToThemeMap, setQuestionToThemeMap] = useState({});
  const [themes, setThemes] = useState([]);
  const [mappingsLoaded, setMappingsLoaded] = useState(false);

  // If no state exists (e.g. direct access or refresh), redirect or show error?
  // Usually, if they refresh on results, we might want to redirect to home.
  useEffect(() => {
    if (!location.state) {
      console.warn("No state found in ResultsPage, redirecting to home.");
    }

    // Load theme mappings for AI context
    const initMappings = async () => {
        try {
            const themesIndex = await loadThemesIndex();
            if (themesIndex && themesIndex.sections) {
                const allThemes = [];
                themesIndex.sections.forEach(s => {
                    if (s.items) s.items.forEach(i => allThemes.push(i));
                });
                setThemes(allThemes);

                const mapping = {};
                await Promise.all(allThemes.map(async (item) => {
                    try {
                        const themeData = await loadThemeQuestions(item.file);
                        if (themeData && themeData.questions) {
                            themeData.questions.forEach(q => {
                                const cleanText = q.question.trim().toLowerCase().replace(/\s+/g, ' ');
                                if (!mapping[cleanText]) mapping[cleanText] = new Set();
                                mapping[cleanText].add(item.id);
                            });
                        }
                    } catch (err) {}
                }));
                setQuestionToThemeMap(mapping);
                setMappingsLoaded(true);
            }
        } catch (e) {
            console.error("Failed to load mappings for Results AI", e);
        }
    };
    initMappings();
  }, [location.state]);

  const handleAiAnalysis = async () => {
    const apiKey = localStorage.getItem('groq_api_key');
    if (!apiKey) {
        alert("Veuillez d'abord configurer votre clé API Groq dans les paramètres.");
        return;
    }

    // Identify mistakes from current session
    const resultsData = state.results ? { ...state, ...state.results } : state;
    const questions = resultsData.questions || [];
    const answers = resultsData.answers || [];
    const mistakeQuestions = questions.filter((q, idx) => {
        const ans = answers[idx];
        return ans && ans.isCorrect === false;
    });

    if (mistakeQuestions.length === 0) {
        alert("Félicitations, vous n'avez fait aucune erreur ! Pas d'analyse nécessaire.");
        return;
    }

    setIsAnalyzing(true);
    setAiReport(null);

    try {
        const dataToAnalyze = mistakeQuestions.map(q => {
            const cleanText = q.question.trim().toLowerCase().replace(/\s+/g, ' ');
            const themeIds = questionToThemeMap[cleanText];
            const themeNames = themeIds 
                ? [...themeIds].map(id => themes.find(t => t.id === id)?.name).filter(Boolean)
                : ["Non classé"];
            return {
                question: q.question,
                themes: themeNames
            };
        });

        const report = await analyzeMistakesWithGroq(dataToAnalyze, apiKey);
        setAiReport(report);
        
        // Scroll to report
        setTimeout(() => {
            const reportEl = document.querySelector('.eb-ai-report');
            if (reportEl) reportEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }, 100);

    } catch (err) {
        alert("Erreur lors de l'analyse : " + err.message);
    } finally {
        setIsAnalyzing(false);
    }
  };

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
        onAiAnalysis={handleAiAnalysis}
        isAnalyzing={isAnalyzing}
        aiReport={aiReport}
      />
    </div>
  );
};

export default ResultsPage;
