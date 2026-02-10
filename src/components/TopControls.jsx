import React from 'react';
import { Moon, Sun, User } from 'lucide-react';

const TopControls = ({ onOpenProfile, toggleTheme, isDarkMode, showProfileButton = true }) => {
    return (
        <div style={{
            position: 'fixed',
            top: '20px',
            right: '20px',
            display: 'flex',
            gap: '4px',
            zIndex: 1000,
            background: 'var(--surface)',
            padding: '4px',
            borderRadius: '30px',
            border: '1px solid var(--border)',
            boxShadow: 'var(--shadow-sm)'
        }}>
            {showProfileButton && (
                <button
                    className="btn-ghost"
                    onClick={onOpenProfile}
                    title="Mon Profil"
                    style={{
                        width: '36px',
                        height: '36px',
                        display: 'grid',
                        placeItems: 'center',
                        padding: 0,
                        borderRadius: '50%'
                    }}
                >
                    <User size={20} />
                </button>
            )}
            <button
                className="theme-toggle btn-ghost"
                onClick={toggleTheme}
                title={isDarkMode ? 'Mode clair' : 'Mode sombre'}
                style={{
                    width: '36px',
                    height: '36px',
                    display: 'grid',
                    placeItems: 'center',
                    padding: 0,
                    borderRadius: '50%'
                }}
            >
                {isDarkMode ? <Sun size={20} /> : <Moon size={20} />}
            </button>
        </div>
    );
};

export default TopControls;
