import React from 'react';
import { useNavigate } from 'react-router-dom';
import { BookOpen, Layers, GraduationCap, Zap, Shield, ArrowRight, ChevronRight } from 'lucide-react';

const FEATURES = [
    {
        icon: Layers,
        title: 'Quiz Interactifs',
        desc: 'Des centaines de questions du code de la route belge, organisées par thèmes.',
        path: '/quiz',
        color: '#0ea5e9',
        bg: 'rgba(14,165,233,0.08)',
        border: 'rgba(14,165,233,0.2)',
    },
    {
        icon: BookOpen,
        title: 'Leçons Illustrées',
        desc: 'Apprenez les règles avec des explications claires et des exemples visuels.',
        path: '/lecons',
        color: '#a855f7',
        bg: 'rgba(168,85,247,0.08)',
        border: 'rgba(168,85,247,0.2)',
    },
    {
        icon: GraduationCap,
        title: 'Examen Blanc B',
        desc: 'Simulez les conditions réelles de l\'examen théorique belge.',
        path: '/examen-b',
        color: '#f59e0b',
        bg: 'rgba(245,158,11,0.08)',
        border: 'rgba(245,158,11,0.2)',
    },
];

const STATS = [
    { value: '800+', label: 'Questions' },
    { value: '100%', label: 'Gratuit' },
    { value: '12', label: 'Thèmes' },
    { value: 'Belge', label: 'Examen' },
];

const HomePage = ({ progress }) => {
    const navigate = useNavigate();

    return (
        <div className="home-page">
            <div className="home-glow" />

            <div className="home-content">
                <div className="home-badge">
                    <Zap size={12} />
                    Gratuit • Sans pub • Open source
                </div>

                <h1 className="home-title">
                    Réussir son<br />
                    <span className="home-title-accent">permis belge</span><br />
                    facilement.
                </h1>

                <p className="home-sub">
                    La préparation la plus complète pour l'examen théorique de catégorie B en Belgique.
                    Questions officielles, leçons illustrées et examens blancs.
                </p>

                <div className="home-actions">
                    <button className="home-cta-primary" onClick={() => navigate('/lecons')}>
                        Commencer à apprendre
                        <ArrowRight size={18} />
                    </button>
                </div>



                <div className="home-stats-row">
                    {STATS.map(s => (
                        <div key={s.label} className="home-stat">
                            <div className="home-stat-value">{s.value}</div>
                            <div className="home-stat-label">{s.label}</div>
                        </div>
                    ))}
                </div>

                <div className="home-features-title">Tout ce qu'il vous faut</div>

                <div className="home-features">
                    {FEATURES.map(f => {
                        const Icon = f.icon;
                        return (
                            <button
                                key={f.path}
                                className="home-feature-card"
                                style={{ '--card-color': f.color, '--card-bg': f.bg, '--card-border': f.border }}
                                onClick={() => navigate(f.path)}
                            >
                                <div className="home-feature-icon">
                                    <Icon size={22} style={{ color: f.color }} />
                                </div>
                                <div className="home-feature-body">
                                    <div className="home-feature-title">{f.title}</div>
                                    <div className="home-feature-desc">{f.desc}</div>
                                </div>
                                <ChevronRight size={18} className="home-feature-arrow" />
                            </button>
                        );
                    })}
                </div>

                <div className="home-footer-note">
                    <Shield size={13} />
                    Données stockées localement • Aucune inscription requise
                </div>
            </div>
        </div>
    );
};

export default HomePage;
