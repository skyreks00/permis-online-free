import { useState, useEffect } from 'react';
import { HashRouter, Routes, Route } from 'react-router-dom';
import HomePage from './pages/HomePage';
import QuizPage from './pages/QuizPage';
import ResultsPage from './pages/ResultsPage';
import LessonPage from './pages/LessonPage';
import ProfilePage from './pages/ProfilePage';
import bundledThemes from './data/themes.json';
import { loadThemesIndex } from './utils/contentLoader';

function App() {
  const [sections, setSections] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // Preferences
  const [colorTheme, setColorTheme] = useState(null);
  const [instantFeedback, setInstantFeedback] = useState(() => {
    return localStorage.getItem('instantFeedback') === 'true';
  });
  const [autoPlayAudio, setAutoPlayAudio] = useState(() => {
    return localStorage.getItem('autoPlayAudio') === 'true';
  });

  const toggleInstantFeedback = () => {
    setInstantFeedback(prev => {
      const next = !prev;
      localStorage.setItem('instantFeedback', String(next));
      return next;
    });
  };

  const toggleAutoPlayAudio = () => {
    setAutoPlayAudio(prev => {
      const next = !prev;
      localStorage.setItem('autoPlayAudio', String(next));
      return next;
    });
  };

  // Persistence state
  const [progress, setProgress] = useState(() => {
    try {
      const stored = localStorage.getItem('user-progress');
      return stored ? JSON.parse(stored) : {};
    } catch (e) {
      console.error("Failed to load progress", e);
      return {};
    }
  });

  // Save progress handler
  const saveProgress = (themeId, score, total) => {
    if (!themeId) return;

    setProgress(prev => {
      const current = prev[themeId] || { bestScore: 0, attempts: 0, totalQuestions: total };
      const newProgress = {
        ...prev,
        [themeId]: {
          bestScore: Math.max(current.bestScore, score),
          attempts: current.attempts + 1,
          totalQuestions: total
        }
      };
      localStorage.setItem('user-progress', JSON.stringify(newProgress));
      return newProgress;
    });
  };

  const handleResetProgress = () => {
    localStorage.removeItem('user-progress');
    setProgress({});
  };

  // Load themes
  useEffect(() => {
    const loadThemes = async () => {
      try {
        setIsLoading(true);
        const themesData = await loadThemesIndex(bundledThemes);
        setSections(themesData?.sections || []);
      } catch (error) {
        console.error('Failed to load themes:', error);
        setSections(bundledThemes?.sections || []);
      } finally {
        setIsLoading(false);
      }
    };
    loadThemes();
  }, []);

  // Theme Management
  useEffect(() => {
    const stored = localStorage.getItem('color-theme');
    if (stored === 'light' || stored === 'dark') {
      setTheme(stored);
    } else {
      const prefersLight = window.matchMedia && window.matchMedia('(prefers-color-scheme: light)').matches;
      setTheme(prefersLight ? 'light' : 'dark');
    }

    const media = window.matchMedia('(prefers-color-scheme: light)');
    const handler = (e) => {
      if (!localStorage.getItem('color-theme')) {
        setTheme(e.matches ? 'light' : 'dark');
      }
    };
    media.addEventListener?.('change', handler);
    return () => media.removeEventListener?.('change', handler);
  }, []);

  const setTheme = (theme) => {
    document.documentElement.setAttribute('data-theme', theme);
    setColorTheme(theme);
  };

  const toggleTheme = () => {
    const next = colorTheme === 'light' ? 'dark' : 'light';
    setTheme(next);
    localStorage.setItem('color-theme', next);
  };

  if (isLoading) {
    return <div className="p-8 text-center">Chargement...</div>;
  }

  const isDarkMode = colorTheme === 'dark';

  return (
    <HashRouter>
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
    </HashRouter>
  );
}

export default App;
