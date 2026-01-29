import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import { lessons } from '../data/lessons';

const LessonPage = () => {
  const { slug } = useParams();
  const lesson = lessons.find((l) => l.slug === slug);
  const [content, setContent] = useState('');
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);

  const normalizeFileName = (filename) => {
    if (!filename) return '';
    let name = String(filename).replace(/\.md$/i, '').toLowerCase();
    name = name.replace(/leçon/gi, '').replace(/lecon/gi, '').trim();
    name = name.replace(/\s+/g, '_').replace(/_+/g, '_').replace(/^_+/, '');
    const m = name.match(/\d+/);
    if (m) {
      const num = m[0];
      const rest = name.replace(/^\d+_?/, '');
      name = `${num}_${rest}`;
    }
    return `${name}.md`;
  };

  useEffect(() => {
    if (!lesson) {
      setError('Leçon introuvable.');
      setLoading(false);
      return;
    }
    const normalized = normalizeFileName(lesson.file);
    const url = `/lecon/${encodeURIComponent(normalized)}`;
    fetch(url)
      .then((res) => {
        if (!res.ok) throw new Error(`Impossible de charger ${lesson.file}`);
        const ct = res.headers.get('content-type') || '';
        return res.text().then((text) => ({ ct, text }));
      })
      .then(({ ct, text }) => {
        // If Vite returned the app shell (HTML), the file doesn't exist in public/lecon
        const looksHtml = ct.includes('text/html') || /<html[\s\S]*<\/html>/i.test(text);
        if (looksHtml) {
          setError(`Fichier introuvable: ${lesson.file}. Placez les fichiers Markdown dans code-route-app/public/lecon/`);
        } else {
          setContent(text);
        }
        setLoading(false);
      })
      .catch((e) => {
        setError(e.message);
        setLoading(false);
      });
  }, [lesson]);

  return (
    <div className="container">
      <div className="actions" style={{ justifyContent: 'space-between' }}>
        <Link className="btn-ghost" to="/lecons">← Retour aux leçons</Link>
        <Link className="btn-ghost" to="/">🏁 Aller au quiz</Link>
      </div>

      <div className="card" style={{ padding: 20 }}>
        <h1 style={{ marginBottom: 6 }}>{lesson?.title ?? 'Leçon'}</h1>
        {loading && <p>Chargement…</p>}
        {error && <p className="muted">{error}</p>}
        {!loading && !error && (
          <div className="markdown">
            <ReactMarkdown>{content}</ReactMarkdown>
          </div>
        )}
      </div>
    </div>
  );
};

export default LessonPage;
