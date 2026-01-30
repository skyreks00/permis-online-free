import React, { useEffect, useMemo, useRef, useState } from 'react';
import { BookOpen, X, CheckCircle } from 'lucide-react';

const QuestionCard = ({ title = 'Titre', question, onAnswer, currentIndex, total, instantFeedback, autoPlayAudio, onNext, isLastQuestion }) => {
  const [selectedAnswer, setSelectedAnswer] = useState(null);
  const [hasAnswered, setHasAnswered] = useState(false);
  const [showExplanation, setShowExplanation] = useState(false);
  const [freeformAnswer, setFreeformAnswer] = useState('');
  const [result, setResult] = useState(null); // 'correct' | 'incorrect' | null
  const [timedOut, setTimedOut] = useState(false);
  const MAX_TIME_MS = 30000; // temps maximum pour répondre (ms)
  const [timeLeft, setTimeLeft] = useState(MAX_TIME_MS);
  const intervalRef = useRef(null);
  const timeoutRef = useRef(null);
  const answeredRef = useRef(false);

  // Audio effect
  const [voice, setVoice] = useState(null);

  useEffect(() => {
    const loadVoices = () => {
      const voices = window.speechSynthesis.getVoices();
      // Try to find a good French voice
      // Priority: Google -> Microsoft -> any FR
      const frVoices = voices.filter(v => v.lang.startsWith('fr'));
      const best = frVoices.find(v => v.name.includes('Google'))
        || frVoices.find(v => v.name.includes('Microsoft'))
        || frVoices.find(v => v.name.includes('Natural')) // Edge 'Natural' voices
        || frVoices[0];
      setVoice(best);
    };

    loadVoices();
    window.speechSynthesis.onvoiceschanged = loadVoices;

    return () => {
      window.speechSynthesis.onvoiceschanged = null;
    };
  }, []);

  useEffect(() => {
    if (autoPlayAudio && question) {
      // Cancel previous speech
      window.speechSynthesis.cancel();

      // Construct text: Question ... Propositions
      let textToRead = question.question || '';
      if (question.propositions && Array.isArray(question.propositions)) {
        const propsText = question.propositions.map(p => `${p.letter}... ${p.text}`).join('. ');
        textToRead += `. ${propsText}`;
      } else if (question.type === 'yes_no') {
        textToRead += ". A... Oui. B... Non.";
      }

      const utterance = new SpeechSynthesisUtterance(textToRead);
      if (voice) utterance.voice = voice;
      utterance.lang = 'fr-FR';
      utterance.rate = 1.0;
      window.speechSynthesis.speak(utterance);
    } else {
      window.speechSynthesis.cancel();
    }

    // Cleanup on unmount or question change
    return () => {
      window.speechSynthesis.cancel();
    };
  }, [question, autoPlayAudio, voice]);

  useEffect(() => {
    setSelectedAnswer(null);
    setHasAnswered(false);
    setFreeformAnswer('');
    setResult(null);
    setTimedOut(false);
    setTimeLeft(MAX_TIME_MS);

    // démarrer le compte à rebours
    clearInterval(intervalRef.current);
    clearTimeout(timeoutRef.current);
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
        setResult('incorrect');
        onAnswer({
          isCorrect: false,
          userAnswer: null,
          correctAnswer: question.correctAnswer,
          questionId: question.id,
        });
      }
    }, MAX_TIME_MS);

    return () => {
      clearInterval(intervalRef.current);
      clearTimeout(timeoutRef.current);
    };
  }, [question?.id, question?.question]);

  useEffect(() => {
    answeredRef.current = hasAnswered;
  }, [hasAnswered]);

  const normalizedCorrectAnswer = useMemo(() => {
    const raw = question?.correctAnswer ?? '';
    return String(raw).trim();
  }, [question?.correctAnswer]);

  const isFreeformCorrect = (rawAnswer) => {
    const a = String(rawAnswer ?? '').trim();
    const b = String(normalizedCorrectAnswer ?? '').trim();

    // If both parse cleanly as numbers, compare numerically (handles "4" vs "4,0").
    const an = Number(a.replace(',', '.'));
    const bn = Number(b.replace(',', '.'));
    if (!Number.isNaN(an) && !Number.isNaN(bn) && a !== '' && b !== '') {
      return an === bn;
    }

    // Otherwise compare as normalized strings (case-insensitive).
    return a.toUpperCase() === b.toUpperCase();
  };

  const handleAnswer = (answer) => {
    if (hasAnswered) return;

    setSelectedAnswer(answer);
    setHasAnswered(true);
    const isCorrect = answer === question.correctAnswer;
    setResult(isCorrect ? 'correct' : 'incorrect');
    clearInterval(intervalRef.current);
    clearTimeout(timeoutRef.current);
    onAnswer({
      isCorrect,
      userAnswer: answer,
      correctAnswer: question.correctAnswer,
      questionId: question.id,
    });
  };

  const handleFreeformSubmit = () => {
    if (hasAnswered) return;
    const value = String(freeformAnswer ?? '').trim();
    if (!value) return;

    const isCorrect = isFreeformCorrect(value);
    setSelectedAnswer(value);
    setHasAnswered(true);
    setResult(isCorrect ? 'correct' : 'incorrect');
    clearInterval(intervalRef.current);
    clearTimeout(timeoutRef.current);
    onAnswer({
      isCorrect,
      userAnswer: value,
      correctAnswer: question.correctAnswer,
      questionId: question.id,
    });
  };

  const getButtonClass = (answer) => {
    if (timedOut) return 'dimmed';

    if (hasAnswered && instantFeedback) {
      // Mode correction directe
      if (answer === question.correctAnswer) return 'correct';
      if (answer === selectedAnswer && selectedAnswer !== question.correctAnswer) return 'incorrect';
      return 'dimmed';
    }

    if (selectedAnswer == null) return '';
    return answer === selectedAnswer ? 'selected' : 'dimmed';
  };

  return (
    <div className={`question-card${timedOut ? ' timed-out' : ''}`}>
      <div className="question-header">
        <div className="question-progress" aria-live="polite">
          Question {Math.min(currentIndex + 1, total)} / {total}
        </div>
      </div>

      <div className="question-main">
        <div className="question-left">
          {question.image ? (
            <div className="question-image">
              <img src={question.image} alt="Illustration" />
            </div>
          ) : (
            <div className="question-image placeholder" />
          )}
        </div>

        <div className="question-right">
          <div className="question-text">
            <div>
              <div className="question-text-inner">{question.question}</div>
            </div>
          </div>

          <div className="answers">
            {question.type === 'multiple_choice' && question.propositions ? (
              question.propositions.map((prop) => {
                const isSelected = selectedAnswer === prop.letter;
                // Only show check if instantFeedback is ON and it's the correct answer
                // OR if it's the selected answer AND instantFeedback is ON (logic overlap, effectively: show on correct if feedback on)
                // Actually, standard behavior:
                // If feedback ON: Show valid check on Correct Answer.
                // If feedback OFF: Do NOT show check.
                const showCheck = hasAnswered && instantFeedback && prop.letter === question.correctAnswer;

                return (
                  <button
                    key={prop.letter}
                    className={`answer-btn ${getButtonClass(prop.letter)}`}
                    onClick={() => handleAnswer(prop.letter)}
                    disabled={hasAnswered}
                  >
                    <div className="answer-key">{prop.letter}</div>
                    <div className="answer-text">{prop.text}</div>
                    {showCheck && <CheckCircle size={20} className="answer-check" />}
                  </button>
                )
              })
            ) : question.type === 'yes_no' ? (
              <>
                <button
                  className={`answer-btn ${getButtonClass('OUI')}`}
                  onClick={() => handleAnswer('OUI')}
                  disabled={hasAnswered}
                >
                  <div className="answer-key">A</div>
                  <div className="answer-text">Oui</div>
                  {hasAnswered && instantFeedback && question.correctAnswer === 'OUI' && <CheckCircle size={20} className="answer-check" />}
                </button>
                <button
                  className={`answer-btn ${getButtonClass('NON')}`}
                  onClick={() => handleAnswer('NON')}
                  disabled={hasAnswered}
                >
                  <div className="answer-key">B</div>
                  <div className="answer-text">Non</div>
                  {hasAnswered && instantFeedback && question.correctAnswer === 'NON' && <CheckCircle size={20} className="answer-check" />}
                </button>
              </>
            ) : (
              <div className="number-wrap">
                <div className={`number-field ${hasAnswered
                  ? (instantFeedback
                    ? (result === 'correct' ? 'correct' : 'incorrect')
                    : 'selected')
                  : ''
                  }`}>
                  <input
                    className="number-input"
                    type="text"
                    inputMode="numeric"
                    placeholder="Votre réponse…"
                    value={freeformAnswer}
                    disabled={hasAnswered}
                    onChange={(e) => setFreeformAnswer(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleFreeformSubmit();
                    }}
                  />
                  <button
                    className="number-submit"
                    type="button"
                    onClick={handleFreeformSubmit}
                    disabled={hasAnswered || !String(freeformAnswer ?? '').trim()}
                  >
                    OK
                  </button>
                </div>
                {/* Aucun retour immédiat sur la justesse de la réponse */}
              </div>
            )}
          </div>

          <div className="countdown" aria-hidden="true">
            <div className="countdown-track">
              <div
                className="countdown-fill"
                style={{ width: `${Math.max(0, Math.min(100, (timeLeft / MAX_TIME_MS) * 100))}%` }}
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
            {isLastQuestion ? 'Terminer' : 'Suivant'}
          </button>
        </div>
      )}

      {/* Popup Modal */}
      {showExplanation && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            background: 'rgba(0, 0, 0, 0.75)',
            zIndex: 9999,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '20px',
            backdropFilter: 'blur(4px)'
          }}
          onClick={() => setShowExplanation(false)}
        >
          <div
            style={{
              background: 'var(--surface)',
              color: 'var(--foreground)',
              padding: '24px',
              borderRadius: '16px',
              maxWidth: '600px',
              width: '100%',
              maxHeight: '90vh',
              overflowY: 'auto',
              position: 'relative',
              boxShadow: 'var(--shadow-lg)',
              border: '1px solid var(--border)'
            }}
            onClick={(e) => e.stopPropagation()}
            className="animate-in fade-in zoom-in-95 duration-200"
          >
            <button
              onClick={() => setShowExplanation(false)}
              style={{
                position: 'absolute',
                top: '16px',
                right: '16px',
                background: 'transparent',
                border: 'none',
                color: 'var(--muted-foreground)',
                cursor: 'pointer',
                padding: '4px'
              }}
            >
              <X size={24} />
            </button>
            <div style={{ lineHeight: '1.6', fontSize: '1.05rem' }}>
              {question.explanation
                .replace(/^\s*INFO\W*PERMIS\W*DE\W*CONDUIRE\W*/i, '') // Robust INFO removal
                .replace(/^\s*Signification\W*/i, '') // Remove "Signification" + any non-word chars (: / - \n)
                .replace(/^\s*Explication\W*/i, '') // Remove "Explication" + any non-word chars
                .replace(/^\s*LE(?:Ç|C)ON\s*\d+(?:\s*[–\-:]\s*[^.\n]*)?(?:[.\n]\s*)?/i, '') // Remove "LEÇON 1" (+ opt title)
                .trim()}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default QuestionCard;
