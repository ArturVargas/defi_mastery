
import React from 'react';
import { QuizCategory } from '../types';

interface QuizCardProps {
  category: QuizCategory;
  onStart: (id: string) => void;
}

const QuizCard: React.FC<QuizCardProps> = ({ category, onStart }) => {
  return (
    <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 transition-all hover:border-blue-500 hover:shadow-[0_0_20px_rgba(59,130,246,0.2)] group">
      <h3 className="text-xl font-bold text-white mb-2 group-hover:text-blue-400">{category.title}</h3>
      <p className="text-gray-400 text-sm mb-6 leading-relaxed">
        {category.description}
      </p>
      <div className="flex items-center justify-between">
        <span className="text-xs font-mono text-gray-500 uppercase tracking-widest">{category.questions.length} Questions</span>
        <button
          onClick={() => onStart(category.id)}
          className="bg-blue-600 hover:bg-blue-500 text-white px-5 py-2 rounded-lg font-medium text-sm transition-colors"
        >
          Start Quiz
        </button>
      </div>
    </div>
  );
};

export default QuizCard;
