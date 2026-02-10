import React, { useRef, useState } from 'react';
import { ArrowLeft } from 'lucide-react';
import QuestionCard from './QuestionCard';

const Quiz = ({ questions, themeName, onFinish, onExit, instantFeedback, autoPlayAudio, fileName }) => {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [hasAnswered, setHasAnswered] = useState(false);
  const scoreRef = useRef(0);
  const answersRef = useRef([]);

  const currentQuestion = questions[currentQuestionIndex];

  const handleAnswer = ({ isCorrect, userAnswer, correctAnswer, questionId }) => {
    answersRef.current[currentQuestionIndex] = {
      questionId,
      userAnswer,
      correctAnswer,
      isCorrect,
    };

    if (isCorrect) {
      scoreRef.current += 1;
      setScore(scoreRef.current);
    }
    setHasAnswered(true);
  };

  const handleNext = () => {
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
      setHasAnswered(false);
    } else {
      onFinish({ score: scoreRef.current, answers: answersRef.current });
    }
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
          total={questions.length}
          instantFeedback={instantFeedback}
          autoPlayAudio={autoPlayAudio}
          onNext={handleNext}
          isLastQuestion={currentQuestionIndex === questions.length - 1}
          fileName={fileName}
        />
      </div>
    </div>
  );
};

export default Quiz;
