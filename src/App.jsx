import { useState, useEffect } from 'react';
import { Moon, Sun, User } from 'lucide-react';
import ThemeSelector from './components/ThemeSelector';
import Quiz from './components/Quiz';
import Results from './components/Results';
import LessonViewer from './components/LessonViewer';
import Profile from './components/Profile';
import themesData from './data/themes.json';

function App() {
  const [sections, setSections] = useState(themesData?.sections || []);
  const [selectedTheme, setSelectedTheme] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [results, setResults] = useState({ correct: 0, incorrect: 0, answers: [] });
  const [isRandomMode, setIsRandomMode] = useState(false);
  const [selectedLesson, setSelectedLesson] = useState(null);
  const [colorTheme, setColorTheme] = useState(null);
  const [showProfile, setShowProfile] = useState(false);

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
    // Only save for specific themes, not random mode
    if (isRandomMode || !themeId) return;

    setProgress(prev => {
      const current = prev[themeId] || { bestScore: 0, attempts: 0, totalQuestions: total };
      const newProgress = {
        ...prev,
        [themeId]: {
          bestScore: Math.max(current.bestScore, score),
          attempts: current.attempts + 1,
          totalQuestions: total // Update total in case it changes
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

  useEffect(() => {
    // initialize color theme
    const stored = localStorage.getItem('color-theme');
    if (stored === 'light' || stored === 'dark') {
      setTheme(stored);
    } else {
      const prefersLight = window.matchMedia && window.matchMedia('(prefers-color-scheme: light)').matches;
      setTheme(prefersLight ? 'light' : 'dark');
    }
    // respond to system changes
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

  /* 
   * Themes are loaded directly from import, no async fetch needed for the list.
   * Questions are loaded on demand.
   */

  const loadQuestions = async (themeFile) => {
    try {
      const response = await fetch(`/data/${themeFile}`);
      const data = await response.json();
      return data.questions;
    } catch (error) {
      console.error('Erreur lors du chargement des questions:', error);
      return [];
    }
  };

  const handleSelectTheme = async (theme) => {
    // We only select themes that have a file (quiz)
    if (!theme.file) return;

    setSelectedTheme(theme);
    setIsRandomMode(false);
    const loadedQuestions = await loadQuestions(theme.file);
    // Mélanger les questions
    const shuffled = [...loadedQuestions].sort(() => Math.random() - 0.5);
    setQuestions(shuffled); // Prendre toutes les questions
    setShowResults(false);
  };

  const handleStartRandom = async () => {
    setIsRandomMode(true);
    setSelectedTheme({ name: 'Quiz Aléatoire' });

    // Charger des questions de plusieurs thèmes
    const allQuestions = [];

    // Flatten all themes from sections
    const allThemes = (sections || []).flatMap(s => s.items).filter(item => item.file);

    for (const theme of allThemes) {
      const themeQuestions = await loadQuestions(theme.file);
      allQuestions.push(...themeQuestions);
    }

    // Mélanger et prendre toutes les questions
    const shuffled = [...allQuestions].sort(() => Math.random() - 0.5);
    setQuestions(shuffled);
    setShowResults(false);
  };

  const handleFinishQuiz = (payload) => {
    let score = 0;
    let answers = [];

    if (typeof payload === 'number') {
      score = payload ?? 0;
    } else {
      score = payload?.score ?? 0;
      answers = payload?.answers ?? [];
    }

    setResults({
      correct: score,
      incorrect: questions.length - score,
      answers: answers,
      score: score
    });

    // Save progress if not random mode
    if (!isRandomMode && selectedTheme) {
      saveProgress(selectedTheme.id, score, questions.length);
    }

    setShowResults(true);
  };

  const handleRestart = async () => {
    if (isRandomMode) {
      handleStartRandom();
    } else {
      handleSelectTheme(selectedTheme);
    }
  };

  const handleBackToThemes = () => {
    setSelectedTheme(null);
    setQuestions([]);
    setShowResults(false);
    setIsRandomMode(false);
  };

  const handleSelectLesson = (lessonFile) => {
    setSelectedLesson(lessonFile);
  };

  const handleBackFromLesson = () => {
    setSelectedLesson(null);
  };

  const handleShowProfile = () => {
    setShowProfile(true);
  };

  const handleBackFromProfile = () => {
    setShowProfile(false);
  };

  const TopControls = () => (
    <div style={{
      position: 'fixed',
      top: '20px',
      right: '20px',
      display: 'flex',
      gap: '4px',
      zIndex: 1000,
      background: 'var(--surface)',
      padding: '4px',
      borderRadius: '30px',
      border: '1px solid var(--border)',
      boxShadow: 'var(--shadow-sm)'
    }}>
      {!showProfile && (
        <button
          className="btn-ghost"
          onClick={handleShowProfile}
          title="Mon Profil"
          style={{
            width: '36px',
            height: '36px',
            display: 'grid',
            placeItems: 'center',
            padding: 0,
            borderRadius: '50%'
          }}
        >
          <User size={20} />
        </button>
      )}
      <button
        className="theme-toggle btn-ghost"
        onClick={toggleTheme}
        title={colorTheme === 'light' ? 'Mode sombre' : 'Mode clair'}
        style={{
          width: '36px',
          height: '36px',
          display: 'grid',
          placeItems: 'center',
          padding: 0,
          borderRadius: '50%'
        }}
      >
        {colorTheme === 'light' ? <Moon size={20} /> : <Sun size={20} />}
      </button>
    </div>
  );

  if (isLoading) {
    return (
      <div className="container">
        <TopControls />
        <p>Chargement...</p>
      </div>
    );
  }

  // Quiz-only flow (no lessons routing)


  if (selectedLesson) {
    return (
      <>
        <TopControls />
        <LessonViewer lessonFile={selectedLesson} onBack={handleBackFromLesson} theme={colorTheme} />
      </>
    );
  }

  if (showProfile) {
    return (
      <>
        <TopControls />
        <Profile
          progress={progress}
          themesData={themesData}
          onBack={handleBackFromProfile}
          onReset={handleResetProgress}
        />
      </>
    );
  }


  if (showResults) {
    return (
      <>
        <TopControls />
        <Results
          score={results.score || results.correct} // Handle both structures if needed
          total={questions.length}
          questions={questions}
          answers={results.answers}
          showReview={true}
          onRestart={handleRestart}
          onBackToThemes={handleBackToThemes}
        />
      </>
    );
  }

  if (selectedTheme && questions.length > 0) {
    return (
      <>
        <TopControls />
        <Quiz
          questions={questions}
          themeName={selectedTheme.name}
          onFinish={handleFinishQuiz}
          onExit={handleBackToThemes}
        />
      </>
    );
  }

  return (
    <>
      <TopControls />
      <ThemeSelector
        sections={sections}
        progress={progress}
        onSelectTheme={handleSelectTheme}
        onStartRandom={handleStartRandom}
        onSelectLesson={handleSelectLesson}
      />
    </>
  );
}

export default App;
