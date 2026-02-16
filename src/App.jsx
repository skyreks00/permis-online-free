import { useState, useEffect, useRef } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import HomePage from './pages/HomePage';
import QuizPage from './pages/QuizPage';
import ResultsPage from './pages/ResultsPage';
import ProfilePage from './pages/ProfilePage';
import LessonPage from './pages/LessonPage';
import TopControls from './components/TopControls';
import { loadThemeQuestions, loadThemesIndex } from './utils/contentLoader';

import { auth } from './utils/firebase';
import { fetchFileContent, getUser } from './utils/githubClient';

function App() {
  useEffect(() => {
    console.log("🚀 Permis Online Free - Version 1.5 (Score Fix + Interaction Lock)");
  }, []);

  const [sections, setSections] = useState([]);
  const [progress, setProgress] = useState({});
  const [colorTheme, setColorTheme] = useState('light');
  const [instantFeedback, setInstantFeedback] = useState(false);
  const [autoPlayAudio, setAutoPlayAudio] = useState(false);
  const [repoOwner, setRepoOwner] = useState('skyreks00'); // Default owner
  const [syncStatus, setSyncStatus] = useState(null); // 'syncing', 'success', 'error', 'pending'
  
  const isLocalUpdate = useRef(false);
  const debounceTimer = useRef(null);

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
                // Fetch GitHub user to determine the correct repository owner
                try {
                    const ghUser = await getUser(token);
                    if (ghUser && ghUser.login) {
                        console.log("⚓ GitHub Owner established:", ghUser.login);
                        setRepoOwner(ghUser.login);
                        // Trigger auto-pull on login with the correct owner
                        pullFromCloud(token, ghUser.login);
                    }
                } catch (e) {
                    console.error("Failed to fetch GitHub user:", e);
                    pullFromCloud(token, repoOwner);
                }
            }
        }
    });

    return () => unsubscribe();
  }, []);

  // DEBOUNCED CLOUD SYNC & LOCAL STORAGE SYNC
  useEffect(() => {
      // Always save to local storage
      localStorage.setItem('quizProgress', JSON.stringify(progress));

      if (isLocalUpdate.current) {
          isLocalUpdate.current = false;
          
          const token = localStorage.getItem('github_token');
          if (token) {
              if (debounceTimer.current) clearTimeout(debounceTimer.current);
              
              setSyncStatus('pending'); // Visual hint if needed
              
              debounceTimer.current = setTimeout(() => {
                  syncToCloud(progress, token);
              }, 2500); // 2.5s debounce
          }
      }
  }, [progress]);

  const saveProgress = (themeId, score, total, answers) => {
    isLocalUpdate.current = true;
    setProgress(prev => {
      const { metadata, ...rest } = prev;
      return {
        ...rest,
        metadata: metadata || {},
        [themeId]: {
          score,
          total,
          date: new Date().toISOString(),
          answers // Save answers for review
        }
      };
    });
  };

  /**
   * Patches existing progress with new answers (e.g. from review mode)
   * This allows correcting specific mistakes without overwriting the original score/date
   * @param {string} themeId 
   * @param {Array} newAnswers - Array of { questionId, isCorrect, ... }
   */
  const patchProgress = (themeId, newAnswers) => {
    isLocalUpdate.current = true;
    setProgress(prev => {
        if (!prev[themeId]) return prev;

        const currentThemeProgress = prev[themeId];
        const oldAnswers = currentThemeProgress.answers || [];
        
        // Merge new answers into old answers
        const updatedAnswers = oldAnswers.map(oldAns => {
            const newAns = newAnswers.find(na => na.questionId == oldAns.questionId);
            return newAns ? newAns : oldAns;
        });

        // Add any outliers
        newAnswers.forEach(newAns => {
            if (!updatedAnswers.find(ua => ua.questionId == newAns.questionId)) {
                updatedAnswers.push(newAns);
            }
        });

        const newScore = updatedAnswers.filter(a => a.isCorrect).length;

        const { metadata, ...rest } = prev;
        return {
            ...rest,
            metadata: metadata || {},
            [themeId]: {
                ...currentThemeProgress,
                answers: updatedAnswers,
                score: newScore,
                date: new Date().toISOString()
            }
        };
    });
  };

  const syncToCloud = async (data, token) => {
       try {
           setSyncStatus('syncing');
           const { saveFileContent } = await import('./utils/githubClient');
           
           console.log(`☁️ Auto-syncing to cloud (${repoOwner})...`);
           
           const result = await saveFileContent(
               token, 
               repoOwner, 
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

  const pullFromCloud = async (token, overrideOwner = null) => {
      try {
          const owner = overrideOwner || repoOwner;
          setSyncStatus('syncing');
          console.log(`☁️ Auto-pulling from GitHub (${owner})...`);
          const result = await fetchFileContent(token, owner, 'permis-online-free', 'user_data/progress.json');
          
          if (!result || !result.content) {
              setSyncStatus(null);
              return;
          }

          const remoteProgress = JSON.parse(result.content);
          const savedProgress = JSON.parse(localStorage.getItem('quizProgress') || '{}');
          
          // 1. Check for Cross-Device Reset
          const remoteReset = remoteProgress.metadata?.lastResetAll;
          const localReset = savedProgress.metadata?.lastResetAll;
          
          // If remote reset is newer than local reset OR newer than ANY local activity
          if (remoteReset) {
              const rResetTime = new Date(remoteReset).getTime();
              const lResetTime = localReset ? new Date(localReset).getTime() : 0;
              
              // Find latest local activity timestamp
              const latestLocalActivity = Object.entries(savedProgress).reduce((latest, [key, item]) => {
                  if (key === 'metadata' || !item || !item.date) return latest;
                  const itemTime = new Date(item.date).getTime();
                  return Math.max(latest, itemTime);
              }, 0);

              if (rResetTime > lResetTime && rResetTime > latestLocalActivity) {
                  console.log("⚠️ Remote Reset detected. Clearing local progress.");
                  setProgress(remoteProgress);
                  localStorage.setItem('quizProgress', JSON.stringify(remoteProgress));
                  setSyncStatus('success');
                  setTimeout(() => setSyncStatus(null), 3000);
                  return;
              }
          }

          // 2. Normal Merge logic
          const { metadata, ...cleanRemote } = remoteProgress;
          const newProgress = { ...savedProgress };
          
          // Preserve local metadata or take remote if newer
          if (remoteReset) {
              const rResetTime = new Date(remoteReset).getTime();
              const lResetTime = localReset ? new Date(localReset).getTime() : 0;
              if (rResetTime > lResetTime) {
                  newProgress.metadata = { ...newProgress.metadata, lastResetAll: remoteReset };
              }
          }

          Object.keys(cleanRemote).forEach(themeId => {
              const r = cleanRemote[themeId];
              const l = newProgress[themeId];
              
              const rDate = r && r.date ? new Date(r.date).getTime() : 0;
              const lDate = l && l.date ? new Date(l.date).getTime() : 0;

              if (!l || rDate > lDate || (rDate === lDate && r.score > (l.score || 0))) {
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
    if (window.confirm('Êtes-vous sûr de vouloir réinitialiser toute votre progression sur TOUS vos appareils ?')) {
      const resetData = { 
          metadata: { 
              lastResetAll: new Date().toISOString() 
          } 
      };
      isLocalUpdate.current = true;
      setProgress(resetData);
      localStorage.setItem('quizProgress', JSON.stringify(resetData));
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
            {syncStatus === 'pending' && <span style={{opacity: 0.7}}>☁️ En attente...</span>}
            {syncStatus === 'success' && <span style={{color: 'var(--success)'}}>☁️ Synchronisé !</span>}
            {syncStatus === 'error' && <span>❌ Erreur de synchronisation</span>}
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
