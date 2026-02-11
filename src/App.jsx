import { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import HomePage from './pages/HomePage';
import QuizPage from './pages/QuizPage';
import ResultsPage from './pages/ResultsPage';
import ProfilePage from './pages/ProfilePage';
import LessonPage from './pages/LessonPage';
import TopControls from './components/TopControls';
import { loadThemeQuestions, loadThemesIndex } from './utils/contentLoader';

// Utility to start the GitHub login flow
const handleLogin = () => {
  const clientId = import.meta.env.VITE_GITHUB_CLIENT_ID;
  const redirectUri = window.location.origin + window.location.pathname;
  const scope = 'public_repo';
  window.location.href = `https://github.com/login/oauth/authorize?client_id=${clientId}&redirect_uri=${redirectUri}&scope=${scope}`;
};

function App() {
  const [sections, setSections] = useState([]);
  const [progress, setProgress] = useState({});
  const [colorTheme, setColorTheme] = useState('light');
  const [instantFeedback, setInstantFeedback] = useState(false);
  const [autoPlayAudio, setAutoPlayAudio] = useState(false);

  // Initialize theme from localStorage or system preference
  useEffect(() => {
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme) {
      setColorTheme(savedTheme);
      document.documentElement.setAttribute('data-theme', savedTheme);
      return;
    }

    const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    setColorTheme(systemTheme);
    document.documentElement.setAttribute('data-theme', systemTheme);
  }, []);

  // Dynamic Page Title
  useEffect(() => {
    const path = window.location.hash.replace('#', '') || '/';
    let title = 'Permis Online Free';

    if (path.startsWith('/quiz')) title = 'Quiz - Permis Online Free';
    else if (path.startsWith('/resultats')) title = 'Résultats - Permis Online Free';
    else if (path === '/profil') title = 'Mon Profil - Permis Online Free';
    else if (path.startsWith('/lecon')) title = 'Leçon - Permis Online Free';

    document.title = title;
  }, []); // Note: With BrowserRouter this effect needs to listen to location changes, but for now purely static title or simple hook is fine.

  const toggleTheme = () => {
    const newTheme = colorTheme === 'light' ? 'dark' : 'light';
    setColorTheme(newTheme);
    document.documentElement.setAttribute('data-theme', newTheme);
    localStorage.setItem('theme', newTheme);
  };

  const toggleInstantFeedback = () => {
    const newState = !instantFeedback;
    setInstantFeedback(newState);
    localStorage.setItem('instantFeedback', JSON.stringify(newState));
  };

  const toggleAutoPlayAudio = () => {
    const newState = !autoPlayAudio;
    setAutoPlayAudio(newState);
    localStorage.setItem('autoPlayAudio', JSON.stringify(newState));
  };

  // Load initial data
  useEffect(() => {
    const loadData = async () => {
      try {
        const themesData = await loadThemesIndex();
        if (themesData && themesData.sections) {
          setSections(themesData.sections);
        }
      } catch (error) {
        console.error("Failed to load themes index", error);
      }
    };
    loadData();

    // Load progress
    const savedProgress = localStorage.getItem('quizProgress');
    if (savedProgress) {
      setProgress(JSON.parse(savedProgress));
    }

    // Load settings
    const savedFeedback = localStorage.getItem('instantFeedback');
    if (savedFeedback) {
      setInstantFeedback(JSON.parse(savedFeedback));
    }

    const savedAudio = localStorage.getItem('autoPlayAudio');
    if (savedAudio) {
      setAutoPlayAudio(JSON.parse(savedAudio));
    }
  }, []);

  const saveProgress = (themeId, score, total, answers) => {
    const previousBest = progress[themeId]?.bestScore || 0;
    const newBestScore = Math.max(score, previousBest);

    const newProgress = {
      ...progress,
      [themeId]: {
        score, // Last score
        bestScore: newBestScore, // Best score ever
        total,
        date: new Date().toISOString(),
        answers // Save answers for review
      }
    };
    setProgress(newProgress);
    localStorage.setItem('quizProgress', JSON.stringify(newProgress));
  };

  const handleMistakeCorrection = (corrections) => {
    // corrections: [{ themeId, questionId }]
    const newProgress = { ...progress };
    let hasChanges = false;

    corrections.forEach(({ themeId, questionId }) => {
      if (!newProgress[themeId]) return;

      const themeProgress = newProgress[themeId];
      if (!themeProgress.answers) return;

      const answerIndex = themeProgress.answers.findIndex(a => a.questionId === questionId);
      if (answerIndex !== -1 && !themeProgress.answers[answerIndex].isCorrect) {
        // Update answer
        const newAnswers = [...themeProgress.answers];
        newAnswers[answerIndex] = {
          ...newAnswers[answerIndex],
          isCorrect: true
        };

        // Recalculate score
        const newScore = newAnswers.filter(a => a.isCorrect).length;
        const newBestScore = Math.max(themeProgress.bestScore, newScore);

        newProgress[themeId] = {
          ...themeProgress,
          answers: newAnswers,
          score: newScore,
          bestScore: newBestScore
        };
        hasChanges = true;
      }
    });

    if (hasChanges) {
      setProgress(newProgress);
      localStorage.setItem('quizProgress', JSON.stringify(newProgress));
    }
  };



  const handleResetProgress = () => {
    if (window.confirm('Êtes-vous sûr de vouloir réinitialiser toute votre progression ?')) {
      setProgress({});
      localStorage.removeItem('quizProgress');
    }
  };

  // Debug methods
  window.debugApp = {
    sections,
    progress,
    resetProgress: () => {
      setProgress({});
      localStorage.removeItem('quizProgress');
      console.log("Progress reset");
    }
  };

  const isDarkMode = colorTheme === 'dark';

  return (
    <BrowserRouter basename="/permis-online-free/">
      <Routes>
        <Route
          path="/"
          element={
            <HomePage
              sections={sections}
              progress={progress}
              toggleTheme={toggleTheme}
              isDarkMode={isDarkMode}
            />
          }
        />
        <Route
          path="/profil"
          element={
            <ProfilePage
              progress={progress}
              themesData={{ sections }}
              onReset={handleResetProgress}
              instantFeedback={instantFeedback}
              onToggleInstantFeedback={toggleInstantFeedback}
              autoPlayAudio={autoPlayAudio}
              onToggleAutoPlayAudio={toggleAutoPlayAudio}
              toggleTheme={toggleTheme}
              isDarkMode={isDarkMode}
            />
          }
        />
        <Route
          path="/lecon/:lessonId"
          element={<LessonPage themeMode={colorTheme} />}
        />
        <Route
          path="/quiz/:themeId"
          element={
            <QuizPage
              sections={sections}
              onFinishQuiz={saveProgress}
              instantFeedback={instantFeedback}
              autoPlayAudio={autoPlayAudio}
              toggleTheme={toggleTheme}
              isDarkMode={isDarkMode}
            />
          }
        />
        <Route
          path="/resultats"
          element={
            <ResultsPage
              toggleTheme={toggleTheme}
              isDarkMode={isDarkMode}
            />
          }
        />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
