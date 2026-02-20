import React, { useMemo, useState } from 'react';
import { BookOpen, Search, CheckCircle2, Circle } from 'lucide-react';

const ThemeSelector = ({ sections, progress, onSelectTheme, onSelectLesson, mode = 'all' }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [hideCompleted, setHideCompleted] = useState(false);

  const filteredSections = useMemo(() => {
    const q = searchTerm.trim().toLowerCase();
    
    // Filter out Examen B and Debug from standard lists if needed (though Exam B has its own page now)
    // Actually, Examen B is in sections json.
    // If mode is lessons, we only want items with lessons.
    // If mode is quiz, we want all quizzes.

    let allowed = (sections || []).filter(s => s.title !== 'Debug');
    
    // In 'lessons' mode, filter out Examen B if it doesn't have lessons behaving standardly (it has synthesis).
    // Let's keep it simple: filter items based on mode.

    return allowed.map(section => {
      let items = section.items;

      // Filter items based on SEARCH
      if (q) {
        items = items.filter(item => item.name.toLowerCase().includes(q));
      }

      // Filter items based on MODE
      if (mode === 'lessons') {
         // Keep only items that have a lessonFile OR a file (assuming file implies lesson capability if not explicit check fails later)
         items = items.filter(item => item.lessonFile || (item.file && item.id !== 'examen_B')); 
      } else if (mode === 'quiz') {
         // Filter out specific items requested by user
         const excludedIds = ['examen_B', 'infractions', '15_depassement_interdit', '0_intro', '0_permis'];
         items = items.filter(item => !excludedIds.includes(item.id));
      }

      if (hideCompleted) {
          items = items.filter(item => {
              const itemProgress = progress && progress[item.id];
              if (!itemProgress) return true;
              if (mode === 'lessons') {
                  return itemProgress.read !== true;
              }
              return itemProgress.score === undefined;
          });
      }
      
      return { ...section, items };
    }).filter(section => section.items.length > 0);

  }, [sections, searchTerm, mode, hideCompleted, progress]);

  return (
    <div className="page container">
      <div style={{ display: 'flex', alignItems: 'flex-start' }}>
        <div>
          <h1 className="page-title" style={{ marginTop: 0 }}>
            {mode === 'lessons' ? 'Leçons du Code' : mode === 'quiz' ? 'Quiz d\'Entraînement' : 'Entraînement Code de la Route'}
          </h1>
          <p className="muted">
             {mode === 'lessons' ? 'Révisez vos fiches et cours.' : 'Choisissez un sujet et lancez le Quiz.'}
          </p>
        </div>
      </div>

      <div className="search-row" style={{ display: 'flex', gap: '20px', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap' }}>
        <div className="search" style={{ position: 'relative', flex: 1, minWidth: '240px' }}>
            <Search size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--muted)' }} />
            <input
            className="input"
            type="search"
            placeholder="Rechercher un thème…"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            aria-label="Rechercher un thème"
            style={{ paddingLeft: '40px', width: '100%' }}
            />
        </div>
        
        <label className="eb-toggle-row" style={{ padding: 0, border: 'none', background: 'none', gap: '12px' }}>
             <button
                role="switch"
                aria-checked={hideCompleted}
                className={`eb-toggle ${hideCompleted ? 'eb-toggle--on' : ''}`}
                onClick={() => setHideCompleted(!hideCompleted)}
                title="Masquer les éléments terminés"
            >
                <span className="eb-toggle-thumb" />
            </button>
            <span className="eb-toggle-label" style={{ fontSize: '13px', fontWeight: 500, color: 'var(--muted)' }}>
                {mode === 'lessons' ? 'Masquer les leçons déjà étudiées' : 
                 mode === 'quiz' ? 'Masquer les quiz déjà réalisés' : 
                 'Masquer les éléments terminés'}
            </span>
        </label>
      </div>

      {filteredSections.map((section, idx) => (
        <div key={idx} className="section mb-5">
          {section.title && <h2 className="mt-4 mb-3" style={{ fontSize: '1.4rem' }}>{section.title}</h2>}
          <div className="theme-grid">
            {section.items.map((item) => {
              const itemProgress = progress && progress[item.id];
              const score = (itemProgress && itemProgress.score !== undefined) ? itemProgress.score : null;
              const isCompleted = score !== null;

              const isExam = item.id === 'examen_B' || section.title === 'Examen';
              const hasLesson = item.lessonFile || (!isExam && item.file);

              // If mode is lessons, do we show quiz button? User said "only lessons".
              // If mode is quiz, "only quiz".
              
              const showQuizBtn = mode === 'all' || mode === 'quiz';
              const showLessonBtn = mode === 'all' || mode === 'lessons';

              return (
                <div
                  key={item.id}
                  className="theme-card card"
                  style={{
                    padding: '16px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '12px',
                    position: 'relative',
                    overflow: 'hidden',
                    ...(isExam ? {
                      borderColor: 'var(--warning)',
                      background: 'linear-gradient(to bottom right, var(--surface), rgba(245, 158, 11, 0.1))',
                      boxShadow: '0 4px 12px rgba(245, 158, 11, 0.15)'
                    } : {})
                  }}
                >
                  {isCompleted && showQuizBtn && (
                    <div style={{
                      position: 'absolute',
                      top: 0,
                      right: 0,
                      background: 'var(--primary)',
                      color: 'white',
                      fontSize: '10px',
                      padding: '2px 8px',
                      borderBottomLeftRadius: '8px'
                    }}>
                      {score}/{item.totalQuestions}
                    </div>
                  )}
                  <div style={{ flex: 1 }}>
                    <div className="theme-name" style={{
                      fontWeight: 600,
                      marginBottom: 4,
                      paddingRight: (isCompleted && showQuizBtn) ? '40px' : '0',
                      ...(isExam ? { color: 'var(--warning)', fontSize: '1.1rem' } : {})
                    }}>
                      {item.name}
                    </div>
                    {item.totalQuestions > 0 && showQuizBtn && (
                      <div className="theme-meta" style={{ color: 'var(--muted)', fontSize: '13px' }}>
                        {item.totalQuestions} questions
                      </div>
                    )}
                  </div>

                  <div style={{ display: 'flex', gap: '8px' }}>
                    {showQuizBtn && (
                        item.file ? (
                        <button
                            type="button"
                            className={`btn-primary ${isExam ? 'btn-exam' : ''}`}
                            style={{
                            flex: 1,
                            padding: '8px',
                            display: 'grid',
                            placeItems: 'center',
                            ...(isExam ? { background: 'var(--warning)', borderColor: 'var(--warning)', color: '#000' } : {})
                            }}
                            onClick={() => onSelectTheme(item)}
                        >
                            Quiz
                        </button>
                        ) : (
                        <button
                            type="button"
                            className="btn-primary"
                            style={{ flex: 1, padding: '8px', opacity: 0.5, cursor: 'not-allowed', display: 'grid', placeItems: 'center' }}
                            disabled
                        >
                            Quiz
                        </button>
                        )
                    )}


                    {showLessonBtn && !isExam && (
                      <button
                        type="button"
                        className={mode === 'lessons' ? "btn-primary" : "btn-ghost"}
                        style={{
                          flex: 1,
                          padding: '8px',
                          border: mode === 'lessons' ? 'none' : '1px solid var(--border)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '6px',
                          ...(!hasLesson ? { opacity: 0.5, cursor: 'not-allowed' } : {})
                        }}
                        disabled={!hasLesson}
                        onClick={() => {
                          if (!hasLesson) return;
                          const lesson = item.lessonFile || (item.file ? item.file.replace('.json', '.html') : null);
                          if (lesson) onSelectLesson(lesson);
                        }}
                      >
                        <BookOpen size={16} /> {mode === 'lessons' ? 'Lire la leçon' : 'Leçon'}
                      </button>
                    )}

                    {/* Show lessons for Exam items (or any item with multiple lessons) - Only in Lesson Mode or All */}
                    {showLessonBtn && item.lessons && item.lessons.map((lesson, lIdx) => (
                         <button
                            key={lIdx}
                            type="button"
                            className={mode === 'lessons' ? "btn-primary" : "btn-ghost"}
                            style={{
                              flex: 1,
                              padding: '8px',
                              border: mode === 'lessons' ? 'none' : '1px solid var(--border)',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              gap: '6px',
                              ...(isExam && mode !== 'lessons' ? { borderColor: 'var(--warning)', color: 'var(--warning)' } : {})
                            }}
                            onClick={() => onSelectLesson(lesson.file)}
                          >
                           <BookOpen size={16} /> {lesson.name}
                        </button>
                    ))}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      ))}

      {filteredSections.length === 0 && (
        <p className="muted text-center mt-5">Aucun résultat trouvé.</p>
      )}
    </div>
  );
};

export default ThemeSelector;
