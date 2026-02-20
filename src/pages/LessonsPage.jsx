import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import ThemeSelector from '../components/ThemeSelector';

const LessonsPage = ({ sections, progress }) => {
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
            />
        </div>
    );
};

export default LessonsPage;
