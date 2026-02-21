import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { BookOpen, Search, CheckCircle2, Circle, CircleCheck, Eye, EyeOff, GraduationCap } from 'lucide-react';

const ThemeSelector = ({ sections, progress, onSelectTheme, onSelectLesson, mode = 'all', showCompleted, onToggleShowCompleted }) => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const hideCompleted = !showCompleted;

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

  const isAllFinished = useMemo(() => {
    // Check if everything in this mode is completed
    const baseSections = (sections || []).filter(s => s.title !== 'Debug');
    
    let allItems = baseSections.flatMap(s => s.items);
    
    if (mode === 'lessons') {
        allItems = allItems.filter(item => item.lessonFile || (item.file && item.id !== 'examen_B'));
    } else if (mode === 'quiz') {
        const excludedIds = ['examen_B', 'infractions', '15_depassement_interdit', '0_intro', '0_permis'];
        allItems = allItems.filter(item => !excludedIds.includes(item.id));
    }

    if (allItems.length === 0) return false;

    return allItems.every(item => {
        const itemProgress = progress && progress[item.id];
        if (!itemProgress) return false;
        if (mode === 'lessons') {
            return itemProgress.read === true;
        }
        return itemProgress.score !== undefined;
    });
  }, [sections, mode, progress]);

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
        
        <div style={{ flex: 1, minWidth: '240px' }} />
        
        <div className="eb-toggle-row" 
             onClick={onToggleShowCompleted}
             style={{ padding: '6px 12px', borderRadius: '10px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', gap: '10px', cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
             <span className="eb-toggle-label" style={{ fontSize: '13px', fontWeight: 600, color: showCompleted ? 'var(--text)' : 'var(--muted)' }}>
                {showCompleted ? "Masquer les éléments terminés" : "Afficher les éléments terminés"}
            </span>
             <div style={{ color: showCompleted ? 'var(--primary)' : 'var(--muted)', display: 'flex' }}>
                {showCompleted ? <Eye size={18} /> : <EyeOff size={18} />}
            </div>
        </div>
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
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      ...(isExam ? { color: 'var(--warning)', fontSize: '1.1rem' } : {})
                    }}>
                      {item.name}
                      {itemProgress?.read && <CircleCheck size={16} style={{ color: 'var(--success)' }} />}
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

      {filteredSections.length === 0 && !isAllFinished && (
        <p className="muted text-center mt-5">Aucun résultat trouvé.</p>
      )}

      {hideCompleted && isAllFinished && (
        <div style={{
            marginTop: '40px',
            padding: '40px 20px',
            textAlign: 'center',
            background: 'linear-gradient(135deg, rgba(var(--primary-rgb), 0.1) 0%, rgba(var(--primary-rgb), 0.05) 100%)',
            borderRadius: '24px',
            border: '2px dashed rgba(var(--primary-rgb), 0.2)',
            animation: 'fadeInUp 0.6s ease-out'
        }}>
            <div style={{
                width: '80px',
                height: '80px',
                backgroundColor: 'var(--primary)',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 24px',
                boxShadow: '0 10px 20px rgba(var(--primary-rgb), 0.3)',
                color: 'white'
            }}>
                <GraduationCap size={40} />
            </div>
            
            <h2 style={{ fontSize: '1.8rem', marginBottom: '16px', fontWeight: 700 }}>
                {mode === 'lessons' ? 'Toutes les leçons terminées !' : 'Tous les quiz terminés !'}
            </h2>
            
            <p style={{ 
                fontSize: '1.1rem', 
                color: 'var(--text)', 
                maxWidth: '500px', 
                margin: '0 auto 32px',
                lineHeight: '1.6',
                opacity: 0.9
            }}>
                Félicitations ! Oui, vous avez fini toutes les {mode === 'lessons' ? 'leçons' : 'quiz'}. 
                <strong> Vous êtes maintenant fin prêt pour l'examen final.</strong>
            </p>

            <button 
                onClick={() => navigate('/examen-b')}
                className="btn-primary"
                style={{ 
                    padding: '14px 32px', 
                    fontSize: '1.1rem', 
                    borderRadius: '12px',
                    boxShadow: '0 4px 15px rgba(var(--primary-rgb), 0.4)',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '12px',
                    fontWeight: 600,
                    transition: 'transform 0.2s cubic-bezier(0.175, 0.885, 0.32, 1.275)'
                }}
                onMouseOver={(e) => e.currentTarget.style.transform = 'scale(1.05)'}
                onMouseOut={(e) => e.currentTarget.style.transform = 'scale(1)'}
            >
                <GraduationCap size={20} />
                Passer l'Examen B
            </button>
        </div>
      )}
    </div>
  );
};

export default ThemeSelector;
