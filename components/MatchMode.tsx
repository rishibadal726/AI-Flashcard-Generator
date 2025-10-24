// A component that provides a matching game mode for the flashcards.
import React, { useState, useEffect, useMemo } from 'react';
import type { Flashcard } from '../types';

interface MatchModeProps {
  cards: Flashcard[];
}

const MatchMode: React.FC<MatchModeProps> = ({ cards }) => {
  const [shuffledQuestions, setShuffledQuestions] = useState<string[]>([]);
  const [shuffledAnswers, setShuffledAnswers] = useState<string[]>([]);
  const [selectedQuestion, setSelectedQuestion] = useState<string | null>(null);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [matchedPairs, setMatchedPairs] = useState<Record<string, string>>({});
  const [incorrectAttempts, setIncorrectAttempts] = useState<string[]>([]);
  const [gameWon, setGameWon] = useState(false);

  const cardMap = useMemo(() => {
    const map = new Map<string, string>();
    cards.forEach(card => map.set(card.question, card.answer));
    return map;
  }, [cards]);

  const resetGame = () => {
    const questions = cards.map(c => c.question);
    const answers = cards.map(c => c.answer);

    setShuffledQuestions(questions.sort(() => Math.random() - 0.5));
    setShuffledAnswers(answers.sort(() => Math.random() - 0.5));
    setSelectedQuestion(null);
    setSelectedAnswer(null);
    setMatchedPairs({});
    setIncorrectAttempts([]);
    setGameWon(false);
  };
  
  useEffect(resetGame, [cards]);

  useEffect(() => {
    if (selectedQuestion && selectedAnswer) {
      if (cardMap.get(selectedQuestion) === selectedAnswer) {
        // Correct match
        setMatchedPairs(prev => ({ ...prev, [selectedQuestion]: selectedAnswer }));
      } else {
        // Incorrect match
        setIncorrectAttempts([selectedQuestion, selectedAnswer]);
        setTimeout(() => {
          setIncorrectAttempts([]);
        }, 1000);
      }
      setSelectedQuestion(null);
      setSelectedAnswer(null);
    }
  }, [selectedQuestion, selectedAnswer, cardMap]);
  
  useEffect(() => {
    if (cards.length > 0 && Object.keys(matchedPairs).length === cards.length) {
      setGameWon(true);
    }
  }, [matchedPairs, cards]);

  const handleSelectQuestion = (q: string) => {
    if (matchedPairs[q] || incorrectAttempts.includes(q)) return;
    setSelectedQuestion(q);
  };

  const handleSelectAnswer = (a: string) => {
    if (Object.values(matchedPairs).includes(a) || incorrectAttempts.includes(a)) return;
    setSelectedAnswer(a);
  };
  
  if (gameWon) {
    return (
        <div className="text-center text-white p-8 bg-white/10 rounded-lg">
            <h2 className="text-3xl font-bold mb-4">Congratulations!</h2>
            <p className="text-xl mb-6">You've matched all the cards!</p>
            <button
                onClick={resetGame}
                className="px-6 py-2 bg-purple-600 hover:bg-purple-700 rounded-md transition-colors"
            >
                Play Again
            </button>
        </div>
    );
  }

  const getCardClass = (item: string, type: 'q' | 'a') => {
      let base = "p-4 rounded-lg cursor-pointer transition-all duration-300 h-full flex items-center justify-center text-center";
      const isSelected = type === 'q' ? selectedQuestion === item : selectedAnswer === item;
      const isIncorrect = incorrectAttempts.includes(item);
      
      if (isIncorrect) return `${base} bg-red-500/80 scale-105 ring-2 ring-red-300`;
      if (isSelected) return `${base} bg-cyan-500/80 scale-105 ring-2 ring-cyan-300`;

      return `${base} bg-white/10 hover:bg-white/20`;
  }

  return (
    <div className="w-full max-w-4xl mx-auto text-white p-4">
      <h2 className="text-2xl font-bold text-center mb-4">Match Questions and Answers</h2>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <h3 className="text-lg font-semibold text-center mb-2">Questions</h3>
          <div className="grid gap-2 grid-cols-1 md:grid-cols-2">
            {shuffledQuestions.map((q) => (
              !matchedPairs[q] && (
                <div key={q} onClick={() => handleSelectQuestion(q)} className={getCardClass(q, 'q')}>
                  {q}
                </div>
              )
            ))}
          </div>
        </div>
        <div>
          <h3 className="text-lg font-semibold text-center mb-2">Answers</h3>
          <div className="grid gap-2 grid-cols-1 md:grid-cols-2">
            {shuffledAnswers.map((a) => (
              !Object.values(matchedPairs).includes(a) && (
                <div key={a} onClick={() => handleSelectAnswer(a)} className={getCardClass(a, 'a')}>
                  {a}
                </div>
              )
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default MatchMode;
