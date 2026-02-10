import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import LessonViewer from '../components/LessonViewer';

const LessonPage = ({ themeMode }) => {
    const { lessonId } = useParams();
    const navigate = useNavigate();
    // Decode the lesson ID if it was encoded
    const lessonFile = decodeURIComponent(lessonId);

    return (
        <LessonViewer
            lessonFile={lessonFile}
            onBack={() => navigate('/')}
            theme={themeMode}
        />
    );
};

export default LessonPage;
