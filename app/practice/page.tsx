'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Trophy, Target, Zap, RotateCcw, Clock } from 'lucide-react';
import { cn } from '@/lib/utils';
import easy from '@/data/easy_words.json';
import medium from '@/data/medium_words.json';
import hard from '@/data/hard_words.json';

const DIFFICULTY_CONFIG = {
  Easy: {
    gradient: 'from-emerald-400 via-teal-500 to-cyan-500',
    shadowColor: 'shadow-emerald-500/30',
    glowColor: 'shadow-emerald-500/50',
    description: '4-5 letters',
    icon: '🌱',
    bgGradient: 'from-emerald-500/20 to-teal-500/20',
    accentColor: 'text-emerald-400',
    borderColor: 'border-emerald-400/30',
    duration: 10000, // time limit in ms
  },
  Medium: {
    gradient: 'from-amber-400 via-orange-500 to-red-500',
    shadowColor: 'shadow-amber-500/30',
    glowColor: 'shadow-amber-500/50',
    description: '6-8 letters',
    icon: '🔥',
    bgGradient: 'from-amber-500/20 to-orange-500/20',
    accentColor: 'text-amber-400',
    borderColor: 'border-amber-400/30',
    duration: 5000,
  },
  Hard: {
    gradient: 'from-purple-400 via-pink-500 to-red-500',
    shadowColor: 'shadow-purple-500/30',
    glowColor: 'shadow-purple-500/50',
    description: '9+ letters',
    icon: '⚡',
    bgGradient: 'from-purple-500/20 to-pink-500/20',
    accentColor: 'text-purple-400',
    borderColor: 'border-purple-400/30',
    duration: 5000,
  },
};

