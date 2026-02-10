import React from 'react';
import { useNavigate } from 'react-router-dom';
import ThemeSelector from '../components/ThemeSelector';
import TopControls from '../components/TopControls';

const HomePage = ({ sections, progress, toggleTheme, isDarkMode }) => {
    const navigate = useNavigate();

    const handleSelectTheme = (theme) => {
        navigate(`/quiz/${theme.id}`);
    };

    const handleSelectLesson = (lessonFile) => {
        // Usually lessonFile is like "1_la_chaussee.html"
        // We want to pass "1_la_chaussee.html" as param
        navigate(`/lecon/${encodeURIComponent(lessonFile)}`);
    };

    return (
        <>
            <TopControls
                onOpenProfile={() => navigate('/profil')}
                toggleTheme={toggleTheme}
                isDarkMode={isDarkMode}
            />
            <ThemeSelector
                sections={sections}
                progress={progress}
                onSelectTheme={handleSelectTheme}
                onSelectLesson={handleSelectLesson}
            />
        </>
    );
};

export default HomePage;
