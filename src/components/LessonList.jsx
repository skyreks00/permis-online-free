import React from 'react';
import { Link } from 'react-router-dom';
import { lessons } from '../data/lessons';

const LessonList = () => {
  return (
    <div className="page container">
      <h1 className="page-title">Apprendre le Code de la Route</h1>
      <p className="muted">Choisissez une leçon à lire.</p>

      <div className="theme-grid">
        {lessons.map((l) => (
          <Link key={l.slug} to={`/lecons/${l.slug}`} className="theme-btn card">
            <span className="theme-name">{l.title}</span>
            <span className="theme-meta">Markdown</span>
          </Link>
        ))}
      </div>
    </div>
  );
};

export default LessonList;
