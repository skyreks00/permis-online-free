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
    
    if (!effectiveFileName) {
        setSavingState("error");
        setSaveMessage("Erreur: Nom de fichier manquant");
        return;
    }

    // 1. Try Local Save
    try {
      await saveQuestionLocally(effectiveFileName, question.id, fixedQuestion);
    } catch (localErr) {
      // Local save failed
    }

    // 2. Try GitHub Save
    const token = localStorage.getItem("github_token");
    if (!token) {
      navigator.clipboard.writeText(JSON.stringify(fixedQuestion, null, 2));
      setSavingState("success");
      setSaveMessage("Copié (Pas de token GitHub)");
      return;
    }

    try {
      const user = await getUser(token);
      const owner = "skyreks00"; 
      const repo = "permis-online-free";
      const path = `public/data/${effectiveFileName}`;
      const commitMessage = `fix(content): correct question ${question.id} in ${effectiveFileName} (Manual+AI)`;

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

      setSavingState("success");
      if (result.type === "pr") {
        setSaveMessage(<a href={result.url} target="_blank" rel="noreferrer">PR créée !</a>);
      } else if (result.type === "commit") {
        setSaveMessage(<a href={result.url} target="_blank" rel="noreferrer">Commit effectué !</a>);
      } else {
        setSaveMessage("Sauvegardé !");
      }

      if (onQuestionUpdated) onQuestionUpdated(fixedQuestion);

      setTimeout(() => {
        setFixedQuestion(null);
        setSavingState(null);
      }, 2000);
    } catch (ghErr) {
      setSavingState("error");
      setSaveMessage("Erreur GitHub: " + (ghErr.message || "Problème de sauvegarde"));
    }
  };

  // --- MANUAL EDITING HELPERS ---
  const updateFixedField = (field, value) => {
    setFixedQuestion(prev => ({ ...prev, [field]: value }));
  };

  const updateFixedProposition = (idx, text) => {
    setFixedQuestion(prev => {
      const newProps = [...prev.propositions];
      newProps[idx] = { ...newProps[idx], text };
      return { ...prev, propositions: newProps };
    });
  };

  const toggleCorrectAnswer = (letter) => {
    if (!isCorrectionMode) return;
    updateFixedField("correctAnswer", letter);
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

      {isCorrectionMode &&
        (savingState === null || savingState === "error") && (
          <div className="p-4 mb-6 rounded-2xl border border-white/10 bg-white/[0.02] backdrop-blur-xl flex flex-col gap-4 animate-in fade-in zoom-in-95 duration-500 shadow-2xl">
            <div className="flex justify-between items-center text-xs">
              <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-warning/10 border border-warning/20">
                <div className="w-1.5 h-1.5 rounded-full bg-warning animate-pulse" />
                <span className="font-bold text-warning uppercase tracking-widest text-[10px]">
                  Édition Master
                </span>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setFixedQuestion(null)}
                  className="px-4 py-2 rounded-xl bg-white/[0.03] hover:bg-white/[0.08] text-white/70 hover:text-white transition-all border border-white/5"
                  disabled={savingState === "saving"}
                >
                  Annuler
                </button>
                <button
                  onClick={handleConfirmFix}
                  className="px-5 py-2 rounded-xl bg-warning text-black font-bold hover:shadow-[0_0_20px_rgba(255,193,7,0.3)] transition-all active:scale-95"
                  disabled={savingState === "saving"}
                >
                  {savingState === "saving" ? "Sauvegarde..." : "Enregistrer"}
                </button>
              </div>
            </div>
            <textarea
              className="w-full bg-transparent p-4 text-sm text-white/90 rounded-xl border border-white/5 outline-none focus:border-warning/30 transition-all placeholder:text-white/20 resize-none font-light leading-relaxed scrollbar-hide"
              rows={2}
              placeholder="Pourquoi cette correction est-elle nécessaire ? (Optionnel)"
              value={fixedQuestion.explanation || ""}
              onChange={(e) => updateFixedField("explanation", e.target.value)}
            />
            {savingState === "error" && (
              <div className="text-danger text-[11px] font-medium px-2 flex items-center gap-1">
                <X size={12} /> {saveMessage}
              </div>
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

      {/* Navigation Buttons placed conditionally via CSS (Haut sur Mobile / Bas sur PC) */}
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
              {isCorrectionMode ? (
                <div className="relative">
                  <textarea
                    className="question-text-inner w-full bg-transparent p-0 border-none outline-none focus:ring-0 transition-all resize-none overflow-hidden text-warning font-bold leading-relaxed placeholder:text-warning/20"
                    value={fixedQuestion.question}
                    onChange={(e) => updateFixedField("question", e.target.value)}
                    onInput={(e) => {
                      e.target.style.height = 'auto';
                      e.target.style.height = e.target.scrollHeight + 'px';
                    }}
                    autoFocus
                  />
                  <div className="h-px w-full bg-gradient-to-r from-warning/50 to-transparent mt-1" />
                </div>
              ) : (
                <div className="question-text-inner">
                  {displayQuestion.question}
                </div>
              )}
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
                    className={`answer-btn !bg-transparent border-none shadow-none transition-all duration-300
                      ${isCorrectionMode ? "opacity-80 hover:opacity-100" : ""}
                      ${isCorrectionMode && prop.letter === fixedQuestion.correctAnswer ? "scale-[1.02] !opacity-100" : ""}`}
                    onClick={() => isCorrectionMode ? toggleCorrectAnswer(prop.letter) : handleAnswer(prop.letter)}
                    disabled={savingState === "saving"}
                  >
                    <div 
                      className={`answer-key shrink-0 transition-all !bg-transparent border border-white/10
                        ${isCorrectionMode ? "hover:border-warning/50 hover:text-warning" : ""}
                        ${isCorrectionMode && prop.letter === fixedQuestion.correctAnswer ? "border-warning text-warning bg-warning/10" : ""}`}
                      onClick={(e) => {
                        if(isCorrectionMode) {
                          e.stopPropagation();
                          toggleCorrectAnswer(prop.letter);
                        }
                      }}
                    >
                      {prop.letter}
                    </div>
                    {isCorrectionMode ? (
                      <div className="flex-1 border-b border-white/5 focus-within:border-warning/30 transition-all ml-1">
                        <input 
                          className="answer-text !bg-transparent border-none outline-none w-full text-white/90 font-medium py-1"
                          value={prop.text}
                          onChange={(e) => updateFixedProposition(idx, e.target.value)}
                          onClick={(e) => e.stopPropagation()}
                        />
                      </div>
                    ) : (
                      <div className="answer-text">{prop.text}</div>
                    )}
                    {(showCheck || (isCorrectionMode && prop.letter === fixedQuestion.correctAnswer)) && (
                      <CheckCircle size={18} className={`answer-check transition-all ${isCorrectionMode ? "text-warning" : "text-success"}`} />
                    )}
                  </button>
                );
              })
            ) : displayQuestion.type === "yes_no" ? (
              <>
                <button
                  className={`answer-btn ${getButtonClass("OUI")} ${isCorrectionMode && fixedQuestion.correctAnswer === "OUI" ? "border-warning border-2" : ""}`}
                  onClick={() => isCorrectionMode ? toggleCorrectAnswer("OUI") : handleAnswer("OUI")}
                  disabled={savingState === "saving"}
                >
                  <div className={`answer-key ${isCorrectionMode ? "cursor-pointer hover:bg-warning hover:text-black transition-colors" : ""}`}>A</div>
                  <div className="answer-text">Oui</div>
                  {(hasAnswered && instantFeedback && displayQuestion.correctAnswer === "OUI") || (isCorrectionMode && fixedQuestion.correctAnswer === "OUI") ? (
                      <CheckCircle size={20} className="answer-check text-warning" />
                  ) : null}
                </button>
                <button
                  className={`answer-btn ${getButtonClass("NON")} ${isCorrectionMode && fixedQuestion.correctAnswer === "NON" ? "border-warning border-2" : ""}`}
                  onClick={() => isCorrectionMode ? toggleCorrectAnswer("NON") : handleAnswer("NON")}
                  disabled={savingState === "saving"}
                >
                  <div className={`answer-key ${isCorrectionMode ? "cursor-pointer hover:bg-warning hover:text-black transition-colors" : ""}`}>B</div>
                  <div className="answer-text">Non</div>
                  {(hasAnswered && instantFeedback && displayQuestion.correctAnswer === "NON") || (isCorrectionMode && fixedQuestion.correctAnswer === "NON") ? (
                      <CheckCircle size={20} className="answer-check text-warning" />
                  ) : null}
                </button>
              </>
            ) : (
              <div className="number-wrap">
                <div
                  className={`number-field ${
                    isCorrectionMode 
                      ? "border-warning" 
                      : hasAnswered
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
                    placeholder={isCorrectionMode ? "Réponse correcte..." : "Votre réponse…"}
                    value={isCorrectionMode ? fixedQuestion.correctAnswer : freeformAnswer}
                    disabled={savingState === "saving"}
                    onChange={(e) => isCorrectionMode ? updateFixedField("correctAnswer", e.target.value) : setFreeformAnswer(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !isCorrectionMode) handleFreeformSubmit();
                    }}
                  />
                  {!isCorrectionMode && (
                    <button
                      className="number-submit"
                      type="button"
                      onClick={handleFreeformSubmit}
                      disabled={hasAnswered || !String(freeformAnswer ?? "").trim()}
                    >
                      OK
                    </button>
                  )}
                </div>
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