export default function PracticeMode() {
  const wordList = { easy, medium, hard };
  const [words, setWords] = useState<string[]>([]);
  const [usedWords, setUsedWords] = useState<string[]>([]);
  const [currentWord, setCurrentWord] = useState<string | null>(null);
  const [input, setInput] = useState('');
  const [difficulty, setDifficulty] = useState<
    'Easy' | 'Medium' | 'Hard' | null
  >(null);
  const [progress, setProgress] = useState(100);
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const [countdown, setCountdown] = useState<number | null>(null);
  const [totalKeystrokes, setTotalKeystrokes] = useState(0);
  const [correctKeystrokes, setCorrectKeystrokes] = useState(0);
  const [showSuccess, setShowSuccess] = useState(false);
  const [wpm, setWpm] = useState(0);
  const [startTime, setStartTime] = useState<number | null>(null);

  const correctAudio = useRef<HTMLAudioElement | null>(null);
  const failAudio = useRef<HTMLAudioElement | null>(null);

  // Load sounds
  useEffect(() => {
    correctAudio.current = new Audio('/assets/media/correct.mp3');
    failAudio.current = new Audio('/assets/media/fail.mp3');
  }, []);

  // Load high score
  useEffect(() => {
    if (difficulty) {
      const stored = localStorage.getItem(`typeBlitzHighScore_${difficulty}`);
      if (stored) setHighScore(Number.parseInt(stored));
    }
  }, [difficulty]);

  // Countdown before game
  useEffect(() => {
    if (difficulty) {
      setCountdown(3);
      const countdownInterval = setInterval(() => {
        setCountdown((prev) => {
          if (prev === null || prev === 1) {
            clearInterval(countdownInterval);
            initGame();
            return null;
          }
          return prev - 1;
        });
      }, 1000);
    }
  }, [difficulty]);

  const initGame = async () => {
    const wordsForDifficulty =
      wordList[difficulty!.toLowerCase() as keyof typeof wordList];
    setWords(wordsForDifficulty);
    const random = getRandomWord(wordsForDifficulty, []);
    setCurrentWord(random);
    setUsedWords([random]);
    setInput('');
    setScore(0);
    setTotalKeystrokes(0);
    setCorrectKeystrokes(0);
    setProgress(100);
    setGameOver(false);
    setStartTime(Date.now());
    setWpm(0);
  };

  const getRandomWord = (list: string[], exclude: string[]) => {
    const filtered = list.filter((w) => !exclude.includes(w));
    if (filtered.length === 0) return '';
    return filtered[Math.floor(Math.random() * filtered.length)];
  };

  const calculateWPM = useCallback(() => {
    if (!startTime) return 0;
    const timeElapsed = (Date.now() - startTime) / 1000 / 60; // minutes
    const wordsTyped = score;
    return Math.round(wordsTyped / timeElapsed) || 0;
  }, [startTime, score]);

  const changeCurrentWord = useCallback(() => {
    const next = getRandomWord(words, usedWords);
    if (next) {
      setInput('');
      setCurrentWord(next);
      setUsedWords((prev) => [...prev, next]);
      setProgress(100);
      setWpm(calculateWPM());
    } else {
      setGameOver(true);
      setCurrentWord(null);
      setWpm(calculateWPM());
    }
  }, [usedWords, words, calculateWPM]);

  const onKeydown = (e: KeyboardEvent) => {
    if (gameOver || countdown !== null || !currentWord) return;
    if (['Shift', 'Tab', 'Enter', 'Space'].includes(e.key)) return;

    if (e.key === 'Backspace') {
      setInput((prev) => prev.slice(0, -1));
      return;
    }

    const isLetter = /^[a-zA-Z]$/.test(e.key);
    if (!isLetter) return;

    setInput((prev) => {
      if (prev.length >= currentWord.length) return prev;

      setTotalKeystrokes((k) => k + 1);
      const newInput = prev + e.key;

      if (newInput[newInput.length - 1] === currentWord[prev.length]) {
        setCorrectKeystrokes((k) => k + 1);
      } else {
        failAudio.current?.play();
      }

      if (newInput === currentWord) {
        correctAudio.current?.play();
        setShowSuccess(true);
        setTimeout(() => setShowSuccess(false), 800);
        setScore((s) => {
          const newScore = s + 1;
          if (newScore > highScore) {
            setHighScore(newScore);
            localStorage.setItem(
              `typeBlitzHighScore_${difficulty}`,
              String(newScore)
            );
          }
          return newScore;
        });
        changeCurrentWord();
      }

      return newInput;
    });
  };

  const handleMobileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    if (gameOver || countdown !== null || !currentWord) return;

    setInput(value);
    setTotalKeystrokes(value.length);

    let correct = 0;
    for (let i = 0; i < value.length; i++) {
      if (value[i] === currentWord[i]) {
        correct++;
      }
    }
    setCorrectKeystrokes(correct);

    if (value === currentWord) {
      correctAudio.current?.play();
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 800);
      setScore((s) => {
        const newScore = s + 1;
        if (newScore > highScore) {
          setHighScore(newScore);
          localStorage.setItem(
            `practiceModeHighScore_${difficulty}`,
            String(newScore)
          );
        }
        return newScore;
      });
      changeCurrentWord();
    } else if (
      value.length > currentWord.length ||
      (value.length > 0 &&
        value[value.length - 1] !== currentWord[value.length - 1])
    ) {
      failAudio.current?.play();
    }
  };

  useEffect(() => {
    window.addEventListener('keydown', onKeydown);
    return () => window.removeEventListener('keydown', onKeydown);
  }, [currentWord, gameOver, countdown]);

  // Timer logic
  useEffect(() => {
    if (!currentWord || gameOver || countdown !== null) return;
    if (difficulty === null) return;
    const { duration } = DIFFICULTY_CONFIG[difficulty];
    const interval = 100;
    const decrement = (100 * interval) / duration;

    const timer = setInterval(() => {
      setProgress((prev) => {
        if (prev <= 0) {
          clearInterval(timer);
          changeCurrentWord();
          return 100;
        }
        return prev - decrement;
      });
    }, interval);

    return () => clearInterval(timer);
  }, [currentWord, gameOver, countdown, changeCurrentWord]);

  const restartGame = () => {
    setDifficulty(null);
    setGameOver(false);
    setUsedWords([]);
    setScore(0);
    setProgress(100);
    setShowSuccess(false);
    setStartTime(null);
    setWpm(0);
  };

  const accuracy =
    totalKeystrokes === 0
      ? 100
      : Math.round((correctKeystrokes / totalKeystrokes) * 100);

  // Difficulty Selection Screen
  if (!difficulty) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-indigo-950 to-slate-950 flex items-center justify-center p-2 sm:p-4 relative overflow-hidden">
        {/* Enhanced animated background elements */}
        <div className="absolute inset-0">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl animate-float"></div>
          <div
            className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl animate-float"
            style={{ animationDelay: '1.5s' }}
          ></div>
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-indigo-500/5 rounded-full blur-3xl animate-pulse-soft"></div>
          <div
            className="absolute top-3/4 left-1/3 w-64 h-64 bg-cyan-500/8 rounded-full blur-2xl animate-float"
            style={{ animationDelay: '3s' }}
          ></div>
        </div>

        <Card className="w-full max-w-sm sm:max-w-2xl lg:max-w-4xl glass shadow-2xl border border-white/10 relative z-10 overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent"></div>
          <CardContent className="p-4 sm:p-6 text-center relative z-10">
            <div className="mb-8">
              <div className="inline-block animate-bounce-subtle mb-4">
                <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-br from-purple-400 via-pink-500 to-red-500 rounded-3xl flex items-center justify-center text-2xl shadow-2xl shadow-purple-500/25 animate-shimmer">
                  <Image
                    src="/assets/icons/logo.svg"
                    alt="Typeblitz logomark"
                    width={80}
                    height={80}
                  />
                </div>
              </div>
              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black mb-4 gradient-text-rainbow tracking-tight">
                Practice Mode
              </h1>
              <p className="text-lg sm:text-xl text-white/70 font-light mb-2">
                Master the art of speed typing
              </p>
              <p className="text-xs sm:text-sm text-white/50 max-w-2xl mx-auto">
                Challenge yourself with different difficulty levels and track
                your progress as you become a typing master.
              </p>
            </div>

            <div className="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-3 mb-6 sm:mb-8">
              {(
                Object.keys(DIFFICULTY_CONFIG) as Array<
                  keyof typeof DIFFICULTY_CONFIG
                >
              ).map((level) => {
                const config = DIFFICULTY_CONFIG[level];
                return (
                  <Button
                    key={level}
                    onClick={() => setDifficulty(level)}
                    className={cn(
                      'h-48 flex flex-col items-center justify-center gap-6 text-white border-2 border-white/10 hover:border-white/30 transition-all duration-500 hover:scale-105 group relative overflow-hidden',
                      `bg-gradient-to-br ${config.gradient}`,
                      config.shadowColor,
                      'hover:shadow-2xl'
                    )}
                    size="lg"
                  >
                    <div className="absolute inset-0 bg-white/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                    <div className="text-5xl mb-3 group-hover:animate-bounce-subtle group-hover:scale-110 transition-transform duration-300">
                      {config.icon}
                    </div>
                    <div className="text-center relative z-10">
                      <div className="font-bold text-2xl mb-2">{level}</div>
                      <div className="text-base opacity-90 mb-3">
                        {config.description}
                      </div>
                      <div className="text-sm opacity-70">
                        Perfect for {level.toLowerCase()} typists
                      </div>
                    </div>
                    <div className="absolute inset-0 animate-shimmer opacity-0 group-hover:opacity-20 transition-opacity duration-700"></div>
                  </Button>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Enhanced Countdown Screen
  if (countdown !== null) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-indigo-950 to-slate-950 flex items-center justify-center p-4 relative overflow-hidden">
        <div className="absolute inset-0">
          <div className="absolute top-1/3 left-1/3 w-96 h-96 bg-purple-500/20 rounded-full blur-3xl animate-pulse"></div>
          <div
            className="absolute bottom-1/3 right-1/3 w-96 h-96 bg-blue-500/20 rounded-full blur-3xl animate-pulse"
            style={{ animationDelay: '0.5s' }}
          ></div>
        </div>

        <div className="text-center relative z-10">
          <div className="text-4xl sm:text-5xl lg:text-6xl font-black text-white mb-4 sm:mb-6 animate-bounce-subtle gradient-text-rainbow drop-shadow-2xl">
            {countdown}
          </div>
          <div className="text-lg sm:text-xl lg:text-2xl text-white/70 font-light animate-pulse-soft mb-3 sm:mb-4">
            Get ready to type...
          </div>
          <div className="mb-4">
            <Badge
              className={cn(
                'text-lg px-6 py-2 font-semibold',
                `bg-gradient-to-r ${
                  DIFFICULTY_CONFIG[difficulty!].gradient
                } border-0 shadow-lg`
              )}
            >
              <span className="mr-2">
                {DIFFICULTY_CONFIG[difficulty!].icon}
              </span>
              {difficulty} Mode Selected
            </Badge>
          </div>
          <div className="flex items-center justify-center gap-2 text-white/50">
            <Image
              src="/assets/icons/logo.svg"
              alt="Typeblitz logomark"
              width={80}
              height={80}
            />
            <span className="text-sm">
              Position your fingers on the home row
            </span>
          </div>
        </div>
      </div>
    );
  }

  // Enhanced Game Screen
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-indigo-950 to-slate-950 flex flex-col justify-center p-2 sm:p-4 relative overflow-hidden">
      {/* Dynamic background effects */}
      <div className="absolute inset-0">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl animate-float"></div>
        <div
          className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl animate-float"
          style={{ animationDelay: '2s' }}
        ></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-indigo-500/8 rounded-full blur-2xl animate-pulse-soft"></div>
      </div>

      <div className="w-full max-w-sm sm:max-w-4xl lg:max-w-6xl mx-auto relative z-10">
        {!gameOver ? (
          <>
            {/* Success Animation */}
            {showSuccess && (
              <div className="fixed inset-0 flex items-center justify-center z-50 pointer-events-none">
                <div className="text-6xl animate-fade-bounce filter drop-shadow-lg">
                  ✨
                </div>
              </div>
            )}

            {/* Enhanced Header Stats */}
            <div className="flex justify-center mb-6">
              <Card className="glass shadow-2xl border border-white/10 hover:border-white/20 transition-all duration-300">
                <CardContent className="p-3 sm:p-4">
                  <div className="flex items-center gap-3 sm:gap-6 lg:gap-8 text-white overflow-x-auto">
                    <div className="flex items-center gap-2 group flex-shrink-0">
                      <div className="p-1.5 sm:p-2 bg-yellow-500/20 rounded-lg group-hover:bg-yellow-500/30 transition-colors duration-300 group-hover:scale-110">
                        <Zap className="w-4 h-4 sm:w-5 sm:h-5 text-yellow-400" />
                      </div>
                      <div>
                        <div className="text-xs text-white/60 font-medium">
                          Score
                        </div>
                        <div className="text-lg sm:text-xl font-bold text-yellow-400">
                          {score}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 group flex-shrink-0">
                      <div className="p-1.5 sm:p-2 bg-green-500/20 rounded-lg group-hover:bg-green-500/30 transition-colors duration-300 group-hover:scale-110">
                        <Target className="w-4 h-4 sm:w-5 sm:h-5 text-green-400" />
                      </div>
                      <div>
                        <div className="text-xs text-white/60 font-medium">
                          Accuracy
                        </div>
                        <div className="text-lg sm:text-xl font-bold text-green-400">
                          {accuracy}%
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 group flex-shrink-0">
                      <div className="p-1.5 sm:p-2 bg-blue-500/20 rounded-lg group-hover:bg-blue-500/30 transition-colors duration-300 group-hover:scale-110">
                        <Clock className="w-4 h-4 sm:w-5 sm:h-5 text-blue-400" />
                      </div>
                      <div>
                        <div className="text-xs text-white/60 font-medium">
                          WPM
                        </div>
                        <div className="text-lg sm:text-xl font-bold text-blue-400">
                          {wpm}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 group flex-shrink-0">
                      <div className="p-1.5 sm:p-2 bg-purple-500/20 rounded-lg group-hover:bg-purple-500/30 transition-colors duration-300 group-hover:scale-110">
                        <Trophy className="w-4 h-4 sm:w-5 sm:h-5 text-purple-400" />
                      </div>
                      <div>
                        <div className="text-xs text-white/60 font-medium">
                          Best
                        </div>
                        <div className="text-lg sm:text-xl font-bold text-purple-400">
                          {highScore}
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Enhanced Main Game Area */}
            <Card className="glass shadow-2xl border border-white/10 overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent"></div>
              <CardContent className="p-4 sm:p-6 text-center relative z-10">
                <div className="mb-4 sm:mb-6">
                  <Badge
                    className={cn(
                      'mb-4 sm:mb-6 text-sm sm:text-lg px-4 sm:px-6 py-1.5 sm:py-2 font-semibold border-0 shadow-lg hover:scale-105 transition-transform duration-300',
                      `bg-gradient-to-r ${
                        DIFFICULTY_CONFIG[difficulty!].gradient
                      }`
                    )}
                  >
                    <span className="mr-2">
                      {DIFFICULTY_CONFIG[difficulty!].icon}
                    </span>
                    {difficulty} Mode
                  </Badge>
                </div>

                {/* Enhanced Word Display */}
                <div className="mb-6 sm:mb-8">
                  <div className="text-2xl sm:text-3xl lg:text-5xl font-black tracking-wider mb-4 sm:mb-6 font-mono leading-none">
                    {currentWord?.split('').map((letter, index) => (
                      <span
                        key={`${letter}_${index}`}
                        className={cn(
                          'transition-all duration-300 inline-block drop-shadow-lg',
                          {
                            'text-green-400 scale-125 animate-bounce-subtle filter blur-0':
                              input[index] === letter,
                            'text-red-400 animate-pulse scale-125 filter blur-0':
                              input[index] && input[index] !== letter,
                            'text-white/40 hover:text-white/60 transition-colors':
                              !input[index],
                          }
                        )}
                      >
                        {letter}
                      </span>
                    ))}
                  </div>

                  {/* Mobile Input Field */}
                  <div className="block sm:hidden mb-4">
                    <input
                      type="text"
                      value={input}
                      onChange={handleMobileInput}
                      className="w-full p-3 text-lg font-mono text-center bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500/50"
                      placeholder="Type the word here..."
                      autoFocus
                      autoComplete="off"
                      autoCapitalize="off"
                      autoCorrect="off"
                      spellCheck="false"
                    />
                  </div>

                  {/* Enhanced Input visualization */}
                  <div className="text-lg sm:text-xl lg:text-2xl text-white/50 font-mono bg-white/5 rounded-xl p-3 sm:p-4 max-w-xs sm:max-w-xl mx-auto border border-white/10 backdrop-blur-sm">
                    <div className="flex items-center justify-center gap-2">
                      <Image
                        src="/assets/icons/logo.svg"
                        alt="Typeblitz logomark"
                        width={80}
                        height={80}
                      />
                      <span className="truncate">
                        {input || 'Start typing...'}
                      </span>
                      <span className="animate-pulse text-white/70 ml-2">
                        |
                      </span>
                    </div>
                  </div>
                </div>

                {/* Enhanced Progress Bar */}
                <div className="max-w-xs sm:max-w-xl mx-auto">
                  <div className="mb-2 sm:mb-3 flex items-center justify-between text-white/70">
                    <span className="text-sm sm:text-lg font-medium flex items-center gap-2">
                      <Clock className="w-3 h-3 sm:w-4 sm:h-4" />
                      <span className="hidden sm:inline">Time Remaining</span>
                      <span className="sm:hidden">Time</span>
                    </span>
                    <span className="text-sm sm:text-lg font-mono bg-white/10 px-2 sm:px-3 py-1 rounded-lg">
                      {Math.ceil(
                        (progress / 100) *
                          (DIFFICULTY_CONFIG[difficulty].duration / 1000)
                      )}
                      s
                    </span>
                  </div>
                  <div className="relative">
                    <Progress
                      value={progress}
                      className="h-3 sm:h-4 bg-white/10 border border-white/20 shadow-inner"
                    />
                    <div className="absolute inset-0 bg-gradient-to-r from-blue-500/20 to-purple-500/20 rounded-full blur-sm"></div>
                    <div className="absolute inset-0 animate-shimmer opacity-30"></div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </>
        ) : (
          /* Enhanced Game Over Screen */
          <Card className="glass shadow-2xl border border-white/10 overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent"></div>
            <CardContent className="p-4 sm:p-6 text-center relative z-10">
              <div className="mb-6 sm:mb-8">
                <div className="text-4xl sm:text-5xl lg:text-6xl mb-4 sm:mb-6 animate-bounce-subtle filter drop-shadow-2xl">
                  🎉
                </div>
                <h2 className="text-2xl sm:text-3xl lg:text-4xl font-black text-white mb-3 sm:mb-4 gradient-text drop-shadow-2xl">
                  Amazing Work!
                </h2>
                <p className="text-lg sm:text-xl text-white/70 font-light mb-2">
                  You&apos;ve completed the typing challenge
                </p>
                <p className="text-sm text-white/50">
                  Your fingers are getting faster every day!
                </p>
              </div>

              <div className="grid gap-4 sm:gap-6 grid-cols-1 sm:grid-cols-3 max-w-xs sm:max-w-3xl mx-auto mb-6 sm:mb-8">
                <Card className="glass border-yellow-400/30 hover:border-yellow-400/50 transition-all duration-300 hover:scale-105 group">
                  <CardContent className="p-4 sm:p-6 text-center">
                    <div className="p-2 sm:p-3 bg-yellow-400/20 rounded-full w-fit mx-auto mb-2 sm:mb-3 group-hover:bg-yellow-400/30 transition-colors">
                      <Zap className="w-5 h-5 sm:w-6 sm:h-6 text-yellow-400" />
                    </div>
                    <div className="text-2xl sm:text-3xl font-black text-yellow-400 mb-1 sm:mb-2">
                      {score}
                    </div>
                    <div className="text-white/70 text-xs sm:text-sm font-medium">
                      Words Completed
                    </div>
                  </CardContent>
                </Card>

                <Card className="glass border-green-400/30 hover:border-green-400/50 transition-all duration-300 hover:scale-105 group">
                  <CardContent className="p-4 sm:p-6 text-center">
                    <div className="p-2 sm:p-3 bg-green-400/20 rounded-full w-fit mx-auto mb-2 sm:mb-3 group-hover:bg-green-400/30 transition-colors">
                      <Target className="w-5 h-5 sm:w-6 sm:h-6 text-green-400" />
                    </div>
                    <div className="text-2xl sm:text-3xl font-black text-green-400 mb-1 sm:mb-2">
                      {accuracy}%
                    </div>
                    <div className="text-white/70 text-xs sm:text-sm font-medium">
                      Accuracy Rate
                    </div>
                  </CardContent>
                </Card>

                <Card className="glass border-blue-400/30 hover:border-blue-400/50 transition-all duration-300 hover:scale-105 group">
                  <CardContent className="p-4 sm:p-6 text-center">
                    <div className="p-2 sm:p-3 bg-blue-400/20 rounded-full w-fit mx-auto mb-2 sm:mb-3 group-hover:bg-blue-400/30 transition-colors">
                      <Clock className="w-5 h-5 sm:w-6 sm:h-6 text-blue-400" />
                    </div>
                    <div className="text-2xl sm:text-3xl font-black text-blue-400 mb-1 sm:mb-2">
                      {wpm}
                    </div>
                    <div className="text-white/70 text-xs sm:text-sm font-medium">
                      Words Per Minute
                    </div>
                  </CardContent>
                </Card>
              </div>

              <Button
                onClick={restartGame}
                size="lg"
                className="bg-gradient-to-r from-purple-500 via-pink-500 to-red-500 hover:from-purple-600 hover:via-pink-600 hover:to-red-600 text-white border-0 px-8 sm:px-12 py-3 sm:py-4 text-lg sm:text-xl font-bold transition-all duration-300 hover:scale-110 shadow-2xl hover:shadow-purple-500/25 group"
              >
                <RotateCcw className="w-5 h-5 sm:w-6 sm:h-6 mr-2 sm:mr-3 group-hover:rotate-180 transition-transform duration-500" />
                Play Again
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
