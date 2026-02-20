import React from 'react';
import { Trophy, Target, AlertTriangle, RefreshCcw } from 'lucide-react';

const GlobalStats = ({ progress, themesData, onReviewAll, onReset }) => {
    // --- Stats Calculation ---
    const getNormalizedProgress = (p) => {
        const score = p.bestScore !== undefined ? p.bestScore : (p.score || 0);
        const total = p.totalQuestions !== undefined ? p.totalQuestions : (p.total || 0);
        return { score, total };
    };

    // Extract all valid theme IDs from sections
    const validThemeIds = (themesData?.sections || [])
        .flatMap(section => section.items || [])
        .map(item => item.id);

    // IDs to exclude from stats (must match ThemeSelector exclusions)
    const excludedIds = ['examen_B', 'infractions', '15_depassement_interdit', '0_intro', '0_permis', 'debug', 'debug_quiz'];

    const progressValues = Object.entries(progress)
        .filter(([key, value]) => {
            // Must be a valid metadata/score AND exist in current themes
            if (key === 'metadata') return false;
            // Exclude specific non-quiz items
            if (excludedIds.includes(key)) return false;
            
            if (value.score === undefined || value.total <= 0) return false;
            // Only count if it belongs to a known theme (excludes old/deleted themes)
            return validThemeIds.includes(key);
        })
        .map(([, value]) => value);
    const totalQuizzes = progressValues.length;
    
    const globalStats = progressValues.reduce((acc, p) => {
        const { score, total } = getNormalizedProgress(p);
        return {
            bestScore: acc.bestScore + score,
            totalQuestions: acc.totalQuestions + total
        };
    }, { bestScore: 0, totalQuestions: 0 });

    const totalBestScore = globalStats.bestScore;
    const totalMaxPossible = globalStats.totalQuestions;
    const averageAccuracy = totalMaxPossible > 0 ? Math.round((totalBestScore / totalMaxPossible) * 100) : 0;
    const totalMistakes = totalMaxPossible - totalBestScore;

    return (
        <div className="profile-stats-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '8px', marginBottom: 0 }}>
            <div className="stat-card" style={{ padding: '10px 12px', gap: '10px' }}>
                <div className="stat-icon primary" style={{ width: '36px', height: '36px' }}>
                    <Trophy size={18} />
                </div>
                <div className="stat-content">
                    <div className="stat-label" style={{ fontSize: '11px', fontWeight: 500 }}>Moyenne</div>
                    <div className="stat-value" style={{ fontSize: '18px' }}>{averageAccuracy}%</div>
                </div>
            </div>
            <div className="stat-card" style={{ padding: '10px 12px', gap: '10px' }}>
                <div className="stat-icon info" style={{ width: '36px', height: '36px' }}>
                    <Target size={18} />
                </div>
                <div className="stat-content">
                    <div className="stat-label" style={{ fontSize: '11px', fontWeight: 500 }}>Quiz</div>
                    <div className="stat-value" style={{ fontSize: '18px' }}>{totalQuizzes}</div>
                </div>
            </div>
            <div className="stat-card" style={{ padding: '10px 12px', gap: '10px' }}>
                <div className="stat-icon danger" style={{ width: '36px', height: '36px' }}>
                    <AlertTriangle size={18} />
                </div>
                <div className="stat-content">
                    <div className="stat-label" style={{ fontSize: '11px', fontWeight: 500 }}>Fautes</div>
                    <div className="stat-value" style={{ fontSize: '18px' }}>{totalMistakes}</div>
                </div>
                {totalMistakes > 0 && onReviewAll && (
                    <button 
                        onClick={onReviewAll}
                        className="btn-primary btn-sm"
                        style={{ padding: '4px 10px', fontSize: '11px', height: 'auto', minHeight: 'auto', marginLeft: 'auto' }}
                        title="Réviser les fautes"
                    >
                        <RefreshCcw size={14} />
                    </button>
                )}
            </div>
        </div>
    );
};

export default GlobalStats;
