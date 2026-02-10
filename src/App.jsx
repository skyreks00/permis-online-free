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
  const [isExamMode, setIsExamMode] = useState(false);
  const [selectedLesson, setSelectedLesson] = useState(null);
  const [colorTheme, setColorTheme] = useState(null);
  const [showProfile, setShowProfile] = useState(false);
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

  // Debug methods exposed to console
  useEffect(() => {
    window.appDebug = {
      // Force open results page
      openResults: async (score = 42, reqTotal = 50, themeFile = 'examen_B.json') => {
        let loaded = [];
        try {
          const loadedQuestions = await loadQuestions(themeFile);
          if (loadedQuestions && loadedQuestions.length > 0) {
            loaded = loadedQuestions;
          } else {
            throw new Error('Aucune question chargée');
          }
        } catch (e) {
          console.error("Impossible de charger les questions réelles, fallback sur mock", e);
        }

        if (loaded.length === 0) {
          loaded = Array.from({ length: reqTotal }, (_, i) => ({
            id: i,
            question: `Question Debug ${i + 1}`,
            type: 'multiple_choice',
            propositions: [
              { letter: 'A', text: 'Réponse A' },
              { letter: 'B', text: 'Réponse B' }
            ],
            correctAnswer: 'A',
            explanation: 'Explication debug pour la question ' + (i + 1)
          }));
        }

        // Limit total to available questions if we are using real data
        const total = Math.min(reqTotal, loaded.length);
        const questionsToUse = loaded.slice(0, total);
        const effectiveScore = Math.min(score, total);

        setQuestions(questionsToUse);
        setResults({
          correct: effectiveScore,
          incorrect: total - effectiveScore,
          score: effectiveScore,
          answers: questionsToUse.map((q, i) => {
            const isCorrect = i < effectiveScore;
            let userAnswer = q.correctAnswer;
            if (!isCorrect) {
              const wrongProp = q.propositions?.find(p => p.letter !== q.correctAnswer);
              userAnswer = wrongProp ? wrongProp.letter : (q.correctAnswer === 'A' ? 'B' : 'A');
            }
            return {
              questionId: q.id,
              userAnswer: userAnswer,
              correctAnswer: q.correctAnswer,
              isCorrect: isCorrect
            };
          })
        });
        setShowResults(true);
        setSelectedTheme({ id: 'debug', name: 'Mode Debug (Réel)', file: themeFile });
        setIsExamMode(themeFile.includes('examen'));
        console.log(`> Page de résultats ouverte avec score ${effectiveScore}/${total} (${themeFile})`);
      },

      // Force start a quiz (first available or specific index)
      startQuiz: (sectionIndex = 0, themeIndex = 0) => {
        try {
          const theme = sections[sectionIndex]?.themes[themeIndex];
          if (theme) {
            handleSelectTheme(theme);
            console.log(`> Quiz démarré: ${theme.name}`);
          } else {
            console.error('Thème non trouvé aux index donnés');
          }
        } catch (e) {
          console.error('Erreur au démarrage du quiz:', e);
        }
      }
    };

    console.log("🔧 Mode Debug actif: Utilisez window.appDebug.openResults() ou window.appDebug.startQuiz()");

    return () => {
      delete window.appDebug;
    };
  }, [sections]);

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
      const base = import.meta.env.BASE_URL || '/';
      const response = await fetch(`${base}data/${themeFile}`);
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

    // Check for Exam Mode
    const isExam = theme.id === 'examen_B';
    setIsExamMode(isExam);

    const loadedQuestions = await loadQuestions(theme.file);
    // Mélanger les questions
    const shuffled = [...loadedQuestions].sort(() => Math.random() - 0.5);

    if (isExam) {
      // Limit to 50 questions for Exam Mode
      setQuestions(shuffled.slice(0, 50));
    } else {
      setQuestions(shuffled); // Prendre toutes les questions
    }

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

    // Save progress
    if (selectedTheme) {
      saveProgress(selectedTheme.id, score, questions.length);
    }

    setShowResults(true);
  };

  const handleRestart = async () => {
    handleSelectTheme(selectedTheme);
  };

  const handleBackToThemes = () => {
    setSelectedTheme(null);
    setQuestions([]);
    setShowResults(false);
    setIsExamMode(false);
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
          instantFeedback={instantFeedback}
          onToggleInstantFeedback={toggleInstantFeedback}
          autoPlayAudio={autoPlayAudio}
          onToggleAutoPlayAudio={toggleAutoPlayAudio}
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
          isExamMode={isExamMode}
        />
      </>
    );
  }

  const handleUpdateQuestion = (questionId, newQuestionData) => {
    console.log("handleUpdateQuestion called for ID:", questionId);
    setQuestions(prevQuestions => prevQuestions.map(q => {
      // Robust comparison (String cast) to avoid type mismatches
      if (String(q.id) === String(questionId)) {
        console.log("Match found! Updating question content.");
        return { ...q, ...newQuestionData };
      }
      return q;
    }));
  };

  if (selectedTheme && questions.length > 0) {
    return (
      <>
        <Quiz
          questions={questions}
          themeName={selectedTheme.name}
          onFinish={handleFinishQuiz}
          onExit={handleBackToThemes}
          instantFeedback={!isExamMode && instantFeedback}
          autoPlayAudio={autoPlayAudio}
          fileName={selectedTheme.file}
          onUpdateQuestion={handleUpdateQuestion}
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
        onSelectLesson={handleSelectLesson}
      />
    </>
  );
}

export default App;
