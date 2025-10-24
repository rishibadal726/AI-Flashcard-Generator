// A component that provides a testing mode for the flashcards.
import React, { useState, useEffect, useMemo } from 'react';
import type { Flashcard } from '../types';

interface TestModeProps {
  cards: Flashcard[];
}

const TestMode: React.FC<TestModeProps> = ({ cards }) => {
  const [shuffledCards, setShuffledCards] = useState<Flashcard[]>([]);
  const [currentCardIndex, setCurrentCardIndex] = useState(0);
  const [userAnswer, setUserAnswer] = useState('');
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);
  const [showAnswer, setShowAnswer] = useState(false);
  const [score, setScore] = useState(0);
  const [testFinished, setTestFinished] = useState(false);

  useEffect(() => {
    // Shuffle cards when the component mounts or cards prop changes
    setShuffledCards([...cards].sort(() => Math.random() - 0.5));
    setCurrentCardIndex(0);
    setUserAnswer('');
    setIsCorrect(null);
    setShowAnswer(false);
    setScore(0);
    setTestFinished(false);
  }, [cards]);

  const currentCard = useMemo(() => shuffledCards[currentCardIndex], [shuffledCards, currentCardIndex]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!userAnswer.trim()) return;

    const correctAnswer = currentCard.answer.trim().toLowerCase();
    const userAnswerClean = userAnswer.trim().toLowerCase();
    
    const correct = correctAnswer === userAnswerClean;
    setIsCorrect(correct);
    if (correct) {
      setScore(s => s + 1);
    }
    setShowAnswer(true);
  };

  const handleNext = () => {
    if (currentCardIndex < shuffledCards.length - 1) {
      setCurrentCardIndex(i => i + 1);
      setUserAnswer('');
      setIsCorrect(null);
      setShowAnswer(false);
    } else {
      setTestFinished(true);
    }
  };

  const handleRestart = () => {
     // Re-shuffle and reset
     setShuffledCards([...cards].sort(() => Math.random() - 0.5));
     setCurrentCardIndex(0);
     setUserAnswer('');
     setIsCorrect(null);
     setShowAnswer(false);
     setScore(0);
     setTestFinished(false);
  };
  
  if (shuffledCards.length === 0) {
    return <div className="text-white text-center p-8">No cards to test.</div>;
  }
  
  if (testFinished) {
    return (
        <div className="text-center text-white p-8 bg-white/10 rounded-lg">
            <h2 className="text-3xl font-bold mb-4">Test Complete!</h2>
            <p className="text-xl mb-6">Your score: {score} / {shuffledCards.length}</p>
            <button
                onClick={handleRestart}
                className="px-6 py-2 bg-purple-600 hover:bg-purple-700 rounded-md transition-colors"
            >
                Restart Test
            </button>
        </div>
    );
  }

  return (
    <div className="w-full max-w-2xl mx-auto text-white p-4">
      <div className="bg-white/10 backdrop-blur-lg rounded-xl p-6 shadow-lg">
        <div className="text-sm text-gray-300 mb-2">Question {currentCardIndex + 1} of {shuffledCards.length}</div>
        <p className="text-xl font-semibold mb-4">{currentCard?.question}</p>
        
        <form onSubmit={handleSubmit}>
          <textarea
            value={userAnswer}
            onChange={(e) => setUserAnswer(e.target.value)}
            placeholder="Your answer..."
            className="w-full h-24 p-2 bg-black/20 rounded-md focus:ring-2 focus:ring-cyan-400 outline-none resize-none"
            disabled={showAnswer}
          />
          {!showAnswer && (
            <button
              type="submit"
              className="mt-4 w-full py-2 bg-cyan-500 hover:bg-cyan-600 rounded-md font-bold transition-colors"
            >
              Check Answer
            </button>
          )}
        </form>

        {showAnswer && (
          <div className="mt-4 p-4 rounded-md" style={{ backgroundColor: isCorrect ? 'rgba(4, 120, 87, 0.5)' : 'rgba(153, 27, 27, 0.5)' }}>
            <p className="font-bold text-lg mb-2">{isCorrect ? 'Correct!' : 'Incorrect'}</p>
            {!isCorrect && <p className="mb-2"><strong>Your answer:</strong> {userAnswer}</p>}
            <p><strong>Correct answer:</strong> {currentCard.answer}</p>
            <button
              onClick={handleNext}
              className="mt-4 w-full py-2 bg-purple-600 hover:bg-purple-700 rounded-md font-bold transition-colors"
            >
              {currentCardIndex < shuffledCards.length - 1 ? 'Next Question' : 'Finish Test'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default TestMode;
