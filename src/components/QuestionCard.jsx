import React, { useEffect, useMemo, useRef, useState } from 'react';

const QuestionCard = ({ title = 'Titre', question, onAnswer, currentIndex, total }) => {
  const [selectedAnswer, setSelectedAnswer] = useState(null);
  const [hasAnswered, setHasAnswered] = useState(false);
  const [freeformAnswer, setFreeformAnswer] = useState('');
  const [result, setResult] = useState(null); // 'correct' | 'incorrect' | null
  const [timedOut, setTimedOut] = useState(false);
  const MAX_TIME_MS = 30000; // temps maximum pour répondre (ms)
  const [timeLeft, setTimeLeft] = useState(MAX_TIME_MS);
  const intervalRef = useRef(null);
  const timeoutRef = useRef(null);
  const answeredRef = useRef(false);

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
    if (selectedAnswer == null) return '';
    return answer === selectedAnswer ? 'selected' : 'dimmed';
  };

  return (
    <div className={`question-card${timedOut ? ' timed-out' : ''}`}>
      <div className="question-header">
        <div className="question-title">{title || 'Titre'}</div>
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
              <div>
                <strong>ID:</strong> {question.id}
              </div>
              <div className="question-text-inner">{question.question}</div>
            </div>
          </div>

          <div className="answers">
            {question.type === 'multiple_choice' && question.propositions ? (
              question.propositions.map((prop) => (
                <button
                  key={prop.letter}
                  className={`answer-btn ${getButtonClass(prop.letter)}`}
                  onClick={() => handleAnswer(prop.letter)}
                  disabled={hasAnswered}
                >
                  <span className="answer-letter">{prop.letter}.</span>
                  <span className="answer-text">{prop.text}</span>
                </button>
              ))
            ) : question.type === 'yes_no' ? (
              <>
                <button
                  className={`answer-btn ${getButtonClass('OUI')}`}
                  onClick={() => handleAnswer('OUI')}
                  disabled={hasAnswered}
                >
                  <span className="answer-letter">A.</span>
                  <span className="answer-text">Oui</span>
                </button>
                <button
                  className={`answer-btn ${getButtonClass('NON')}`}
                  onClick={() => handleAnswer('NON')}
                  disabled={hasAnswered}
                >
                  <span className="answer-letter">B.</span>
                  <span className="answer-text">Non</span>
                </button>
              </>
            ) : (
              <div className="number-wrap">
                <div className={`number-field ${hasAnswered ? 'selected' : ''}`}>
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

      {/* Explications désactivées */}
    </div>
  );
};

export default QuestionCard;
