import { useState, useEffect, useRef } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import QuizDashboardPage from "./pages/QuizDashboardPage";
import LessonsPage from "./pages/LessonsPage";
import QuizPage from "./pages/QuizPage";
import ResultsPage from "./pages/ResultsPage";
import ProfilePage from "./pages/ProfilePage";
import HomePage from "./pages/HomePage";
import LessonPage from "./pages/LessonPage";
import ExamenBPage from "./pages/ExamenBPage";
import TopControls from "./components/TopControls";
import BottomNav from "./components/BottomNav";
import { loadThemeQuestions, loadThemesIndex } from "./utils/contentLoader";

import { auth, db } from './utils/firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';

function App() {
  useEffect(() => {
    console.log(
      "🚀 Permis Online Free - Version 1.5 (Score Fix + Interaction Lock)",
    );
  }, []);

  const [sections, setSections] = useState([]);
  const [progress, setProgress] = useState({});
  const [colorTheme, setColorTheme] = useState("light");
  const [instantFeedback, setInstantFeedback] = useState(false);
  const [autoPlayAudio, setAutoPlayAudio] = useState(false);
  const [showCompleted, setShowCompleted] = useState(true);
  const [syncStatus, setSyncStatus] = useState(null); // 'syncing', 'success', 'error', 'pending'
  const [user, setUser] = useState(null);

  const isLocalUpdate = useRef(false);
  const debounceTimer = useRef(null);

  // Initialize theme from localStorage or system preference
  useEffect(() => {
    const savedTheme = localStorage.getItem("theme");
    if (savedTheme) {
      setColorTheme(savedTheme);
      document.documentElement.setAttribute("data-theme", savedTheme);
      return;
    }

    const systemTheme = window.matchMedia("(prefers-color-scheme: dark)")
      .matches
      ? "dark"
      : "light";
    setColorTheme(systemTheme);
    document.documentElement.setAttribute("data-theme", systemTheme);
  }, []);

  // Dynamic Page Title
  useEffect(() => {
    const path = window.location.pathname;
    let title = "Permis Online Free";

    if (path.includes("/quiz")) title = "Quiz - Permis Online Free";
    else if (path.includes("/resultats"))
      title = "Résultats - Permis Online Free";
    else if (path.includes("/profil"))
      title = "Mon Profil - Permis Online Free";
    else if (path.includes("/cours") || path.includes("/lecon"))
      title = "Leçon - Permis Online Free";

    document.title = title;
  }, []);

  const toggleTheme = () => {
    const newTheme = colorTheme === "light" ? "dark" : "light";
    setColorTheme(newTheme);
    document.documentElement.setAttribute("data-theme", newTheme);
    localStorage.setItem("theme", newTheme);
  };

  const toggleInstantFeedback = () => {
    const newState = !instantFeedback;
    setInstantFeedback(newState);
    localStorage.setItem("instantFeedback", JSON.stringify(newState));
  };

  const toggleAutoPlayAudio = () => {
    const newState = !autoPlayAudio;
    setAutoPlayAudio(newState);
    localStorage.setItem("autoPlayAudio", JSON.stringify(newState));
  };

  const toggleShowCompleted = () => {
    const newState = !showCompleted;
    setShowCompleted(newState);
    localStorage.setItem("showCompleted", JSON.stringify(newState));
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
    const savedProgress = localStorage.getItem("quizProgress");
    if (savedProgress) {
      setProgress(JSON.parse(savedProgress));
    }

    // Load settings
    const savedFeedback = localStorage.getItem("instantFeedback");
    if (savedFeedback) {
      setInstantFeedback(JSON.parse(savedFeedback));
    }

    const savedAudio = localStorage.getItem("autoPlayAudio");
    if (savedAudio) {
      setAutoPlayAudio(JSON.parse(savedAudio));
    }

    const savedShowCompleted = localStorage.getItem("showCompleted");
    if (savedShowCompleted !== null) {
      setShowCompleted(JSON.parse(savedShowCompleted));
    }

    // AUTH & AUTO-SYNC PULL
    const unsubscribe = auth.onAuthStateChanged(async (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        console.log(
          "👤 User logged in:",
          currentUser.displayName || currentUser.email,
        );
        // Trigger auto-pull from Firestore
        pullFromCloud();
      }
    });

    return () => unsubscribe();
  }, []);

  // DEBOUNCED CLOUD SYNC & LOCAL STORAGE SYNC
  useEffect(() => {
    // Always save to local storage
    localStorage.setItem("quizProgress", JSON.stringify(progress));

    if (isLocalUpdate.current) {
      isLocalUpdate.current = false;

      // Use an observer to wait for current user if needed
      const unsubscribe = auth.onAuthStateChanged((user) => {
        if (user) {
          if (debounceTimer.current) clearTimeout(debounceTimer.current);
          setSyncStatus("pending");

          debounceTimer.current = setTimeout(() => {
            syncToCloud(progress);
          }, 2500);
        }
        // Only run once per update
        unsubscribe();
      });
    }
  }, [progress]);

  const saveProgress = (themeId, score, total, answers) => {
    isLocalUpdate.current = true;
    setProgress((prev) => {
      const { metadata, ...rest } = prev;
      return {
        ...rest,
        metadata: metadata || {},
        [themeId]: {
          score,
          total,
          date: new Date().toISOString(),
          answers, // Save answers for review
        },
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
    setProgress((prev) => {
      if (!prev[themeId]) return prev;

      const currentThemeProgress = prev[themeId];
      const oldAnswers = currentThemeProgress.answers || [];

      // Merge new answers into old answers
      const updatedAnswers = oldAnswers.map((oldAns) => {
        const newAns = newAnswers.find(
          (na) => na.questionId == oldAns.questionId,
        );
        return newAns ? newAns : oldAns;
      });

      // Add any outliers
      newAnswers.forEach((newAns) => {
        if (!updatedAnswers.find((ua) => ua.questionId == newAns.questionId)) {
          updatedAnswers.push(newAns);
        }
      });

      const newScore = updatedAnswers.filter((a) => a.isCorrect).length;

      const { metadata, ...rest } = prev;
      return {
        ...rest,
        metadata: metadata || {},
        [themeId]: {
          ...currentThemeProgress,
          answers: updatedAnswers,
          score: newScore,
          date: new Date().toISOString(),
        },
      };
    });
  };

  const syncToCloud = async (progressData) => {
    try {
      const user = auth.currentUser;
      if (!user) return;

      setSyncStatus("syncing");
      console.log(`☁️ Firestore Sync: Saving to users/${user.uid}...`);

      // Inject API Keys into the payload
      const groqKey = localStorage.getItem("groq_api_key");
      const elevenKey = localStorage.getItem("elevenlabs_api_key");
      const preferredVoice = localStorage.getItem("preferred_voice_uri");

      const payload = {
        ...progressData,
        apiKeys: {
          groq: groqKey,
          elevenLabs: elevenKey,
          preferredVoice: preferredVoice,
        },
      };

      await setDoc(doc(db, "users", user.uid), payload);

      console.log("☁️ Firestore Sync: Success!");
      setSyncStatus("success");
      setTimeout(() => setSyncStatus(null), 3000);
    } catch (e) {
      console.error("❌ Firestore Sync Error:", e.code, e.message);

      if (e.code === "permission-denied") {
        console.warn(
          "⚠️ ACTION REQUIRED: Check Firestore Rules in Firebase Console!",
        );
      } else if (e.code === "not-found") {
        console.warn(
          "⚠️ ACTION REQUIRED: Create 'Cloud Firestore' database in Firebase Console!",
        );
      } else if (
        e.message &&
        e.message.includes("Expected first argument to doc")
      ) {
        console.error(
          "❌ CRITICAL: Firestore DB instance is invalid. Check firebaseConfig.",
        );
      }

      setSyncStatus("error");
      setTimeout(() => setSyncStatus(null), 5000);
    }
  };

  const pullFromCloud = async () => {
    try {
      const user = auth.currentUser;
      if (!user) return;

      setSyncStatus("syncing");
      console.log(`☁️ Firestore Pull: Fetching users/${user.uid}...`);

      const docSnap = await getDoc(doc(db, "users", user.uid));

      if (!docSnap.exists()) {
        console.log("☁️ Firestore Pull: No remote data found.");
        setSyncStatus(null);
        return;
      }

      const remoteData = docSnap.data();

      // --- EXTRACT AND SAVE KEYS ---
      if (remoteData.apiKeys) {
        console.log("🔑 Syncing API Keys from Cloud...");
        if (remoteData.apiKeys.groq)
          localStorage.setItem("groq_api_key", remoteData.apiKeys.groq);
        if (remoteData.apiKeys.elevenLabs)
          localStorage.setItem(
            "elevenlabs_api_key",
            remoteData.apiKeys.elevenLabs,
          );
        if (remoteData.apiKeys.preferredVoice)
          localStorage.setItem(
            "preferred_voice_uri",
            remoteData.apiKeys.preferredVoice,
          );
      }

      // Separate progress from keys for state
      const { apiKeys, variables_if_any, ...remoteProgress } = remoteData;

      // --- NORMAL PROGRESS SYNC LOGIC ---

      const savedProgress = JSON.parse(
        localStorage.getItem("quizProgress") || "{}",
      );

      // 1. Check for Cross-Device Reset
      const remoteReset = remoteProgress.metadata?.lastResetAll;
      const localReset = savedProgress.metadata?.lastResetAll;

      // If remote reset is newer than local reset OR newer than ANY local activity
      if (remoteReset) {
        const rResetTime = new Date(remoteReset).getTime();
        const lResetTime = localReset ? new Date(localReset).getTime() : 0;

        // Find latest local activity timestamp
        const latestLocalActivity = Object.entries(savedProgress).reduce(
          (latest, [key, item]) => {
            if (key === "metadata" || !item || !item.date) return latest;
            const itemTime = new Date(item.date).getTime();
            return Math.max(latest, itemTime);
          },
          0,
        );

        if (rResetTime > lResetTime && rResetTime > latestLocalActivity) {
          console.log("⚠️ Remote Reset detected. Clearing local progress.");
          setProgress(remoteProgress);
          localStorage.setItem("quizProgress", JSON.stringify(remoteProgress));
          setSyncStatus("success");
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
          newProgress.metadata = {
            ...newProgress.metadata,
            lastResetAll: remoteReset,
          };
        }
      }

      Object.keys(cleanRemote).forEach((themeId) => {
        const r = cleanRemote[themeId];
        const l = newProgress[themeId];

        if (!r) return; // Skip empty remote entries

        const rDate = r.date ? new Date(r.date).getTime() : 0;
        const lDate = l && l.date ? new Date(l.date).getTime() : 0;

        if (
          !l ||
          rDate > lDate ||
          (rDate === lDate && r.score > (l.score || 0))
        ) {
          newProgress[themeId] = r;
        }
      });

      setProgress(newProgress);
      localStorage.setItem("quizProgress", JSON.stringify(newProgress));
      setSyncStatus("success");
      console.log("☁️ Auto-pull complete!");
      setTimeout(() => setSyncStatus(null), 3000);
    } catch (e) {
      console.error("☁️ Auto-pull failed:", e);
      setSyncStatus("error");
      setTimeout(() => setSyncStatus(null), 5000);
    }
  };

  const handleResetProgress = () => {
    if (
      window.confirm(
        "Êtes-vous sûr de vouloir réinitialiser toute votre progression sur TOUS vos appareils ?",
      )
    ) {
      const resetData = {
        metadata: {
          lastResetAll: new Date().toISOString(),
        },
      };
      isLocalUpdate.current = true;
      setProgress(resetData);
      localStorage.setItem("quizProgress", JSON.stringify(resetData));
    }
  };

  // Debug methods
  window.debugApp = {
    sections,
    progress,
    resetProgress: () => {
      setProgress({});
      localStorage.removeItem("quizProgress");
      console.log("Progress reset");
    },
  };

  const isDarkMode = colorTheme === "dark";

  const markLessonRead = (themeId) => {
    isLocalUpdate.current = true;
    setProgress((prev) => {
      const current = prev[themeId] || {};
      return {
        ...prev,
        [themeId]: {
          ...current,
          read: true,
          date: new Date().toISOString(),
        },
      };
    });
  };

  return (
    <BrowserRouter basename="/permis-online-free/">
      {/* GLOBAL SYNC TOAST */}
      {syncStatus && (
        <div
          style={{
            position: "fixed",
            bottom: "20px",
            right: "20px",
            background:
              syncStatus === "error" ? "var(--danger)" : "var(--surface-1)",
            color: syncStatus === "error" ? "white" : "var(--foreground)",
            padding: "12px 20px",
            borderRadius: "8px",
            boxShadow: "0 4px 12px rgba(0,0,0,0.2)",
            zIndex: 10000,
            display: "flex",
            alignItems: "center",
            gap: "10px",
            border: "1px solid var(--border)",
            fontWeight: "500",
            animation: "slideUp 0.3s ease-out",
          }}
        >
          {syncStatus === "syncing" && <span>☁️ Synchronisation...</span>}
          {syncStatus === "pending" && (
            <span style={{ opacity: 0.7 }}>☁️ En attente...</span>
          )}
          {syncStatus === "success" && (
            <span style={{ color: "var(--success)" }}>☁️ Synchronisé !</span>
          )}
          {syncStatus === "error" && <span>❌ Erreur de synchronisation</span>}
        </div>
      )}

      <TopControls
        toggleTheme={toggleTheme}
        isDarkMode={isDarkMode}
        user={user}
      />

      {/* <BottomNav /> - Replaced by Mobile Burger Menu in TopControls */}

      <Routes>
        <Route path="/" element={<HomePage progress={progress} />} />
        <Route
          path="/lecons"
          element={
            <LessonsPage
              sections={sections}
              progress={progress}
              showCompleted={showCompleted}
              onToggleShowCompleted={toggleShowCompleted}
              onSelectLesson={(lessonFile) =>
                (window.location.hash = `#/lecon/${encodeURIComponent(lessonFile)}`)
              }
            />
          }
        />
        <Route
          path="/quiz"
          element={
            <QuizDashboardPage
              sections={sections}
              progress={progress}
              toggleTheme={toggleTheme}
              isDarkMode={isDarkMode}
              showCompleted={showCompleted}
              onToggleShowCompleted={toggleShowCompleted}
              onSelectTheme={(theme) =>
                (window.location.hash = `#/quiz/${theme.id}`)
              }
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
          path="/cours/:lessonId"
          element={
            <LessonPage
              themeMode={colorTheme}
              sections={sections}
              onMarkRead={markLessonRead}
              progress={progress}
            />
          }
        />
        <Route
          path="/examen-b"
          element={
            <ExamenBPage
              instantFeedback={instantFeedback}
              autoPlayAudio={autoPlayAudio}
              toggleTheme={toggleTheme}
              isDarkMode={isDarkMode}
            />
          }
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
            <ResultsPage toggleTheme={toggleTheme} isDarkMode={isDarkMode} />
          }
        />
        <Route
          path="/resultats"
          element={
            <ResultsPage toggleTheme={toggleTheme} isDarkMode={isDarkMode} />
          }
        />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
