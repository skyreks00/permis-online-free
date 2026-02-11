import React from 'react';
import { Trophy, ThumbsUp, Award, Target, PartyPopper, CheckCircle } from 'lucide-react';

const Results = ({ score, total, questions = [], answers = [], showReview = false, onRestart, onBackToThemes, isExamMode, themeId, onRetakeFullQuiz, onReviewRemaining }) => {
  const percentage = Math.round((score / total) * 100);

  const getResultMessage = () => {
    if (isExamMode) {
      const incorrect = total - score;
      if (incorrect >= 9) {
        return { icon: <Target size={48} className="text-danger" />, text: 'ÉCHEC - 9 fautes ou plus', tone: 'danger' };
      }
      return { icon: <Trophy size={48} className="text-success" />, text: 'RÉUSSI !', tone: 'success' };
    }

    if (percentage >= 90) return { icon: <Trophy size={48} className="text-success" />, text: 'Excellent !', tone: 'success' };
    if (percentage >= 75) return { icon: <ThumbsUp size={48} className="text-success" />, text: 'Très bien !', tone: 'success' };
    if (percentage >= 50) return { icon: <Award size={48} className="text-warning" />, text: 'Pas mal !', tone: 'warn' };
    return { icon: <Target size={48} className="text-danger" />, text: 'Continue à t\'entraîner !', tone: 'danger' };
  };

  const result = getResultMessage();

  // Build error list for review
  const errorItems = (questions || []).map((q, idx) => ({ q, a: answers?.[idx], idx }))
    .filter(({ a }) => a && a.isCorrect === false);

  const formatAnswer = (q, value) => {
    if (value == null || value === undefined || value === '') return '—';
    // yes/no mapping
    if (value === 'OUI') return 'Oui';
    if (value === 'NON') return 'Non';
    // propositions mapping
    if (Array.isArray(q?.propositions)) {
      const item = q.propositions.find(p => p.letter === value);
      if (item) return `${item.letter}. ${item.text}`;
    }
    return String(value);
  };

  const cleanExplanation = (text) => {
    if (!text) return '';
    return text
      .replace(/^\s*INFO\W*PERMIS\W*DE\W*CONDUIRE\W*/i, '')
      .replace(/^\s*Signification\W*/i, '')
      .replace(/^\s*Explication\W*/i, '')
      .replace(/^\s*LE(?:Ç|C)ON\s*\d+(?:\s*[–\-:]\s*[^.\n]*)?(?:[.\n]\s*)?/i, '')
      .trim();
  };

  return (
    <div className="results container" style={{ textAlign: 'center' }}>
      <div style={{ margin: '20px 0', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px' }}>
        {result.icon}
        <h1 style={{ margin: 0 }}>{result.text}</h1>
      </div>

      <p style={{ fontSize: '1.2rem', marginBottom: '20px' }}>
        Score: <strong>{score}</strong> / {total} ({percentage}%)
      </p>

      <p>
        Correctes: <strong>{score}</strong> | Incorrectes: <strong>{total - score}</strong>
      </p>

      <div className="results-actions" style={{ justifyContent: 'center' }}>
        <button type="button" className="btn-primary" onClick={onRestart}>
          Recommencer
        </button>
        <button type="button" onClick={onBackToThemes}>
          Choisir un autre thème
        </button>
      </div>

      {/* Iterative Revision Button */}
      {themeId && (themeId === 'erreurs' || themeId.startsWith('erreurs_')) && (total - score) > 0 && (
        <div style={{ marginTop: '20px' }} className="animate-fade-in">
          <div className="card bg-warning/10 border-warning/30 p-6">
            <h3 className="text-xl font-bold text-warning mb-2 flex items-center justify-center gap-2">
              <Target /> Encore des fautes...
            </h3>
            <p className="mb-4">Il reste {total - score} erreurs à corriger. Courage !</p>
            <button
              onClick={onReviewRemaining}
              className="btn-primary w-full md:w-auto"
            >
              Réviser les {total - score} erreurs restantes
            </button>
          </div>
        </div>
      )}

      {themeId && themeId.startsWith('erreurs_') && score === total && (
        <div style={{ marginTop: '20px' }} className="animate-fade-in">
          <div className="card bg-success/10 border-success/30 p-6">
            <h3 className="text-xl font-bold text-success mb-2 flex items-center justify-center gap-2">
              <CheckCircle /> Fautes corrigées !
            </h3>
            <p className="mb-4">Vous avez bien assimilé ces corrections. Voulez-vous refaire le quiz complet pour valider vos acquis ?</p>
            <button
              onClick={onRetakeFullQuiz}
              className="btn-primary w-full md:w-auto"
            >
              Refaire le Quiz Complet
            </button>
          </div>
        </div>
      )}

      {showReview && (
        <div style={{ marginTop: '30px', textAlign: 'left', display: 'flex', flexDirection: 'column', gap: '32px' }}>
          <h2 style={{ textAlign: 'center', marginBottom: '16px' }}>Erreurs et conseils</h2>
          {errorItems.length === 0 ? (
            <div className="card" style={{ padding: '32px', textAlign: 'center' }}>
              <p className="muted" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', fontSize: '1.2rem', margin: 0 }}>
                <PartyPopper size={24} /> Aucune erreur. Bravo !
              </p>
            </div>
          ) : (
            errorItems.map(({ q, a, idx }) => (
              <div className="question-card card" key={`${q.id}-${idx}`}>
                <div className="question-header">
                  <div className="question-progress" style={{ color: 'var(--danger)' }}>
                    Question {idx + 1}
                  </div>
                </div>

                <div className="question-main">
                  <div className="question-left">
                    {q.image ? (
                      <div className="question-image">
                        <img src={q.image} alt="Illustration" />
                      </div>
                    ) : (
                      <div className="question-image placeholder" />
                    )}
                  </div>

                  <div className="question-right">
                    <div className="question-text">
                      <div className="question-text-inner">{q.question}</div>
                    </div>

                    <div className="answers">
                      {q.type === 'multiple_choice' && q.propositions ? (
                        q.propositions.map((prop) => {
                          const isCorrect = prop.letter === q.correctAnswer;
                          const isSelected = a?.userAnswer === prop.letter;
                          let btnClass = '';
                          if (isCorrect) btnClass = 'correct';
                          else if (isSelected) btnClass = 'incorrect';
                          else btnClass = 'dimmed';

                          return (
                            <button
                              key={prop.letter}
                              className={`answer-btn ${btnClass}`}
                              disabled
                              style={{ opacity: 1, cursor: 'default' }}
                            >
                              <div className="answer-key">{prop.letter}</div>
                              <div className="answer-text">{prop.text}</div>
                              {isCorrect && <CheckCircle size={20} className="text-success" />}
                            </button>
                          );
                        })
                      ) : q.type === 'yes_no' ? (
                        <>
                          {['OUI', 'NON'].map((val, i) => {
                            const letter = i === 0 ? 'A' : 'B';
                            const label = i === 0 ? 'Oui' : 'Non';
                            const isCorrect = val === q.correctAnswer;
                            const isSelected = a?.userAnswer === val;
                            let btnClass = '';
                            if (isCorrect) btnClass = 'correct';
                            else if (isSelected) btnClass = 'incorrect';
                            else btnClass = 'dimmed';

                            return (
                              <button
                                key={val}
                                className={`answer-btn ${btnClass}`}
                                disabled
                                style={{ opacity: 1, cursor: 'default' }}
                              >
                                <div className="answer-key">{letter}</div>
                                <div className="answer-text">{label}</div>
                                {isCorrect && <CheckCircle size={20} className="text-success" />}
                              </button>
                            );
                          })}
                        </>
                      ) : (
                        <div className="p-4 border rounded bg-surface-2">
                          <p><strong>Votre réponse:</strong> {a?.userAnswer || '—'}</p>
                          <p><strong>Réponse attendue:</strong> {q.correctAnswer}</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {q.explanation && (
                  <div className="explanation animate-fade-in">
                    <div className="explanation-title" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <Award size={20} className="text-primary" />
                      Conseil
                    </div>
                    <div className="explanation-text" style={{ fontSize: '1.05rem', lineHeight: 1.6 }}>
                      {cleanExplanation(q.explanation)}
                    </div>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
};

export default Results;
