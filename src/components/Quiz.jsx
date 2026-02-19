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

    // 2. Recalculate score based on points
    // Basic logic: Score = TotalQuestions - Sum(Points lost)
    // If a question has no 'points' defined, it counts as 1.
    // This maintains backward compatibility for 1-point questions while handling 5-point questions for Exams.
    
    // Calculate total deducted points
    const pointsLost = answersRef.current.reduce((acc, ans) => {
      if (!ans) return acc; // Not answered yet? shouldn't happen for processed indices
      if (ans.isCorrect) return acc;

      const question = questionsData.find(q => q.id === ans.questionId);
      const points = question?.points || 1;
      return acc + points;
    }, 0);

    // Initial max score is considered to be the number of questions (e.g., 50/50 behavior)
    // If we want "Total Points Possible" as denominator, that would be different.
    // User request implies: "49/50" -> "45/50". So Base is 50 (Total Questions).
    const newScore = Math.max(0, questionsData.length - pointsLost);

    console.log("DEBUG: newScore calculated", newScore, "Points Lost:", pointsLost);

    setScore(newScore);

    setHasAnswered(true);
  };

  const handleNext = () => {
    if (currentQuestionIndex < questionsData.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
      setHasAnswered(false);
    } else {
      // Calculate final score properly from answersRef
      const pointsLost = answersRef.current.reduce((acc, ans) => {
        if (!ans) return acc;
        if (ans.isCorrect) return acc;
        const question = questionsData.find(q => q.id === ans.questionId);
        return acc + (question?.points || 1);
      }, 0);
      
      const finalScore = Math.max(0, questionsData.length - pointsLost);
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
