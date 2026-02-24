import React from 'react';
import { Trophy, ThumbsUp, Award, Target, PartyPopper, CheckCircle, ArrowLeft, BrainCircuit } from 'lucide-react';
import ReactMarkdown from 'react-markdown';

const Results = ({ score, total, questions = [], answers = [], showReview = false, onRestart, onBackToThemes, isExamMode, isReviewOnly = false, customErrorItems = null, onBackToProfile, onAiAnalysis, isAnalyzing, aiReport }) => {
  const percentage = total > 0 ? Math.round((score / total) * 100) : 0;

  const getResultMessage = () => {
    if (isReviewOnly) return { icon: <Target size={48} className="text-primary" />, text: 'Mode Révision', tone: 'info' };

    if (isExamMode) {
      // If total questions is too small (e.g. testing), use percentage
      if (total < 10) {
           if (percentage >= 80) return { icon: <Trophy size={48} className="text-success" />, text: 'RÉUSSI !', tone: 'success' };
           return { icon: <Target size={48} className="text-danger" />, text: 'ÉCHEC', tone: 'danger' };
      }

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
  // If customErrorItems is provided (from Profile review), use it.
  // Otherwise, use fallback logic (mapping by index - legacy).
  const errorItems = customErrorItems || (questions || []).map((q, idx) => ({ q, a: answers?.[idx], idx }))
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
    <div className="results container" style={{ textAlign: 'center', paddingBottom: '40px' }}>
      <style>{`
        .results-actions {
          display: flex;
          flex-direction: column;
          gap: 12px;
          margin: 0 auto;
          width: 100%;
          max-width: 400px;
        }
        
        button {
          width: 100%;
          justify-content: center;
        }

        .question-card.card {
            padding: 20px;
            margin-bottom: 24px;
            background: var(--surface);
            border: 1px solid var(--border);
            border-radius: 16px;
        }
        
        .question-main {
            display: flex;
            flex-direction: column;
            gap: 20px;
        }

        @media (min-width: 768px) {
           .question-main {
               flex-direction: row;
               align-items: flex-start;
           }
           .question-left {
               flex: 1;
               max-width: 50%;
           }
           .question-right {
               flex: 1;
           }
        }

        .question-image img {
            width: 100%;
            height: auto;
            border-radius: 12px;
            max-height: 300px;
            object-fit: contain;
            background: #000;
        }

        .answer-btn {
            width: 100%;
            text-align: left;
            margin-bottom: 8px;
            padding: 12px 16px;
            border-radius: 10px;
            border: 1px solid var(--border);
            background: var(--surface-2);
            color: var(--text);
            display: flex;
            align-items: center;
            gap: 12px;
            font-size: 0.95rem;
        }
        
        .answer-btn.correct {
            border-color: var(--success);
            background: rgba(34, 197, 94, 0.1);
        }
        
        .answer-btn.incorrect {
            border-color: var(--danger);
            background: rgba(239, 68, 68, 0.1);
        }

        .answer-btn.dimmed {
            opacity: 0.6;
        }
        
        .answer-key {
            font-weight: bold;
            display: flex;
            align-items: center;
            justify-content: center;
            width: 28px;
            height: 28px;
            background: var(--surface-3);
            border-radius: 6px;
            font-size: 0.85rem;
        }

        
        /* Fix button widths in actions for mobile */
        .results-actions button {
            width: 100%;
        }

        /* Desktop: Buttons side by side again */
        @media (min-width: 768px) {
            .results-actions {
                flex-direction: row;
                flex-wrap: wrap;
                justify-content: center;
                max-width: none;
            }
            
            .results-actions button {
                width: auto;
                min-width: 160px;
            }
        }
      `}</style>
        
      {!isReviewOnly ? (
        <>
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

            <div className="results-actions">
                <button type="button" className="btn-primary" onClick={onRestart}>
                Recommencer
                </button>
                {questions.length > 0 && total - score > 0 && (
                    <button 
                        type="button" 
                        className={`btn-ai ${isAnalyzing ? 'is-loading' : ''}`}
                        onClick={onAiAnalysis}
                        disabled={isAnalyzing}
                        style={{
                            background: 'linear-gradient(135deg, #a855f7, #3b82f6)',
                            color: 'white',
                            border: 'none',
                            padding: '10px 14px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '8px',
                            borderRadius: '8px',
                            cursor: 'pointer'
                        }}
                    >
                        <BrainCircuit size={18} />
                        {isAnalyzing ? 'Analyse en cours...' : 'Analyser mes erreurs'}
                    </button>
                )}
                <button type="button" onClick={onBackToThemes}>
                Choisir un autre thème
                </button>
                <button type="button" className="btn-secondary" onClick={onBackToProfile}>
                Retour au profil
                </button>
            </div>

            {aiReport && (
                <div className="eb-ai-report anim-slide-down" style={{ 
                    marginTop: '30px',
                    textAlign: 'left',
                    background: 'rgba(255, 255, 255, 0.03)', 
                    padding: '24px', 
                    borderRadius: '16px',
                    border: '1px solid rgba(168, 85, 247, 0.2)',
                    lineHeight: '1.6',
                    fontSize: '15px',
                    color: 'var(--text)',
                    position: 'relative',
                    maxWidth: '800px',
                    margin: '30px auto'
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '15px', color: '#a855f7' }}>
                        <BrainCircuit size={20} />
                        <span style={{ fontWeight: 700 }}>Analyse Pédagogique de vos erreurs</span>
                    </div>
                    <ReactMarkdown>{aiReport}</ReactMarkdown>
                </div>
            )}
        </>
      ) : (
        <div style={{ margin: '20px 0', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <Target size={32} className="text-primary" />
                <h1 style={{ margin: 0 }}>Révision des erreurs</h1>
            </div>
            <p className="text-muted">
                Voici les points à retravailler. Prenez le temps de lire les explications.
            </p>
            <button onClick={onBackToProfile} className="btn-secondary flex items-center gap-2">
                <ArrowLeft size={20} /> Retour au profil
            </button>
        </div>
      )}

      {(showReview || isReviewOnly) && (
        <div style={{ marginTop: '30px', textAlign: 'left', display: 'flex', flexDirection: 'column', gap: '32px' }}>
          {errorItems.length === 0 ? (
            <div className="card" style={{ padding: '32px', textAlign: 'center' }}>
              <p className="muted" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', fontSize: '1.2rem', margin: 0 }}>
                <PartyPopper size={24} /> Aucune erreur à réviser. Bravo !
              </p>
               {isReviewOnly && (
                   <button onClick={onBackToProfile} className="btn-primary mt-4">
                       Retour au profil
                   </button>
               )}
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
