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

  // Keyboard shortcut: Enter to go to next question
  React.useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Enter' && hasAnswered) {
        handleNext();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [hasAnswered, currentQuestionIndex]); // Depend on hasAnswered to know when it's safe to skip

  const currentQuestion = questionsData[currentQuestionIndex];

  const handleAnswer = ({ isCorrect, userAnswer, correctAnswer, questionId }) => {
    console.log("DEBUG: handleAnswer called", { currentQuestionIndex, questionId, isCorrect });

    // 1. Update the answer in the ref
    answersRef.current[currentQuestionIndex] = {
      questionId,
      userAnswer,
      correctAnswer,
      isCorrect,
    };

    console.log("DEBUG: answersRef updated", JSON.stringify(answersRef.current));

    // 2. Recalculate score entirely from the current answers state
    const newScore = answersRef.current.filter(a => a && a.isCorrect).length;
    console.log("DEBUG: newScore calculated", newScore);

    setScore(newScore);

    setHasAnswered(true);
  };

  const handleNext = () => {
    if (currentQuestionIndex < questionsData.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
      setHasAnswered(false);
    } else {
      // Calculate final score properly from answersRef
      const finalScore = answersRef.current.filter(a => a && a.isCorrect).length;
      onFinish({ score: finalScore, answers: answersRef.current });
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
