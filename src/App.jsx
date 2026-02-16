import { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import HomePage from './pages/HomePage';
import QuizPage from './pages/QuizPage';
import ResultsPage from './pages/ResultsPage';
import ProfilePage from './pages/ProfilePage';
import LessonPage from './pages/LessonPage';
import TopControls from './components/TopControls';
import { loadThemeQuestions, loadThemesIndex } from './utils/contentLoader';

import { auth } from './utils/firebase';
import { fetchFileContent } from './utils/githubClient';

function App() {
  useEffect(() => {
    console.log("🚀 Permis Online Free - Version 1.5 (Score Fix + Interaction Lock)");
  }, []);

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

    // Load settings
    const savedAudio = localStorage.getItem('autoPlayAudio');
    if (savedAudio) {
      setAutoPlayAudio(JSON.parse(savedAudio));
    }

    // AUTH & AUTO-SYNC PULL
    const unsubscribe = auth.onAuthStateChanged(async (user) => {
        if (user) {
            console.log("👤 User logged in:", user.displayName);
            const token = localStorage.getItem('github_token');
            if (token) {
                // Trigger auto-pull on login
                pullFromCloud(token);
            }
        }
    });

    return () => unsubscribe();
  }, []);

  const saveProgress = (themeId, score, total, answers) => {
    const newProgress = {
      ...progress,
      [themeId]: {
        score,
        total,
        date: new Date().toISOString(),
        answers // Save answers for review
      }
    };
    setProgress(newProgress);
    localStorage.setItem('quizProgress', JSON.stringify(newProgress));

    // Auto-Sync to Cloud
    const token = localStorage.getItem('github_token');
    if (token) {
        // Debounce or just fire and forget ? Fire and forget with toast for now.
        // We use a small helper to avoid code duplication
        syncToCloud(newProgress, token);
    }
  };

  /**
   * Patches existing progress with new answers (e.g. from review mode)
   * This allows correcting specific mistakes without overwriting the original score/date
   * @param {string} themeId 
   * @param {Array} newAnswers - Array of { questionId, isCorrect, ... }
   */
  const patchProgress = (themeId, newAnswers) => {
    if (!progress[themeId]) return;

    const currentThemeProgress = progress[themeId];
    const oldAnswers = currentThemeProgress.answers || [];
    
    // Merge new answers into old answers
    // If a question is answered in newAnswers, it replaces the old one
    const updatedAnswers = oldAnswers.map(oldAns => {
        // Use loose equality to match string/number IDs
        const newAns = newAnswers.find(na => na.questionId == oldAns.questionId);
        return newAns ? newAns : oldAns;
    });

    // Also append any new answers that weren't in old answers (unlikely but safe)
    newAnswers.forEach(newAns => {
        if (!updatedAnswers.find(ua => ua.questionId == newAns.questionId)) {
            updatedAnswers.push(newAns);
        }
    });

    // Recalculate score based on the updated answers
    const newScore = updatedAnswers.filter(a => a.isCorrect).length;

    const newProgress = {
        ...progress,
        [themeId]: {
            ...currentThemeProgress,
            answers: updatedAnswers,
            score: newScore // Update the score to reflect corrections
        }
    };

    setProgress(newProgress);
    localStorage.setItem('quizProgress', JSON.stringify(newProgress));

    // Auto-Sync to Cloud
    const token = localStorage.getItem('github_token');
    if (token) {
        syncToCloud(newProgress, token);
    }
  };

  const syncToCloud = async (data, token) => {
       try {
           setSyncStatus('syncing');
           const { saveFileContent } = await import('./utils/githubClient');
           
           console.log("☁️ Auto-syncing to cloud...");
           
           const result = await saveFileContent(
               token, 
               'skyreks00', 
               'permis-online-free', 
               'user_data/progress.json', 
               JSON.stringify(data, null, 2), 
               'chore: auto-sync user progress'
           );
           
           if(result.success) {
               console.log("☁️ Auto-sync complete!");
               setSyncStatus('success');
               setTimeout(() => setSyncStatus(null), 3000);
           }
       } catch (e) {
           console.error("☁️ Auto-sync failed:", e);
           setSyncStatus('error');
           setTimeout(() => setSyncStatus(null), 5000);
       }
  };

  const pullFromCloud = async (token) => {
      try {
          setSyncStatus('syncing');
          console.log("☁️ Auto-pulling from cloud...");
          const result = await fetchFileContent(token, 'skyreks00', 'permis-online-free', 'user_data/progress.json');
          
          if (!result || !result.content) {
              setSyncStatus(null);
              return;
          }

          const remoteProgress = JSON.parse(result.content);
          const savedProgress = JSON.parse(localStorage.getItem('quizProgress') || '{}');
          
          // Merge logic
          const newProgress = { ...savedProgress };
          Object.keys(remoteProgress).forEach(themeId => {
              const r = remoteProgress[themeId];
              const l = newProgress[themeId];
              if (!l || (r.date && new Date(r.date) > new Date(l.date || 0))) {
                  newProgress[themeId] = r;
              }
          });

          setProgress(newProgress);
          localStorage.setItem('quizProgress', JSON.stringify(newProgress));
          setSyncStatus('success');
          console.log("☁️ Auto-pull complete!");
          setTimeout(() => setSyncStatus(null), 3000);
      } catch (e) {
          console.error("☁️ Auto-pull failed:", e);
          setSyncStatus('error');
          setTimeout(() => setSyncStatus(null), 5000);
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
  const [syncStatus, setSyncStatus] = useState(null); // 'syncing', 'success', 'error'

  return (
    <BrowserRouter basename="/permis-online-free/">
      {/* GLOBAL SYNC TOAST */}
      {syncStatus && (
        <div style={{
            position: 'fixed',
            bottom: '20px',
            right: '20px',
            background: syncStatus === 'error' ? 'var(--danger)' : 'var(--surface-1)',
            color: syncStatus === 'error' ? 'white' : 'var(--foreground)',
            padding: '12px 20px',
            borderRadius: '8px',
            boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
            zIndex: 10000,
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            border: '1px solid var(--border)',
            fontWeight: '500',
            animation: 'slideUp 0.3s ease-out'
        }}>
            {syncStatus === 'syncing' && <span>☁️ Synchronisation...</span>}
            {syncStatus === 'success' && <span className="text-success">✅ Sauvegardé !</span>}
            {syncStatus === 'error' && <span>❌ Erreur Synchro</span>}
        </div>
      )}

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
              onPatchProgress={patchProgress}
              instantFeedback={instantFeedback}
              autoPlayAudio={autoPlayAudio}
              toggleTheme={toggleTheme}
              isDarkMode={isDarkMode}
            />
          }
        />
        <Route
          path="/revision"
          element={
            <ResultsPage
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
