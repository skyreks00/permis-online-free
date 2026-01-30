import React from 'react';
import { Trophy, ThumbsUp, Award, Target, PartyPopper } from 'lucide-react';

const Results = ({ score, total, questions = [], answers = [], showReview = false, onRestart, onBackToThemes, isExamMode }) => {
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
    return t
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

      {showReview && (
        <div className="review card" style={{ padding: 16, marginTop: '30px', textAlign: 'left' }}>
          <h2>Erreurs et conseils</h2>
          {errorItems.length === 0 ? (
            <p className="muted" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <PartyPopper size={20} /> Aucune erreur. Bravo !
            </p>
          ) : (
            errorItems.map(({ q, a, idx }) => (
              <div className="review-item" key={`${q.id}-${idx}`}>
                <div><strong>Question:</strong> {q.question}</div>
                {q.image && (
                  <div className="mt-2"><img src={q.image} alt="Illustration" /></div>
                )}
                <div className="mt-2"><strong>Ta réponse:</strong> {formatAnswer(q, a?.userAnswer)}</div>
                <div><strong>Bonne réponse:</strong> {formatAnswer(q, q.correctAnswer)}</div>
                {q.explanation && (
                  <div className="mt-2"><strong>Conseil:</strong> {cleanExplanation(q.explanation)}</div>
                )}
                <hr />
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
};

export default Results;
