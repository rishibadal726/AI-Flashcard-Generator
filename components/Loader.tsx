
import React from 'react';

const Loader: React.FC = () => {
  return (
    <div className="flex flex-col items-center justify-center text-center text-white p-8">
      <div className="relative flex justify-center items-center">
        <div className="absolute w-24 h-24 rounded-full animate-ping bg-purple-500 opacity-50"></div>
        <div className="absolute w-16 h-16 rounded-full animate-ping bg-cyan-500 opacity-50 delay-75"></div>
        <svg className="w-12 h-12 text-white animate-pulse" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 3a9 9 0 100 18 9 9 0 000-18zm0 0v6m0 0l4.243-4.243M12 9L7.757 4.757M12 9l-4.243 4.243" />
        </svg>
      </div>
      <h2 className="text-2xl font-bold mt-8 tracking-wider">AI is Working its Magic...</h2>
      <p className="text-gray-400 mt-2">Crafting your custom flashcards. This may take a moment.</p>
    </div>
  );
};

export default Loader;
