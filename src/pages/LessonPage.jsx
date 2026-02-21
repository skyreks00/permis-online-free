import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import LessonViewer from '../components/LessonViewer';

const LessonPage = ({ themeMode, sections, onMarkRead, progress }) => {
    const params = useParams();
    const lessonId = params["*"];
    const navigate = useNavigate();
    const lessonFile = decodeURIComponent(lessonId);

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

    const isRead = matchingTheme ? progress?.[matchingTheme.id]?.read === true : false;
    const quizDone = matchingTheme?.file ? progress?.[matchingTheme.id]?.score !== undefined : false;

    return (
        <LessonViewer
            lessonFile={lessonFile}
            lessonId={matchingTheme?.id}
            quizId={matchingTheme?.file ? matchingTheme.id : null}
            isRead={isRead}
            quizDone={quizDone}
            onBack={() => navigate(-1)}
            onStartQuiz={(id) => navigate(`/quiz/${id}`)}
            onOpenLesson={(file) => navigate(`/cours/${encodeURIComponent(file)}`)}
            onMarkRead={(id) => { if(onMarkRead) onMarkRead(id); }}
            theme={themeMode}
        />
    );
};

export default LessonPage;
