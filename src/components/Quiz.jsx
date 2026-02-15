import React, { useRef, useState } from 'react';
import { ArrowLeft } from 'lucide-react';
import QuestionCard from './QuestionCard';

const Quiz = ({ questions, themeName, onFinish, onExit, instantFeedback, autoPlayAudio, fileName }) => {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [hasAnswered, setHasAnswered] = useState(false);
  const [questionsData, setQuestionsData] = useState(questions);
  const scoreRef = useRef(0);
  const answersRef = useRef([]);

  const currentQuestion = questionsData[currentQuestionIndex];

  const handleAnswer = ({ isCorrect, userAnswer, correctAnswer, questionId }) => {
    const previousAnswer = answersRef.current[currentQuestionIndex];

    // Calculate score delta
    let scoreDelta = 0;

    if (previousAnswer) {
        // Changing answer
        if (previousAnswer.isCorrect && !isCorrect) {
            scoreDelta = -1;
        } else if (!previousAnswer.isCorrect && isCorrect) {
            scoreDelta = 1;
        }
    } else {
        // New answer
        if (isCorrect) {
            scoreDelta = 1;
        }
    }

    // Apply delta
    scoreRef.current += scoreDelta;
    setScore(scoreRef.current);

    // Update refs
    answersRef.current[currentQuestionIndex] = {
      questionId,
      userAnswer,
      correctAnswer,
      isCorrect,
    };

    setHasAnswered(true);
  };

  const handleNext = () => {
    if (currentQuestionIndex < questionsData.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
      setHasAnswered(false);
    } else {
      onFinish({ score: scoreRef.current, answers: answersRef.current });
    }
  };

  const handleQuestionUpdated = async (updatedQuestion) => {
    const newQuestions = [...questionsData];
    newQuestions[currentQuestionIndex] = updatedQuestion;
    setQuestionsData(newQuestions);
  };

  return (
    <div className="quiz">
      <div className="quiz-topbar">
        <button className="exit-btn" onClick={onExit} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <ArrowLeft size={18} /> Retour
        </button>
      </div>

      <div className="quiz-content">
        <QuestionCard
          key={`${currentQuestionIndex}-${currentQuestion?.id ?? 'q'}`}
          title={themeName}
          question={currentQuestion}
          onAnswer={handleAnswer}
          currentIndex={currentQuestionIndex}
          total={questionsData.length}
          instantFeedback={instantFeedback}
          autoPlayAudio={autoPlayAudio}
          onNext={handleNext}
          isLastQuestion={currentQuestionIndex === questionsData.length - 1}
          fileName={fileName}
          onQuestionUpdated={handleQuestionUpdated}
        />
      </div>
    </div>
  );
};

export default Quiz;
