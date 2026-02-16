import React, { useMemo, useState } from 'react';
import { BookOpen, Search, CheckCircle2, Circle } from 'lucide-react';

const ThemeSelector = ({ sections, progress, onSelectTheme, onSelectLesson }) => {
  const [searchTerm, setSearchTerm] = useState('');

  const filteredSections = useMemo(() => {
    const q = searchTerm.trim().toLowerCase();
    if (!q) return sections || [];

    return (sections || []).map(section => {
      const matchingItems = section.items.filter(item =>
        item.name.toLowerCase().includes(q)
      );
      return { ...section, items: matchingItems };
    }).filter(section => section.items.length > 0);
  }, [sections, searchTerm]);

  return (
    <div className="page container">
      <div style={{ display: 'flex', alignItems: 'flex-start', marginTop: '60px' }}>
        <div>
          <h1 className="page-title">Entraînement Code de la Route</h1>
          <p className="muted">Choisissez un sujet et lancez le Quiz.</p>
        </div>
      </div>

      <div className="search" style={{ position: 'relative' }}>
        <Search size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--muted)' }} />
        <input
          className="input"
          type="search"
          placeholder="Rechercher un thème…"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          aria-label="Rechercher un thème"
          style={{ paddingLeft: '40px' }}
        />
      </div>

      {filteredSections.map((section, idx) => (
        <div key={idx} className="section mb-5">
          {section.title && <h2 className="mt-4 mb-3" style={{ fontSize: '1.4rem' }}>{section.title}</h2>}
          <div className="theme-grid">
            {section.items.map((item) => {
              const itemProgress = progress && progress[item.id];
              const score = itemProgress ? itemProgress.score : null;
              const isCompleted = score !== null;

              const isExam = item.id === 'examen_B' || section.title === 'Examen';
              const hasLesson = item.lessonFile || (!isExam && item.file);

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
                  {isCompleted && (
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
                      paddingRight: isCompleted ? '40px' : '0',
                      ...(isExam ? { color: 'var(--warning)', fontSize: '1.1rem' } : {})
                    }}>
                      {item.name}
                    </div>
                    {item.totalQuestions > 0 && (
                      <div className="theme-meta" style={{ color: 'var(--muted)', fontSize: '13px' }}>
                        {item.totalQuestions} questions
                      </div>
                    )}
                  </div>

                  <div style={{ display: 'flex', gap: '8px' }}>
                    {item.file ? (
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
                    )}

                    {!isExam && (
                      <button
                        type="button"
                        className="btn-ghost"
                        style={{
                          flex: 1,
                          padding: '8px',
                          border: '1px solid var(--border)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '6px',
                          ...(!hasLesson ? { opacity: 0.5, cursor: 'not-allowed' } : {})
                        }}
                        disabled={!hasLesson}
                        onClick={() => {
                          if (!hasLesson) return;
                          // Use explicit lessonFile if present, otherwise derive from json file
                          const lesson = item.lessonFile || (item.file ? item.file.replace('.json', '.html') : null);
                          if (lesson) onSelectLesson(lesson);
                        }}
                      >
                        <BookOpen size={16} /> Leçon
                      </button>
                    )}
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
