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
    }
];

const STATS = [
    { value: '800+', label: 'Questions' },
    { value: '100%', label: 'Gratuit' },
    { value: '12', label: 'Thèmes' },
    { value: 'Belge', label: 'Examen' },
];

const HomePage = () => {
    const navigate = useNavigate();

    return (
        <div className="home-page">
            <div className="home-glow" />
            
            <div className="home-content">
                {/* HERO SECTION */}
                
                <h1 className="home-title animate-slide-up">
                    Réussissez votre permis <br />
                    <span className="home-title-accent">du premier coup.</span>
                </h1>
                
                <p className="home-sub animate-slide-up" style={{ animationDelay: '0.1s' }}>
                    La plateforme n°1 en Belgique pour s'entraîner gratuitement aux examens théoriques du permis de conduire.
                </p>

                <div className="home-actions animate-slide-up" style={{ animationDelay: '0.2s' }}>
                    <button className="home-cta-primary" onClick={() => navigate('/examen-b')}>
                        Commencer l'Examen
                        <ArrowRight size={20} />
                    </button>
                    <button className="home-cta-secondary" onClick={() => navigate('/lecons')}>
                        Voir les leçons
                    </button>
                </div>

                <div className="home-stats-row animate-fade-in" style={{ animationDelay: '0.4s' }}>
                    {STATS.map((stat, idx) => (
                        <div key={idx} className="home-stat">
                            <span className="home-stat-value">{stat.value}</span>
                            <span className="home-stat-label">{stat.label}</span>
                        </div>
                    ))}
                </div>

                {/* FEATURES SECTION */}
                <h2 className="home-features-title">Tout pour votre réussite</h2>
                <div className="home-features">
                    {FEATURES.map((feature, idx) => (
                        <div 
                            key={idx} 
                            className="home-feature-card animate-slide-up" 
                            onClick={() => navigate(feature.path)}
                            style={{ 
                                '--card-color': feature.color,
                                '--card-bg': feature.bg,
                                '--card-border': feature.border,
                                animationDelay: `${0.5 + idx * 0.1}s`
                            }}
                        >
                            <div className="home-feature-icon" style={{ color: feature.color }}>
                                <feature.icon size={22} />
                            </div>
                            <div className="home-feature-body">
                                <h3 className="home-feature-title">{feature.title}</h3>
                                <p className="home-feature-desc">{feature.desc}</p>
                            </div>
                            <ChevronRight className="home-feature-arrow" size={18} />
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default HomePage;
