
import React, { useState, useEffect, useCallback } from 'react';
import { QuizCategory, QuizStatus } from './types';
import QuizCard from './components/QuizCard';
import ProgressBar from './components/ProgressBar';

const QUESTION_TIMEOUT = 25; // seconds

const App: React.FC = () => {
  const [quizData, setQuizData] = useState<QuizCategory[]>([]);
  const [currentCategoryId, setCurrentCategoryId] = useState<string | null>(null);
  const [status, setStatus] = useState<QuizStatus>('idle');
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [userAnswers, setUserAnswers] = useState<number[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [isConfirmed, setIsConfirmed] = useState(false);
  
  // Anti-cheat states
  const [timeLeft, setTimeLeft] = useState(QUESTION_TIMEOUT);
  const [cheatingDetected, setCheatingDetected] = useState(false);

  useEffect(() => {
    fetch('./data/quizzes.json')
      .then(res => res.json())
      .then(data => {
        setQuizData(data);
        setLoading(false);
      })
      .catch(err => {
        console.error("Failed to load quiz data:", err);
        setLoading(false);
      });
  }, []);

  // Detection: Tab Switching
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden && status === 'in-progress') {
        setCheatingDetected(true);
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [status]);

  // Question Timer
  useEffect(() => {
    let timer: number;
    if (status === 'in-progress' && !isConfirmed && !cheatingDetected) {
      timer = window.setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            handleConfirmAnswer(); // Auto-confirm if time runs out
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [status, isConfirmed, cheatingDetected, currentQuestionIndex]);

  const currentCategory = quizData.find(c => c.id === currentCategoryId);
  const currentQuestion = currentCategory?.questions[currentQuestionIndex];

  const handleStartQuiz = (id: string) => {
    setCurrentCategoryId(id);
    setStatus('in-progress');
    setCurrentQuestionIndex(0);
    setUserAnswers([]);
    setSelectedOption(null);
    setIsConfirmed(false);
    setTimeLeft(QUESTION_TIMEOUT);
    setCheatingDetected(false);
  };

  const handleSelectOption = (idx: number) => {
    if (isConfirmed || cheatingDetected) return;
    setSelectedOption(idx);
  };

  const handleConfirmAnswer = useCallback(() => {
    if (isConfirmed) return;
    setIsConfirmed(true);
  }, [isConfirmed]);

  const handleNextQuestion = () => {
    const nextAnswers = [...userAnswers, selectedOption ?? -1]; // -1 for timeout
    setUserAnswers(nextAnswers);
    setSelectedOption(null);
    setIsConfirmed(false);
    setTimeLeft(QUESTION_TIMEOUT);

    if (currentCategory && currentQuestionIndex < currentCategory.questions.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
    } else {
      setStatus('completed');
    }
  };

  const calculateScore = () => {
    if (!currentCategory) return 0;
    return userAnswers.reduce((acc, answer, idx) => {
      return acc + (answer === currentCategory.questions[idx].correctAnswerIndex ? 1 : 0);
    }, 0);
  };

  const reset = () => {
    setStatus('idle');
    setCurrentCategoryId(null);
    setCurrentQuestionIndex(0);
    setUserAnswers([]);
    setSelectedOption(null);
    setIsConfirmed(false);
    setCheatingDetected(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  const score = calculateScore();
  const isPassed = score >= 3;

  return (
    <div className={`max-w-5xl mx-auto px-4 py-12 md:py-16 ${status === 'in-progress' ? 'select-none' : ''}`} 
         onContextMenu={(e) => status === 'in-progress' && e.preventDefault()}>
      
      <header className="mb-16 text-center">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-blue-500/10 border border-blue-500/20 text-blue-400 rounded-full text-xs font-bold uppercase tracking-widest mb-6 shadow-sm">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500"></span>
          </span>
          DeFi Intelligence Hub
        </div>
        <h1 className="text-5xl md:text-6xl font-extrabold mb-6 tracking-tight">
          <span className="bg-clip-text text-transparent bg-gradient-to-b from-white to-gray-500">
            Protocol Assessment
          </span>
        </h1>
        <p className="text-gray-400 text-lg max-w-2xl mx-auto leading-relaxed">
          The environment is secured. Timer active. No tab switching allowed.
        </p>
      </header>

      <main className="relative min-h-[500px]">
        {cheatingDetected && status === 'in-progress' && (
          <div className="max-w-2xl mx-auto bg-rose-950/40 backdrop-blur-xl border border-rose-500/50 rounded-[2.5rem] p-12 text-center shadow-2xl animate-in fade-in zoom-in duration-300">
            <h2 className="text-3xl font-black text-rose-400 mb-4">Security Violation</h2>
            <p className="text-rose-200/70 mb-8 leading-relaxed">
              Assessment integrity compromised. Tab switching or window blur detected. AI assistance is strictly prohibited.
            </p>
            <button 
              onClick={reset}
              className="bg-rose-500 text-white px-8 py-3 rounded-xl font-bold hover:bg-rose-400 transition-all shadow-lg shadow-rose-500/20"
            >
              Restart & Re-verify
            </button>
          </div>
        )}

        {status === 'idle' && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 animate-in fade-in slide-in-from-bottom-4 duration-1000">
            {quizData.map(category => (
              <QuizCard 
                key={category.id} 
                category={category} 
                onStart={handleStartQuiz} 
              />
            ))}
          </div>
        )}

        {status === 'in-progress' && !cheatingDetected && currentCategory && currentQuestion && (
          <div className="max-w-2xl mx-auto bg-gray-900/50 backdrop-blur-xl border border-white/10 rounded-[2.5rem] p-8 md:p-12 shadow-2xl relative overflow-hidden">
            <div className={`absolute top-0 right-0 h-1 bg-blue-500 transition-all duration-1000`} style={{ width: `${(timeLeft / QUESTION_TIMEOUT) * 100}%` }} />
            
            <div className="flex justify-between items-center mb-10 relative z-10">
              <div className="flex flex-col">
                <span className="text-blue-400 font-mono text-xs font-bold tracking-tighter mb-1 uppercase tracking-widest">{currentCategory.title}</span>
                <span className="text-gray-500 text-xs font-medium uppercase tracking-widest">Q{currentQuestionIndex + 1} • {timeLeft}s remaining</span>
              </div>
              <button onClick={reset} className="text-gray-500 hover:text-rose-400 text-[10px] font-black uppercase tracking-widest transition-colors">Abort Test</button>
            </div>

            <div className="mb-10">
              <ProgressBar current={currentQuestionIndex + 1} total={5} />
            </div>

            <div className="mb-12 relative z-10">
              <h2 className="text-2xl md:text-3xl font-bold text-white leading-tight mb-8 pointer-events-none">
                {currentQuestion.text}
              </h2>
              
              <div className="grid grid-cols-1 gap-4">
                {currentQuestion.options.map((option, idx) => {
                  const isCorrect = idx === currentQuestion.correctAnswerIndex;
                  const isUserSelected = idx === selectedOption;
                  
                  let buttonClass = "w-full text-left p-6 rounded-2xl border transition-all group relative overflow-hidden flex items-center gap-4 ";
                  
                  if (isConfirmed) {
                    if (isCorrect) buttonClass += "bg-emerald-500/20 border-emerald-500/50 text-emerald-100";
                    else if (isUserSelected) buttonClass += "bg-rose-500/20 border-rose-500/50 text-rose-100";
                    else buttonClass += "bg-white/[0.02] border-white/5 opacity-50";
                  } else {
                    if (isUserSelected) buttonClass += "bg-blue-500/20 border-blue-500 text-blue-100";
                    else buttonClass += "bg-white/[0.03] border-white/5 text-gray-300 hover:bg-white/[0.08] hover:border-gray-500";
                  }

                  return (
                    <button
                      key={idx}
                      disabled={isConfirmed}
                      onClick={() => handleSelectOption(idx)}
                      className={buttonClass}
                    >
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-mono transition-colors ${
                        isConfirmed && isCorrect ? 'bg-emerald-500 text-white' : 
                        isConfirmed && isUserSelected && !isCorrect ? 'bg-rose-500 text-white' :
                        isUserSelected ? 'bg-blue-500 text-white' : 'bg-white/5 text-gray-500 group-hover:bg-white/10'
                      }`}>
                        {String.fromCharCode(65 + idx)}
                      </div>
                      <span className="flex-1 text-sm md:text-base font-medium pointer-events-none">
                        {option}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="mt-8 relative z-10 flex justify-end">
              {!isConfirmed ? (
                <button
                  disabled={selectedOption === null && timeLeft > 0}
                  onClick={handleConfirmAnswer}
                  className={`px-8 py-3 rounded-xl font-bold transition-all transform active:scale-95 ${
                    selectedOption !== null 
                      ? 'bg-blue-600 text-white hover:bg-blue-500' 
                      : 'bg-gray-800 text-gray-500 cursor-not-allowed'
                  }`}
                >
                  Confirm Selection
                </button>
              ) : (
                <button
                  onClick={handleNextQuestion}
                  className="px-8 py-3 bg-white text-black rounded-xl font-bold hover:bg-gray-200 transition-all transform active:scale-95 shadow-lg flex items-center gap-2"
                >
                  {currentQuestionIndex === 4 ? 'See Results' : 'Next Question'}
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3"></path></svg>
                </button>
              )}
            </div>
          </div>
        )}

        {status === 'completed' && currentCategory && (
          <div className="max-w-2xl mx-auto bg-gray-900/80 backdrop-blur-2xl border border-white/10 rounded-[3rem] p-10 md:p-16 shadow-2xl text-center animate-in zoom-in-95 duration-500">
            <div className={`w-24 h-24 mx-auto rounded-[2rem] flex items-center justify-center mb-8 rotate-3 ${isPassed ? 'bg-blue-500/20 text-blue-400 shadow-[0_0_30px_rgba(59,130,246,0.2)]' : 'bg-rose-500/20 text-rose-400'}`}>
              {isPassed ? (
                <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"></path></svg>
              ) : (
                <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path></svg>
              )}
            </div>
            
            <h2 className="text-4xl font-black text-white mb-4">
              {isPassed ? 'Subject Mastered' : 'Assessment Failed'}
            </h2>
            <p className="text-gray-400 text-lg mb-12">
              Final score: <span className={`font-bold ${isPassed ? 'text-blue-400' : 'text-rose-400'}`}>{score}/5</span>. 
              {isPassed ? ` You have successfully unlocked the vault for ${currentCategory.title}.` : ` You need at least 3 correct answers to view the secret word.`}
            </p>

            {isPassed ? (
              <div className="group relative mb-12">
                <div className="absolute -inset-1 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-3xl blur opacity-25 group-hover:opacity-50 transition duration-1000 group-hover:duration-200"></div>
                <a 
                  href="https://getunsub.xyz" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="block relative bg-black rounded-2xl p-8 border border-white/10 hover:border-blue-500/50 transition-colors"
                >
                  <p className="text-blue-400 text-[10px] font-black uppercase tracking-[0.3em] mb-4">Click to claim Restricted Access</p>
                  <div className="font-mono text-2xl md:text-3xl text-white break-all tracking-tighter hover:text-blue-400 transition-colors">
                    {currentCategory.secretWord}
                  </div>
                  <div className="mt-6 pt-6 border-t border-white/5 flex items-center justify-center gap-3 text-gray-500 text-xs font-medium">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"></path></svg>
                    Visit getunsub.xyz
                  </div>
                </a>
              </div>
            ) : (
              <div className="flex flex-col gap-4 mb-12">
                <button 
                  onClick={() => handleStartQuiz(currentCategory.id)}
                  className="w-full bg-white text-black py-4 rounded-2xl font-bold hover:bg-gray-200 transition-all transform active:scale-95"
                >
                  Restart Assessment
                </button>
              </div>
            )}

            <button 
              onClick={reset}
              className="px-8 py-3 bg-white/5 border border-white/10 rounded-xl text-gray-300 hover:text-white hover:bg-white/10 font-bold transition-all"
            >
              Return to Hub
            </button>
          </div>
        )}
      </main>

      <footer className="mt-32 border-t border-white/5 pt-12 text-center">
        <div className="flex justify-center gap-8 mb-6">
          <div className="flex flex-col items-center">
            <span className="text-white font-bold text-xl">{quizData.length}</span>
            <span className="text-gray-500 text-[10px] uppercase font-bold tracking-widest">Protocols</span>
          </div>
          <div className="w-px h-8 bg-white/10 self-center"></div>
          <div className="flex flex-col items-center">
            <span className="text-white font-bold text-xl">{quizData.reduce((acc, c) => acc + c.questions.length, 0)}</span>
            <span className="text-gray-500 text-[10px] uppercase font-bold tracking-widest">Questions</span>
          </div>
          <div className="w-px h-8 bg-white/10 self-center"></div>
          <div className="flex flex-col items-center">
            <span className="text-white font-bold text-xl">Secured</span>
            <span className="text-gray-500 text-[10px] uppercase font-bold tracking-widest">Anti-AI</span>
          </div>
        </div>
        <p className="text-gray-600 text-sm font-medium">
          DeFi Academy &copy; 2025. Verify your knowledge. Secure the protocols.
        </p>
      </footer>
    </div>
  );
};

export default App;
