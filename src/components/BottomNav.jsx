import React from 'react';
import { BookOpen, Layers, GraduationCap } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';

const NAV_ITEMS = [
    { label: 'Leçons', icon: BookOpen, path: '/lecons', match: (p) => p.startsWith('/lecon') || p.startsWith('/cours') },
    { label: 'Quiz', icon: Layers, path: '/quiz', match: (p) => p.startsWith('/quiz') },
    { label: 'Examen B', icon: GraduationCap, path: '/examen-b', match: (p) => p === '/examen-b', accent: true },
];

const BottomNav = () => {
    const navigate = useNavigate();
    const location = useLocation();

    // Hide on active quiz pages (where focus is needed)
    // BUT we might want it accessible? Usually in a quiz flow, we hide main nav to prevent accidental exit.
    // Let's keep the logic consistent with TopControls: Hide on active quiz.
    if (location.pathname.match(/^\/quiz\/.+/) && location.pathname !== '/quiz') {
        return null;
    }

    return (
        <nav className="bottom-nav">
            {NAV_ITEMS.map(item => {
                const active = item.match(location.pathname);
                const Icon = item.icon;
                return (
                    <button
                        key={item.path}
                        className={`bottom-nav-item ${active ? 'active' : ''} ${item.accent ? 'accent' : ''}`}
                        onClick={() => navigate(item.path)}
                    >
                        <Icon size={20} strokeWidth={active ? 2.5 : 2} />
                        <span className="bottom-nav-label">{item.label}</span>
                    </button>
                );
            })}
        </nav>
    );
};

export default BottomNav;
