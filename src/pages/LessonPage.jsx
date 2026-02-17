import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import LessonViewer from '../components/LessonViewer';

const LessonPage = ({ themeMode, sections }) => {
    const { lessonId } = useParams();
    const navigate = useNavigate();
    // Decode the lesson ID if it was encoded
    const lessonFile = decodeURIComponent(lessonId);

    // Find the thumb/item that matches this lesson file
    const matchingTheme = React.useMemo(() => {
        if (!sections) return null;
        for (const section of sections) {
            const item = section.items.find(i => 
                i.lessonFile === lessonFile || 
                (i.file && i.file.replace('.json', '.html') === lessonFile)
            );
            if (item) return item;
        }
        return null;
    }, [sections, lessonFile]);

    return (
        <LessonViewer
            lessonFile={lessonFile}
            quizId={matchingTheme?.file ? matchingTheme.id : null}
            onBack={() => navigate('/')}
            onStartQuiz={(id) => navigate(`/quiz/${id}`)}
            theme={themeMode}
        />
    );
};

export default LessonPage;
