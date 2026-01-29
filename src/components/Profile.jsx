import React from 'react';
import { Trophy, Target, AlertTriangle, Clock, BarChart2, ArrowLeft } from 'lucide-react';

const Profile = ({ progress, themesData, onBack, onReset }) => {
    // --- Stats Calculation ---
    const progressValues = Object.values(progress);
    const totalQuizzes = progressValues.length;

    // Average Score
    const totalBestScore = progressValues.reduce((acc, p) => acc + p.bestScore, 0);
    const totalMaxPossible = progressValues.reduce((acc, p) => acc + p.totalQuestions, 0);
    const averageAccuracy = totalMaxPossible > 0 ? Math.round((totalBestScore / totalMaxPossible) * 100) : 0;

    // Mistakes (Gap to perfection on attempted quizzes)
    // Logic: For every quiz started, how many points are missed in the *best* attempt?
    const totalMistakes = totalMaxPossible - totalBestScore;

    // Flatten themes for history list
    // Sort by checking if progress exists? 
    // We don't have a "date" in the current progress object, so we can't do real "Recent History".
    // We'll show "Complété récemment" (all completed) for now.
    const allThemes = (themesData.sections || []).flatMap(section => section.items).filter(t => t.file);
    const statedThemes = allThemes.filter(t => progress[t.id]);

    // --- Components ---

    const StatCard = ({ icon, label, value, subtext, iconColor, iconBg }) => (
        <div className="card" style={{ padding: '20px', display: 'flex', alignItems: 'center', gap: '16px', border: 'none', background: 'var(--bg-elev)' }}>
            <div style={{
                width: '48px', height: '48px',
                borderRadius: '12px',
                background: iconBg,
                color: iconColor,
                display: 'grid', placeItems: 'center',
            }}>
                {icon}
            </div>
            <div>
                <div style={{ color: 'var(--muted)', fontSize: '0.9rem', marginBottom: '4px' }}>{label}</div>
                <div style={{ fontSize: '1.8rem', fontWeight: 700, lineHeight: 1 }}>{value}</div>
                {subtext && <div style={{ color: 'var(--muted)', fontSize: '0.8rem', marginTop: '4px' }}>{subtext}</div>}
            </div>
        </div>
    );

    return (
        <div className="page container" style={{ maxWidth: '1200px' }}>

            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
                <button onClick={onBack} className="btn-ghost" style={{ paddingLeft: 0, fontWeight: 500, display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <ArrowLeft size={20} /> Retour à l'accueil
                </button>
                <h1 style={{ margin: 0, fontSize: '2rem' }}>Mon Profil</h1>
            </div>

            {/* Top Stats Row */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px', marginBottom: '40px' }}>
                <StatCard
                    icon={<Trophy size={24} />}
                    label="Moyenne Globale"
                    value={`${averageAccuracy}%`}
                    iconBg="rgba(139, 92, 246, 0.2)"
                    iconColor="#8b5cf6"
                />
                <StatCard
                    icon={<Target size={24} />}
                    label="Quiz Terminés"
                    value={totalQuizzes}
                    iconBg="rgba(14, 165, 233, 0.2)"
                    iconColor="#0ea5e9"
                />
                <StatCard
                    icon={<AlertTriangle size={24} />}
                    label="Fautes à revoir"
                    value={totalMistakes}
                    subtext={`${totalMistakes} questions vous posent problème.`}
                    iconBg="rgba(239, 68, 68, 0.2)"
                    iconColor="#ef4444"
                />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: '30px', alignItems: 'start' }}>

                {/* Left Column: History */}
                <div>
                    <h2 style={{ fontSize: '1.2rem', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <Clock size={20} /> Historique récent
                    </h2>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                        {statedThemes.length === 0 ? (
                            <div className="card" style={{ padding: '30px', textAlign: 'center', background: 'var(--bg-elev)', border: 'none', color: 'var(--muted)' }}>
                                Aucun historique disponible.
                            </div>
                        ) : (
                            statedThemes.map(theme => {
                                const p = progress[theme.id];
                                const acc = p.totalQuestions > 0 ? Math.round((p.bestScore / p.totalQuestions) * 100) : 0;
                                const scoreColor = acc >= 80 ? 'var(--success)' : acc >= 50 ? 'var(--warning)' : 'var(--danger)';

                                return (
                                    <div key={theme.id} className="card" style={{
                                        padding: '20px',
                                        background: 'var(--bg-elev)',
                                        border: 'none',
                                        display: 'flex',
                                        justifyContent: 'space-between',
                                        alignItems: 'center'
                                    }}>
                                        <div>
                                            <div style={{ fontWeight: 600, fontSize: '1.1rem', marginBottom: '4px' }}>{theme.name}</div>
                                            <div style={{ color: 'var(--muted)', fontSize: '0.85rem' }}>
                                                {p.attempts} tentative{p.attempts > 1 ? 's' : ''}
                                            </div>
                                        </div>
                                        <div style={{ textAlign: 'right' }}>
                                            <div style={{ fontSize: '1.2rem', fontWeight: 700 }}>{p.bestScore}/{p.totalQuestions}</div>
                                            <div style={{ color: scoreColor, fontWeight: 600, fontSize: '0.9rem' }}>{acc}%</div>
                                        </div>
                                    </div>
                                );
                            })
                        )}
                    </div>
                </div>

                {/* Right Column: Actions */}
                <div>
                    <h2 style={{ fontSize: '1.2rem', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <BarChart2 size={20} /> Actions
                    </h2>

                    <div className="card" style={{ padding: '24px', background: 'var(--bg-elev)', border: 'none', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                        <button className="btn-primary" style={{
                            padding: '12px',
                            background: 'linear-gradient(90deg, #db2777 0%, #e11d48 100%)', // Pink gradient like screenshot
                            borderColor: 'transparent',
                            boxShadow: '0 4px 12px rgba(225, 29, 72, 0.3)'
                        }}>
                            Revoir mes fautes ({totalMistakes})
                        </button>

                        <button
                            onClick={() => {
                                if (window.confirm('Voulez-vous vraiment tout effacer ?')) {
                                    onReset();
                                }
                            }}
                            style={{
                                background: 'transparent',
                                border: 'none',
                                color: 'var(--muted)',
                                fontSize: '0.9rem',
                                cursor: 'pointer',
                                textDecoration: 'underline'
                            }}
                        >
                            Réinitialiser tout l'historique
                        </button>
                    </div>
                </div>

            </div>
        </div>
    );
};
export default Profile;
