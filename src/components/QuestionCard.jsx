import React, { useEffect, useMemo, useRef, useState } from "react";
import { BookOpen, X, CheckCircle } from "lucide-react";

const QuestionCard = ({
  question,
  onAnswer,
  currentIndex,
  total,
  instantFeedback,
  autoPlayAudio,
  onNext,
  isLastQuestion,
  fileName,
  onQuestionUpdated,
}) => {
  const [selectedAnswer, setSelectedAnswer] = useState(null);
  const [hasAnswered, setHasAnswered] = useState(false);
  const [showExplanation, setShowExplanation] = useState(false);
  const [freeformAnswer, setFreeformAnswer] = useState("");
  const [result, setResult] = useState(null); // 'correct' | 'incorrect' | null
  const [timedOut, setTimedOut] = useState(false);
  const MAX_TIME_MS = 30000; // temps maximum pour répondre (ms)
  const [timeLeft, setTimeLeft] = useState(MAX_TIME_MS);
  const intervalRef = useRef(null);
  const timeoutRef = useRef(null);
  const answeredRef = useRef(false);

  // Fix Logic States
  const [isFixing, setIsFixing] = useState(false);
  const [fixedQuestion, setFixedQuestion] = useState(null);
  const [savingState, setSavingState] = useState(null); // 'saving', 'success', 'error'
  const [saveMessage, setSaveMessage] = useState("");

  // Audio effect
  const [voice, setVoice] = useState(null);

  // Determine what to display: The Fixed version (if any) or the Original
  const displayQuestion = fixedQuestion || question;
  const isCorrectionMode = !!fixedQuestion;

  useEffect(() => {
    // Reset Fix UI when question changes
    setIsFixing(false);
    setFixedQuestion(null);
    setSavingState(null);
    setSaveMessage("");
  }, [question?.id]);

  useEffect(() => {
    const loadVoices = () => {
      const voices = window.speechSynthesis.getVoices();
      // Try to find a good French voice
      // Priority: Google -> Microsoft -> any FR
      const frVoices = voices.filter((v) => v.lang.startsWith("fr"));
      const best =
        frVoices.find((v) => v.name.includes("Google")) ||
        frVoices.find((v) => v.name.includes("Microsoft")) ||
        frVoices.find((v) => v.name.includes("Natural")) || // Edge 'Natural' voices
        frVoices[0];
      setVoice(best);
    };

    loadVoices();
    window.speechSynthesis.onvoiceschanged = loadVoices;

    return () => {
      window.speechSynthesis.onvoiceschanged = null;
    };
  }, []);

  useEffect(() => {
    if (autoPlayAudio && displayQuestion) {
      // Cancel previous speech
      window.speechSynthesis.cancel();

      // Construct text: Question ... Propositions
      let textToRead = displayQuestion.question || "";
      if (
        displayQuestion.propositions &&
        Array.isArray(displayQuestion.propositions)
      ) {
        const propsText = displayQuestion.propositions
          .map((p) => `${p.letter}... ${p.text}`)
          .join(". ");
        textToRead += `. ${propsText}`;
      } else if (displayQuestion.type === "yes_no") {
        textToRead += ". A... Oui. B... Non.";
      }

      const utterance = new SpeechSynthesisUtterance(textToRead);
      if (voice) utterance.voice = voice;
      utterance.lang = "fr-FR";
      utterance.rate = 1.0;
      window.speechSynthesis.speak(utterance);
    } else {
      window.speechSynthesis.cancel();
    }

    // Cleanup on unmount or question change
    return () => {
      window.speechSynthesis.cancel();
    };
  }, [displayQuestion, autoPlayAudio, voice]); // Depend on displayQuestion

  useEffect(() => {
    // Reset interaction states when the DISPLAYED question changes (ID or content update)
    setSelectedAnswer(null);
    setHasAnswered(false);
    setFreeformAnswer("");
    setResult(null);
    setTimedOut(false);
    setTimeLeft(MAX_TIME_MS);

    // démarrer le compte à rebours (seulement si pas en mode correction BLOQUANT)
    clearInterval(intervalRef.current);
    clearTimeout(timeoutRef.current);

    // Bloquer seulement si on est en preview (savingState === null) ou erreur
    // Si 'saving' ou 'success', on laisse le timer courir (Optimistic UI)
    const isBlocking =
      isCorrectionMode && (savingState === null || savingState === "error");

    if (isBlocking) return;

    const start = Date.now();
    intervalRef.current = setInterval(() => {
      const elapsed = Date.now() - start;
      const remaining = Math.max(0, MAX_TIME_MS - elapsed);
      setTimeLeft(remaining);
    }, 100);

    timeoutRef.current = setTimeout(() => {
      if (!answeredRef.current) {
        setTimedOut(true);
        setSelectedAnswer(null);
        setHasAnswered(true);
        setResult("incorrect");
        onAnswer({
          isCorrect: false,
          userAnswer: null,
          correctAnswer: displayQuestion.correctAnswer,
          questionId: displayQuestion.id,
        });
      }
    }, MAX_TIME_MS);

    return () => {
      clearInterval(intervalRef.current);
      clearTimeout(timeoutRef.current);
    };
  }, [
    displayQuestion?.id,
    displayQuestion?.question,
    isCorrectionMode,
    savingState,
  ]); // Added dependencies

  useEffect(() => {
    answeredRef.current = hasAnswered;
  }, [hasAnswered]);

  const normalizedCorrectAnswer = useMemo(() => {
    const raw = displayQuestion?.correctAnswer ?? "";
    return String(raw).trim();
  }, [displayQuestion?.correctAnswer]);

  const isFreeformCorrect = (rawAnswer) => {
    const a = String(rawAnswer ?? "").trim();
    const b = String(normalizedCorrectAnswer ?? "").trim();

    // If both parse cleanly as numbers, compare numerically (handles "4" vs "4,0").
    const an = Number(a.replace(",", "."));
    const bn = Number(b.replace(",", "."));
    if (!Number.isNaN(an) && !Number.isNaN(bn) && a !== "" && b !== "") {
      return an === bn;
    }

    // Otherwise compare as normalized strings (case-insensitive).
    return a.toUpperCase() === b.toUpperCase();
  };

  const handleAnswer = (answer) => {
    if (hasAnswered) return;

    setSelectedAnswer(answer);
    setHasAnswered(true);
    const isCorrect = answer === displayQuestion.correctAnswer;
    setResult(isCorrect ? "correct" : "incorrect");
    clearInterval(intervalRef.current);
    clearTimeout(timeoutRef.current);
    onAnswer({
      isCorrect,
      userAnswer: answer,
      correctAnswer: displayQuestion.correctAnswer,
      questionId: displayQuestion.id,
    });
  };

  const handleFreeformSubmit = () => {
    if (hasAnswered) return;
    const value = String(freeformAnswer ?? "").trim();
    if (!value) return;

    const isCorrect = isFreeformCorrect(value);
    setSelectedAnswer(value);
    setHasAnswered(true);
    setResult(isCorrect ? "correct" : "incorrect");
    clearInterval(intervalRef.current);
    clearTimeout(timeoutRef.current);
    onAnswer({
      isCorrect,
      userAnswer: value,
      correctAnswer: displayQuestion.correctAnswer,
      questionId: displayQuestion.id,
    });
  };

  const getButtonClass = (answer) => {
    if (timedOut) return "dimmed";

    if (hasAnswered && instantFeedback) {
      // Mode correction directe
      if (answer === displayQuestion.correctAnswer) return "correct";
      if (
        answer === selectedAnswer &&
        selectedAnswer !== displayQuestion.correctAnswer
      )
        return "incorrect";
      return "dimmed";
    }

    if (selectedAnswer == null) return "";
    return answer === selectedAnswer ? "selected" : "dimmed";
  };

  // --- FIX LOGIC IMPORTS ---
  // Ideally these would be at top, but we are inside function for tool simplicity.
  // We will assume imports are added at top of file (I cannot inject imports easily with replace_file_content if I don't target top).
  // Wait, I am replacing the whole component logic, so I NEED imports.
  // Since I can't edit top of file in same tool call easily without context, I will ASSUME the user adds imports or I use dynamic imports.
  // Actually, I should use `multi_replace` to add imports at top if I want to be clean.
  // For now, I'll rely on global scope or assume `src/utils` are available.
  // NO, I must fix imports. I'll do a separate tool call for imports or use `replace_file_content` carefully.
  // I will add the imports to the TOP of the file in a separate step.

  const handleFixQuestion = async () => {
    const apiKey = localStorage.getItem("groq_api_key");
    if (!apiKey) {
      alert("Veuillez ajouter votre clé API Groq dans le Profil.");
      return;
    }

    setIsFixing(true);
    setSavingState(null);
    try {
      const { fixQuestionWithGroq } = await import("../utils/groq");
      // Always fix the ORIGINAL question, not the already fixed one (unless we want iterative fixes?)
      // Let's stick to fixing the original 'question' prop.
      const fixed = await fixQuestionWithGroq(question, apiKey);
      setFixedQuestion(fixed);
    } catch (e) {
      console.error(e);
      alert("Erreur lors de la correction : " + e.message);
    } finally {
      setIsFixing(false);
    }
  };

  const handleConfirmFix = async () => {
    if (!fixedQuestion) return;
    const { saveQuestionLocally } = await import("../utils/api");
    const { saveQuestionToGitHub, getUser } =
      await import("../utils/githubClient");

    setSavingState("saving"); // UI Unblocks HERE

    const effectiveFileName = question.sourceFile || fileName;
    console.log("[QuestionCard] Debug Fix:", { 
        id: question.id, 
        sourceFile: question.sourceFile, 
        propFileName: fileName, 
        effective: effectiveFileName 
    });

    if (!effectiveFileName) {
        setSavingState("error");
        setSaveMessage("Erreur: Nom de fichier manquant");
        return;
    }

    // 1. Try Local Save (Silence error as backend might not be running)
    try {
      await saveQuestionLocally(effectiveFileName, question.id, fixedQuestion);
    } catch (localErr) {
      // Local save failed, backend likely offline
    }

    // 2. Try GitHub Save
    const token = localStorage.getItem("github_token");
    if (!token) {
      // Fallback: Copy to clipboard
      navigator.clipboard.writeText(JSON.stringify(fixedQuestion, null, 2));
      setSavingState("success");
      setSaveMessage("Copié (Pas de token GitHub)");
      return;
    }

    try {
      const user = await getUser(token);
      const owner = "skyreks00"; // Always target main repo for collaborative contributions
      const repo = "permis-online-free";
      const path = `public/data/${effectiveFileName}`;
      const commitMessage = `fix(content): correct question ${question.id} in ${effectiveFileName} (AI)`;

      console.log("[handleConfirmFix] Saving question to GitHub...");

      const result = await saveQuestionToGitHub(
        token,
        owner,
        repo,
        path,
        question.id,
        fixedQuestion,
        commitMessage,
        user,
      );

      if (result.type === "unchanged") {
        setSavingState("success");
        setSaveMessage("Aucun changement détecté");
        return;
      }

      setSavingState("success");

      if (result.type === "pr") {
        setSaveMessage(
          <a href={result.url} target="_blank" rel="noreferrer">
            PR créée !
          </a>,
        );
      } else if (result.type === "commit") {
        setSaveMessage(
          <a href={result.url} target="_blank" rel="noreferrer">
            Commit effectué !
          </a>,
        );
      } else {
        setSaveMessage("Sauvegardé !");
      }

      if (onQuestionUpdated) {
        onQuestionUpdated(fixedQuestion);
      }

      setTimeout(() => {
        setFixedQuestion(null);
        setSavingState(null);
      }, 2000);
    } catch (ghErr) {
      console.error("[handleConfirmFix] GitHub save error:", ghErr);
      setSavingState("error");
      setSaveMessage(
        "Erreur GitHub: " + (ghErr.message || "Problème de sauvegarde"),
      );
    }
  };

  return (
    <div
      className={`question-card ${timedOut ? "timed-out" : ""} ${isCorrectionMode ? "correction-mode" : ""}`}
      style={
        isCorrectionMode
          ? {
              border: "2px solid var(--warning)",
              boxShadow: "0 0 15px rgba(255, 193, 7, 0.3)",
            }
          : {}
      }
    >
      <div className="question-header">
        <div className="question-progress" aria-live="polite">
          Question {Math.min(currentIndex + 1, total)} / {total}
          {isCorrectionMode && (
            <span className="text-warning font-bold ml-2">
              ✨ CORRECTION SUGGÉRÉE
            </span>
          )}
        </div>

        {/* Fix Button / Actions */}
        {localStorage.getItem("groq_api_key") && !isCorrectionMode && (
          <button
            onClick={handleFixQuestion}
            disabled={isFixing}
            className="btn-ghost"
            style={{
              fontSize: "12px",
              padding: "4px 8px",
              display: "flex",
              alignItems: "center",
              gap: "4px",
            }}
            title="Suggérer une correction"
          >
            {isFixing ? "..." : "✨ Corriger"}
          </button>
        )}
      </div>

      {/* Validation Controls (Only in Correction Mode) - Hide on success OR SAVING */}
      {isCorrectionMode &&
        (savingState === null || savingState === "error") && (
          <div className="p-3 bg-surface-2 border-b border-warning mb-4 rounded flex flex-col gap-2">
            <div className="flex justify-between items-center">
              <span className="text-sm font-bold text-warning">
                Valider cette correction ?
              </span>
              <div className="flex gap-2">
                <button
                  onClick={() => setFixedQuestion(null)}
                  className="btn-ghost text-xs bg-surface-1"
                  disabled={savingState === "saving"}
                >
                  Annuler
                </button>
                <button
                  onClick={handleConfirmFix}
                  className="btn-primary text-xs bg-warning border-warning text-black"
                  disabled={savingState === "saving"}
                >
                  {savingState === "saving" ? "Envoi..." : "Valider"}
                </button>
              </div>
            </div>
            {savingState === "error" && (
              <div className="text-danger text-xs">{saveMessage}</div>
            )}
          </div>
        )}

      {/* Global Toast for Success */}
      {(savingState === "success" || savingState === "saving") && (
        <div className="toast-notification">
          <CheckCircle
            size={24}
            className={
              savingState === "success" ? "text-success" : "text-muted"
            }
          />
          <div>
            <div className="font-bold text-sm">
              {savingState === "success"
                ? "Correction envoyée !"
                : "Envoi en cours..."}
            </div>
            {savingState === "success" && (
              <div className="text-xs text-muted">{saveMessage}</div>
            )}
            {savingState === "saving" && (
              <div className="text-xs text-muted">
                Vous pouvez continuer à jouer
              </div>
            )}
          </div>
        </div>
      )}

      <div
        className="question-main"
        style={{
          opacity:
            isCorrectionMode &&
            (savingState === null || savingState === "error")
              ? 0.6
              : 1,
          filter:
            isCorrectionMode &&
            (savingState === null || savingState === "error")
              ? "grayscale(100%)"
              : "none",
          transition: "all 0.3s ease",
        }}
      >
        <div className="question-left">
          {displayQuestion.image ? (
            <div className="question-image">
              <img src={displayQuestion.image} alt="Illustration" />
            </div>
          ) : (
            <div className="question-image placeholder" />
          )}
        </div>

        <div className="question-right">
          <div className="question-text">
            <div>
              {/* Use displayQuestion here */}
              <div className="question-text-inner">
                {displayQuestion.question}
              </div>
            </div>
          </div>

          <div className="answers">
            {(displayQuestion.type === "multiple_choice" ||
              displayQuestion.type === "single_choice") &&
            displayQuestion.propositions ? (
              displayQuestion.propositions.map((prop, idx) => {
                // const isSelected = selectedAnswer === prop.letter; // Unused
                // Only show check if instantFeedback is ON and it's the correct answer
                // OR if it's the selected answer AND instantFeedback is ON (logic overlap, effectively: show on correct if feedback on)
                // Actually, standard behavior:
                // If feedback ON: Show valid check on Correct Answer.
                // If feedback OFF: Do NOT show check.
                const showCheck =
                  hasAnswered &&
                  instantFeedback &&
                  prop.letter === displayQuestion.correctAnswer;
                const isInteractionDisabled =
                  isFixing ||
                  hasAnswered ||
                  (isCorrectionMode &&
                    (savingState === null || savingState === "error"));

                return (
                  <button
                    key={`${prop.letter}-${idx}`}
                    className={`answer-btn ${getButtonClass(prop.letter)}`}
                    onClick={() => handleAnswer(prop.letter)}
                    disabled={isInteractionDisabled}
                  >
                    <div className="answer-key">{prop.letter}</div>
                    <div className="answer-text">{prop.text}</div>
                    {showCheck && (
                      <CheckCircle size={20} className="answer-check" />
                    )}
                  </button>
                );
              })
            ) : displayQuestion.type === "yes_no" ? (
              <>
                {/* Logic for yes_no using displayQuestion... */}
                {/* Simplified for brevity in this replace call, similar logic to original but using displayQuestion */}
                <button
                  className={`answer-btn ${getButtonClass("OUI")}`}
                  onClick={() => handleAnswer("OUI")}
                  disabled={
                    isFixing ||
                    hasAnswered ||
                    (isCorrectionMode &&
                      (savingState === null || savingState === "error"))
                  }
                >
                  <div className="answer-key">A</div>
                  <div className="answer-text">Oui</div>
                  {hasAnswered &&
                    instantFeedback &&
                    displayQuestion.correctAnswer === "OUI" && (
                      <CheckCircle size={20} className="answer-check" />
                    )}
                </button>
                <button
                  className={`answer-btn ${getButtonClass("NON")}`}
                  onClick={() => handleAnswer("NON")}
                  disabled={
                    isFixing ||
                    hasAnswered ||
                    (isCorrectionMode &&
                      (savingState === null || savingState === "error"))
                  }
                >
                  <div className="answer-key">B</div>
                  <div className="answer-text">Non</div>
                  {hasAnswered &&
                    instantFeedback &&
                    displayQuestion.correctAnswer === "NON" && (
                      <CheckCircle size={20} className="answer-check" />
                    )}
                </button>
              </>
            ) : (
              <div className="number-wrap">
                {/* Freeform/Numeric using displayQuestion... */}
                <div
                  className={`number-field ${
                    hasAnswered
                      ? instantFeedback
                        ? result === "correct"
                          ? "correct"
                          : "incorrect"
                        : "selected"
                      : ""
                  }`}
                >
                  <input
                    className="number-input"
                    type="text"
                    inputMode="numeric"
                    placeholder="Votre réponse…"
                    value={freeformAnswer}
                    disabled={
                      isFixing ||
                      hasAnswered ||
                      (isCorrectionMode &&
                        (savingState === null || savingState === "error"))
                    }
                    onChange={(e) => setFreeformAnswer(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") handleFreeformSubmit();
                    }}
                  />
                  <button
                    className="number-submit"
                    type="button"
                    onClick={handleFreeformSubmit}
                    disabled={
                      isFixing ||
                      hasAnswered ||
                      !String(freeformAnswer ?? "").trim() ||
                      (isCorrectionMode &&
                        (savingState === null || savingState === "error"))
                    }
                  >
                    OK
                  </button>
                </div>
                {/* Aucun retour immédiat sur la justesse de la réponse */}
              </div>
            )}
          </div>

          <div className="countdown" aria-hidden="true">
            {/* Countdown using timeLeft (reset in useEffect) */}
            <div className="countdown-track">
              <div
                className="countdown-fill"
                style={{
                  width: `${Math.max(0, Math.min(100, (timeLeft / MAX_TIME_MS) * 100))}%`,
                }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Buttons inside the right column */}
      {hasAnswered && (
        <div className="quiz-nav-buttons">
          {instantFeedback && question?.explanation && (
            <button
              onClick={() => setShowExplanation(true)}
              className="btn-explanation"
            >
              <BookOpen size={20} />
              Explication
            </button>
          )}
          <button type="button" onClick={onNext} className="btn-next">
            {isLastQuestion ? "Terminer" : "Suivant"}
          </button>
        </div>
      )}

      {/* Popup Modal */}
      {showExplanation && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            width: "100%",
            height: "100%",
            background: "rgba(0, 0, 0, 0.75)",
            zIndex: 9999,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "20px",
            backdropFilter: "blur(4px)",
          }}
          onClick={() => setShowExplanation(false)}
        >
          <div
            style={{
              background: "var(--surface)",
              color: "var(--foreground)",
              padding: "24px",
              borderRadius: "16px",
              maxWidth: "600px",
              width: "100%",
              maxHeight: "90vh",
              overflowY: "auto",
              position: "relative",
              boxShadow: "var(--shadow-lg)",
              border: "1px solid var(--border)",
            }}
            onClick={(e) => e.stopPropagation()}
            className="animate-in fade-in zoom-in-95 duration-200"
          >
            <button
              onClick={() => setShowExplanation(false)}
              style={{
                position: "absolute",
                top: "16px",
                right: "16px",
                background: "transparent",
                border: "none",
                color: "var(--muted-foreground)",
                cursor: "pointer",
                padding: "4px",
              }}
            >
              <X size={24} />
            </button>
            <div style={{ lineHeight: "1.6", fontSize: "1.05rem" }}>
              {question.explanation
                .replace(/^\s*INFO\W*PERMIS\W*DE\W*CONDUIRE\W*/i, "") // Robust INFO removal
                .replace(/^\s*Signification\W*/i, "") // Remove "Signification" + any non-word chars (: / - \n)
                .replace(/^\s*Explication\W*/i, "") // Remove "Explication" + any non-word chars
                .replace(
                  /^\s*LE(?:Ç|C)ON\s*\d+(?:\s*[–\-:]\s*[^.\n]*)?(?:[.\n]\s*)?/i,
                  "",
                ) // Remove "LEÇON 1" (+ opt title)
                .trim()}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default QuestionCard;
