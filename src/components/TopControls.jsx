import React, { useState, useEffect } from 'react';
import { User, BookOpen, GraduationCap, Layers, Menu, X, ArrowRight, Sparkles, BrainCircuit } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import ThemeToggleButton from './ThemeChanger';

const NAV_ITEMS = [
    { label: 'Leçons', icon: BookOpen, path: '/lecons', match: (p) => p.startsWith('/lecon') || p.startsWith('/cours') },
    { label: 'Quiz', icon: Layers, path: '/quiz', match: (p) => p.startsWith('/quiz') },
    { label: 'Examen B', icon: GraduationCap, path: '/examen-b', match: (p) => p === '/examen-b' },
];

const TopControls = ({ toggleTheme, isDarkMode, user }) => {
    const navigate = useNavigate();
    const location = useLocation();
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

    const isHiddenOnQuizRoute = location.pathname.match(/^\/quiz\/.+/) && location.pathname !== '/quiz';

    // Close menu on route change
    useEffect(() => {
        setIsMobileMenuOpen(false);
    }, [location.pathname]);

    // Lock body scroll when menu is open
    useEffect(() => {
        if (isMobileMenuOpen) {
            document.body.style.overflow = 'hidden';
            document.documentElement.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = 'unset';
            document.documentElement.style.overflow = 'unset';
        }
        return () => { 
            document.body.style.overflow = 'unset'; 
            document.documentElement.style.overflow = 'unset';
        };
    }, [isMobileMenuOpen]);

    if (isHiddenOnQuizRoute) return null;

    return (
        <>
            <nav className="top-nav">
                <div 
                    className="top-nav-logo-wrap" 
                    onClick={() => {
                        if (location.pathname === '/' || location.pathname === '/permisfree.be/') {
                            window.scrollTo({ top: 0, behavior: 'smooth' });
                        } else {
                            navigate('/');
                        }
                    }} 
                    role="button" 
                    tabIndex={0}
                >
                    <img src={`${import.meta.env.BASE_URL}logo.svg`} alt="Permis Logo" style={{ height: '32px', width: 'auto' }} />
                </div>

                {/* DESKTOP CENTER NAV */}
                <div className="top-nav-center desktop-only">
                    {NAV_ITEMS.map(item => {
                        const active = item.match(location.pathname);
                        const Icon = item.icon;
                        return (
                            <button
                                key={item.path}
                                className={`top-nav-link ${active ? (item.accent ? 'top-nav-link--exam' : 'top-nav-link--active') : ''}`}
                                onClick={() => navigate(item.path)}
                            >
                                <Icon size={14} strokeWidth={2.2} />
                                {item.label}
                            </button>
                        );
                    })}
                </div>

                <div className="top-nav-right">
                    <ThemeToggleButton 
                        isDarkMode={isDarkMode} 
                        toggleTheme={toggleTheme} 
                        size={32}
                        toggleType="Button"
                    />
                    
                    {/* DESKTOP USER BUTTON */}
                    <button className="top-nav-cta desktop-only" onClick={() => navigate('/profil')} style={{ padding: user ? '4px 12px 4px 6px' : undefined }}>
                        {user ? (
                             <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                {user.photoURL ? (
                                    <img src={user.photoURL} alt="" style={{ width: '24px', height: '24px', borderRadius: '50%' }} />
                                ) : (
                                    <div style={{ width: '24px', height: '24px', borderRadius: '50%', background: 'var(--primary)', color: 'white', display: 'grid', placeItems: 'center', fontSize: '12px', fontWeight: 'bold' }}>
                                        {user.displayName ? user.displayName[0].toUpperCase() : 'U'}
                                    </div>
                                )}
                                <span style={{ fontSize: '13px', fontWeight: 600 }}>Mon compte</span>
                             </div>
                        ) : (
                            <>
                                <User size={15} />
                                Mon compte
                            </>
                        )}
                    </button>

                    {/* MOBILE HAMBURGER BUTTON */}
                    <button 
                        className="top-nav-icon-btn mobile-only" 
                        onClick={() => setIsMobileMenuOpen(true)}
                        style={{ 
                            border: 'none', 
                            background: 'transparent', 
                            color: 'var(--text)',
                            padding: '4px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                        }}
                    >
                        <Menu size={32} strokeWidth={2.5} />
                    </button>
                </div>
            </nav>

            {/* MOBILE FULLSCREEN MENU OVERLAY */}
            {isMobileMenuOpen && (
                <div className="mobile-menu-overlay animate-fade-in">
                    <div className="mobile-menu-header">
                         <div className="mobile-menu-logo" onClick={() => { navigate('/'); setIsMobileMenuOpen(false); }}>
                            <img src={`${import.meta.env.BASE_URL}logo.svg`} alt="Permis Logo" style={{ height: '42px', width: 'auto' }} />
                        </div>
                        <button 
                            onClick={() => setIsMobileMenuOpen(false)}
                            className="mobile-menu-close-btn"
                        >
                            <X size={28} strokeWidth={2.5} />
                        </button>
                    </div>

                    <div className="mobile-menu-links">
                        {NAV_ITEMS.map(item => {
                            const isActive = item.match(location.pathname);
                            return (
                                <button 
                                    key={item.path}
                                    onClick={() => navigate(item.path)} 
                                    className={`mobile-menu-item ${isActive ? 'active' : ''}`}
                                >
                                    {isActive && <div className="mobile-menu-dot" />}
                                    <span className="mobile-menu-label">{item.label}</span>
                                </button>
                            );
                        })}
                    </div>

                    <div className="mobile-menu-cta-container">
                        <button onClick={() => navigate('/profil')} className="mobile-menu-cta">
                            {user ? (
                                <>
                                    <span>Mon Compte</span>
                                    <div className="mobile-avatar-mini">
                                        {user.photoURL ? (
                                            <img src={user.photoURL} alt="" />
                                        ) : (
                                            <span>{user.displayName ? user.displayName[0].toUpperCase() : 'U'}</span>
                                        )}
                                    </div>
                                </>
                            ) : (
                                <>
                                    <span>Se connecter</span>
                                    <ArrowRight size={20} />
                                </>
                            )}
                        </button>
                    </div>
                </div>
            )}
        </>
    );
};

export default TopControls;
