import React, { useState, useEffect } from 'react';
import type { Flashcard } from '../types';
import { EditIcon } from './IconComponents';

interface FlashcardProps {
  card: Flashcard;
  onUpdate: (updatedCard: Flashcard) => void;
}

const FlashcardComponent: React.FC<FlashcardProps> = ({ card, onUpdate }) => {
  const [isFlipped, setIsFlipped] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editedQuestion, setEditedQuestion] = useState(card.question);
  const [editedAnswer, setEditedAnswer] = useState(card.answer);

  useEffect(() => {
    setEditedQuestion(card.question);
    setEditedAnswer(card.answer);
    setIsFlipped(false);
    setIsEditing(false);
  }, [card]);

  const handleFlip = (e: React.MouseEvent) => {
    // Prevent flipping when clicking on form elements during editing
    if (e.target instanceof HTMLTextAreaElement || e.target instanceof HTMLButtonElement) {
        return;
    }
    if (!isEditing) {
        setIsFlipped(!isFlipped);
    }
  };

  const handleSave = () => {
    onUpdate({ question: editedQuestion, answer: editedAnswer });
    setIsEditing(false);
  };

  const CardFace = ({ side, children }: {side: 'front' | 'back', children: React.ReactNode}) => (
     <div className={`absolute w-full h-full backface-hidden flex items-center justify-center p-6 bg-white/10 dark:bg-white/10 backdrop-blur-lg rounded-2xl border border-white/20 dark:border-white/20 shadow-lg bg-gray-200 dark:bg-gray-800 text-gray-800 dark:text-white ${side === 'back' ? 'rotate-y-180' : ''}`}>
        {children}
     </div>
  );

  return (
    <div className="w-full h-full perspective-1000" onClick={handleFlip}>
      <div 
        className={`relative w-full h-full transition-transform duration-700 transform-style-3d ${isFlipped ? 'rotate-y-180' : ''}`}
      >
        {/* Front of the card */}
        <CardFace side="front">
          <div className="text-center w-full">
            <p className="text-xs text-cyan-500 dark:text-cyan-300 font-semibold mb-4">QUESTION</p>
            {isEditing ? (
              <textarea 
                value={editedQuestion} 
                onChange={(e) => setEditedQuestion(e.target.value)}
                className="w-full h-32 bg-transparent text-center text-xl md:text-2xl font-bold border-0 focus:ring-0 resize-none text-gray-800 dark:text-white"
              />
            ) : (
              <p className="text-xl md:text-2xl font-bold">{card.question}</p>
            )}
          </div>
          {!isFlipped && (
            <button onClick={() => setIsEditing(!isEditing)} className="absolute top-4 right-4 p-2 rounded-full hover:bg-black/10 dark:hover:bg-white/10 transition-colors">
              {!isEditing && <EditIcon />}
            </button>
          )}
        </CardFace>

        {/* Back of the card */}
        <CardFace side="back">
          <div className="text-center w-full">
            <p className="text-xs text-purple-500 dark:text-purple-300 font-semibold mb-4">ANSWER</p>
            {isEditing ? (
              <>
                <textarea 
                  value={editedAnswer} 
                  onChange={(e) => setEditedAnswer(e.target.value)}
                  className="w-full h-32 bg-transparent text-center text-lg md:text-xl font-medium border-0 focus:ring-0 resize-none text-gray-800 dark:text-white"
                />
                <div className="mt-4 flex gap-2 justify-center">
                    <button onClick={handleSave} className="px-4 py-1 text-sm rounded-md bg-green-500 text-white hover:bg-green-600">Save</button>
                    <button onClick={() => setIsEditing(false)} className="px-4 py-1 text-sm rounded-md bg-gray-500 text-white hover:bg-gray-600">Cancel</button>
                </div>
              </>
            ) : (
              <p className="text-lg md:text-xl font-medium">{card.answer}</p>
            )}
          </div>
        </CardFace>
      </div>
    </div>
  );
};

// Add custom CSS for 3D transform properties
const style = document.createElement('style');
style.innerHTML = `
  .perspective-1000 { perspective: 1000px; }
  .transform-style-3d { transform-style: preserve-3d; }
  .rotate-y-180 { transform: rotateY(180deg); }
  .backface-hidden { backface-visibility: hidden; }
`;
document.head.appendChild(style);

export default FlashcardComponent;