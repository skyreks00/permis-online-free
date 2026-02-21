import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import ThemeSelector from '../components/ThemeSelector';

const LessonsPage = ({ sections, progress, showCompleted, onToggleShowCompleted }) => {
    const navigate = useNavigate();
    
    const handleSelectLesson = (lessonFile) => {
        navigate(`/cours/${encodeURIComponent(lessonFile)}`);
    };

    return (
        <div style={{ paddingBottom: '80px' }}>
            <ThemeSelector
                sections={sections}
                progress={progress}
                onSelectLesson={handleSelectLesson}
                mode="lessons"
                showCompleted={showCompleted}
                onToggleShowCompleted={onToggleShowCompleted}
            />
        </div>
    );
};

export default LessonsPage;
