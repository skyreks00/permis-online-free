import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import ThemeSelector from '../components/ThemeSelector';
import GlobalStats from '../components/GlobalStats';
import { loadThemeQuestions } from '../utils/contentLoader';

const QuizDashboardPage = ({ sections, progress, toggleTheme, isDarkMode, onSelectTheme, showCompleted, onToggleShowCompleted }) => {
    const navigate = useNavigate();
    const [isLoadingReview, setIsLoadingReview] = useState(false);
    const [showWarningModal, setShowWarningModal] = useState(false);
    const [pendingQuizItem, setPendingQuizItem] = useState(null);

    // --- Review Logic (Moved from Profile) ---
    const getNormalizedProgress = (p) => {
        const score = p.bestScore !== undefined ? p.bestScore : (p.score || 0);
        const total = p.totalQuestions !== undefined ? p.totalQuestions : (p.total || 0);
        return { score, total };
    };

    const handleReviewAll = async () => {
        setIsLoadingReview(true);
        try {
            const allErrors = [];
            
            const statedThemes = (sections || [])
                .flatMap(section => section.items || section.themes || [])
                .filter(t => t && t.id && t.id !== 'metadata' && progress[t.id]);

            const themesToReview = statedThemes.filter(t => {
                const { score, total } = getNormalizedProgress(progress[t.id]);
                return score < total;
            });

            if (themesToReview.length === 0) {
                alert("Aucune faute à réviser !");
                setIsLoadingReview(false);
                return;
            }

            for (const theme of themesToReview) {
                 let questions = [];
                try {
                    const data = await loadThemeQuestions(theme.file);
                    questions = data.questions || [];
                } catch (e) {
                    const res = await fetch(`data/${theme.file}`);
                    const json = await res.json();
                    questions = json.questions || [];
                }

                const p = progress[theme.id];
                const savedAnswers = p.answers || [];

                if (savedAnswers.length > 0) {
                     savedAnswers.forEach((ans) => {
                        if (ans && ans.isCorrect === false) {
                            const q = questions.find(q => q.id == ans.questionId);
                            if (q) {
                                allErrors.push({ 
                                    ...q,
                                    originalThemeId: theme.id,
                                    sourceFile: theme.file 
                                });
                            }
                        }
                    });
                }
            }

            if (allErrors.length === 0) {
                alert("Aucune erreur trouvée dans les sauvegardes.");
                return;
            }

            navigate('/quiz/review', {
                state: {
                    questions: allErrors,
                    title: "Révision des fautes (Global)",
                    isReview: true
                }
            });

        } catch(e) {
            console.error(e);
            alert("Erreur lors de la préparation de la révision globale.");
        } finally {
             setIsLoadingReview(false);
        }
    };

    if (isLoadingReview) {
        return <div className="page container flex items-center justify-center h-screen">Chargement de la révision...</div>;
    }

    const handleThemeSelect = (item) => {
        // Examen B is handled on its own dedicated page (do not run it inside Quiz routes).
        if (item?.id === 'examen_B') {
            navigate('/examen-b');
            return;
        }

        // Check if lesson is read
        const isRead = progress[item.id]?.read;
        const hasLesson = item.lessonFile || (item.file && item.file.replace('.json', '.html')); 
        
        if (hasLesson && !isRead && !(item.id === 'examen_B' || item.id === 'permis_B_complet')) {
             setPendingQuizItem(item);
             setShowWarningModal(true);
             return;
        }
        navigate(`/quiz/${item.id}`);
    };

    const confirmStartQuiz = () => {
        if (pendingQuizItem) {
            navigate(`/quiz/${pendingQuizItem.id}`);
            setShowWarningModal(false);
            setPendingQuizItem(null);
        }
    };

    const goToLesson = () => {
        if (pendingQuizItem) {
             const file = pendingQuizItem.lessonFile || pendingQuizItem.file.replace('.json', '.html');
             navigate(`/cours/${encodeURIComponent(file)}`);
             setShowWarningModal(false);
             setPendingQuizItem(null);
        }
    };

    return (
        <div style={{ paddingBottom: '80px' }}>
            <div className="container" style={{ marginTop: '76px', marginBottom: 0, paddingBottom: 0 }}>
                <GlobalStats 
                    progress={progress} 
                    themesData={{ sections }} 
                    onReviewAll={handleReviewAll}
                    includeExamenBMistakes={false}
                />
            </div>
            
            <ThemeSelector
                sections={sections}
                progress={progress}
                onSelectTheme={handleThemeSelect}
                onSelectLesson={(lessonFile) => navigate(`/cours/${encodeURIComponent(lessonFile)}`)}
                mode="quiz"
                showCompleted={showCompleted}
                onToggleShowCompleted={onToggleShowCompleted}
            />

            {/* CUSTOM WARNING MODAL */}
            {showWarningModal && (
                <div style={{
                    position: 'fixed',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    backgroundColor: 'rgba(0,0,0,0.7)',
                    zIndex: 9999,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: '20px',
                    backdropFilter: 'blur(5px)'
                }} onClick={() => setShowWarningModal(false)}>
                    <div style={{
                        backgroundColor: 'var(--surface)',
                        borderRadius: '16px',
                        padding: '24px',
                        maxWidth: '400px',
                        width: '100%',
                        boxShadow: '0 10px 25px rgba(0,0,0,0.2)',
                        border: '1px solid var(--border)',
                        animation: 'scaleIn 0.2s ease-out'
                    }} onClick={e => e.stopPropagation()}>
                        <h3 style={{ marginTop: 0, fontSize: '1.25rem', display: 'flex', alignItems: 'center', gap: '10px' }}>
                            ⚠️ Leçon non terminée
                        </h3>
                        <p style={{ color: 'var(--muted)', lineHeight: '1.5', margin: '16px 0 24px' }}>
                            Vous n'avez pas encore marqué la leçon associée comme lue. Il est recommandé de la lire avant de faire le quiz.
                        </p>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                            <button 
                                onClick={goToLesson}
                                className="btn-primary"
                                style={{ width: '100%', justifyContent: 'center' }}
                            >
                                📖 Aller à la leçon
                            </button>
                            <button 
                                onClick={confirmStartQuiz}
                                className="btn-ghost"
                                style={{ width: '100%', justifyContent: 'center', border: '1px solid var(--border)' }}
                            >
                                Lancer le quiz quand même
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default QuizDashboardPage;
