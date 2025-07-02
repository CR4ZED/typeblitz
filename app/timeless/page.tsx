'use client';

import type React from 'react';

import { useCallback, useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Trophy,
  Target,
  Zap,
  RotateCcw,
  Clock,
  X,
  Timer,
  Settings,
  Play,
  TrendingUp,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import easy from '@/data/easy_words.json';
import medium from '@/data/medium_words.json';
import hard from '@/data/hard_words.json';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Switch } from '@/components/ui/switch';

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
    duration: 10000, // time limit in ms per word
    wordsToProgress: 10, // words needed to progress to next level
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
    duration: 8000,
    wordsToProgress: 15,
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
    duration: 6000,
    wordsToProgress: Number.POSITIVE_INFINITY, // Stay at hard level
  },
};

const WORD_LIST = { easy, medium, hard };

export default function TimelessMode() {
  const [words, setWords] = useState<string[]>([]);
  const [usedWords, setUsedWords] = useState<string[]>([]);
  const [currentWord, setCurrentWord] = useState<string | null>(null);
  const [input, setInput] = useState('');
  const [gameStarted, setGameStarted] = useState(false);
  const [currentDifficulty, setCurrentDifficulty] = useState<
    'Easy' | 'Medium' | 'Hard'
  >('Easy');
  const [wordsInCurrentDifficulty, setWordsInCurrentDifficulty] = useState(0);
  const [sessionTimeLimit, setSessionTimeLimit] = useState<number>(0); // Default to no time limit for timeless mode
  const [progress, setProgress] = useState(100);
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const [sessionEnded, setSessionEnded] = useState(false);
  const [countdown, setCountdown] = useState<number | null>(null);
  const [totalKeystrokes, setTotalKeystrokes] = useState(0);
  const [correctKeystrokes, setCorrectKeystrokes] = useState(0);
  const [showSuccess, setShowSuccess] = useState(false);
  const [showLevelUp, setShowLevelUp] = useState(false);
  const [wpm, setWpm] = useState(0);
  const [startTime, setStartTime] = useState<number | null>(null);
  const [sessionTimeRemaining, setSessionTimeRemaining] = useState<
    number | null
  >(null);
  const [showSettings, setShowSettings] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);

  const correctAudio = useRef<HTMLAudioElement | null>(null);
  const failAudio = useRef<HTMLAudioElement | null>(null);
  const levelUpAudio = useRef<HTMLAudioElement | null>(null);
  const sessionTimerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    // Add mobile-specific styles
    const style = document.createElement('style');
    style.textContent = `
    .scrollbar-hide {
      -ms-overflow-style: none;
      scrollbar-width: none;
    }
    .scrollbar-hide::-webkit-scrollbar {
      display: none;
    }
    .touch-manipulation {
      touch-action: manipulation;
    }
  `;
    document.head.appendChild(style);

    return () => {
      document.head.removeChild(style);
    };
  }, []);

  const initGame = useCallback(async () => {
    // Start with easy words
    setCurrentDifficulty('Easy');
    setWordsInCurrentDifficulty(0);
    const wordsForDifficulty = WORD_LIST.easy;
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
    setSessionEnded(false);
    setStartTime(Date.now());
    setWpm(0);

    // Initialize session timer if time limit is set
    if (sessionTimeLimit > 0) {
      setSessionTimeRemaining(sessionTimeLimit * 60); // convert to seconds
    }
  }, [sessionTimeLimit]);

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

  const endSession = useCallback(() => {
    setSessionEnded(true);
    setGameOver(true);
    setCurrentWord(null);
    setWpm(calculateWPM());
    if (sessionTimerRef.current) {
      clearInterval(sessionTimerRef.current);
    }
  }, [calculateWPM]);

  const quitSession = () => {
    endSession();
  };

  const progressToNextDifficulty = useCallback(() => {
    const nextDifficulty =
      currentDifficulty === 'Easy'
        ? 'Medium'
        : currentDifficulty === 'Medium'
          ? 'Hard'
          : 'Hard';

    if (nextDifficulty !== currentDifficulty) {
      const newWordList =
        WORD_LIST[nextDifficulty.toLowerCase() as 'easy' | 'medium' | 'hard'];
      const nextWord = getRandomWord(newWordList, []);

      // ⚡ Update everything instantly
      setCurrentDifficulty(nextDifficulty);
      setWordsInCurrentDifficulty(0);
      setWords(newWordList);
      setUsedWords([nextWord]);
      setCurrentWord(nextWord);
      setInput('');
      //   mobileInputRef.current?.focus();

      // ✨ Play level-up sound + quick badge animation
      if (soundEnabled) levelUpAudio.current?.play();
      setShowLevelUp(true);
      setTimeout(() => setShowLevelUp(false), 800); // ⏱️ very short
    }
  }, [currentDifficulty, soundEnabled]);

  const changeCurrentWord = useCallback(() => {
    if (sessionEnded) return;

    // Check if we need to progress to next difficulty
    const config = DIFFICULTY_CONFIG[currentDifficulty];
    if (
      wordsInCurrentDifficulty >= config.wordsToProgress &&
      currentDifficulty !== 'Hard'
    ) {
      progressToNextDifficulty();
      return;
    }

    const next = getRandomWord(words, usedWords);
    if (next) {
      setInput('');
      setCurrentWord(next);
      setUsedWords((prev) => [...prev, next]);
      setProgress(100);
      setWpm(calculateWPM());
    } else {
      // If no more words in current difficulty, progress to next
      if (currentDifficulty !== 'Hard') {
        progressToNextDifficulty();
      } else {
        endSession();
      }
    }
  }, [
    usedWords,
    words,
    calculateWPM,
    sessionEnded,
    endSession,
    currentDifficulty,
    wordsInCurrentDifficulty,
    progressToNextDifficulty,
  ]);

  const onKeydown = (e: KeyboardEvent) => {
    if (gameOver || countdown !== null || !currentWord || sessionEnded) return;

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
        if (soundEnabled) failAudio.current?.play();
      }

      if (newInput === currentWord) {
        if (soundEnabled) correctAudio.current?.play();
        setShowSuccess(true);
        setTimeout(() => setShowSuccess(false), 800);

        setScore((s) => {
          const newScore = s + 1;
          if (newScore > highScore) {
            setHighScore(newScore);
            localStorage.setItem(`timelessModeHighScore`, String(newScore));
          }
          return newScore;
        });

        setWordsInCurrentDifficulty((prev) => prev + 1);
        changeCurrentWord();
      }

      return newInput;
    });
  };

  const handleMobileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    if (gameOver || countdown !== null || !currentWord || sessionEnded) return;

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
      if (soundEnabled) correctAudio.current?.play();
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 800);

      setScore((s) => {
        const newScore = s + 1;
        if (newScore > highScore) {
          setHighScore(newScore);
          localStorage.setItem(`timelessModeHighScore`, String(newScore));
        }
        return newScore;
      });

      setWordsInCurrentDifficulty((prev) => prev + 1);
      changeCurrentWord();
    } else if (
      value.length > currentWord.length ||
      (value.length > 0 &&
        value[value.length - 1] !== currentWord[value.length - 1])
    ) {
      if (soundEnabled) failAudio.current?.play();
    }
  };

  const restartGame = () => {
    setGameStarted(false);
    setGameOver(false);
    setSessionEnded(false);
    setUsedWords([]);
    setScore(0);
    setProgress(100);
    setShowSuccess(false);
    setShowLevelUp(false);
    setStartTime(null);
    setWpm(0);
    setSessionTimeRemaining(null);
    setCurrentDifficulty('Easy');
    setWordsInCurrentDifficulty(0);
    if (sessionTimerRef.current) {
      clearInterval(sessionTimerRef.current);
    }
  };

  const startGame = () => {
    setGameStarted(true);
  };

  const accuracy =
    totalKeystrokes === 0
      ? 100
      : Math.round((correctKeystrokes / totalKeystrokes) * 100);

  // Load sounds
  useEffect(() => {
    correctAudio.current = new Audio('/assets/media/correct.mp3');
    failAudio.current = new Audio('/assets/media/fail.mp3');
    levelUpAudio.current = new Audio('/assets/media/levelup.mp3');
  }, []);

  // Load high score
  useEffect(() => {
    const stored = localStorage.getItem(`timelessModeHighScore`);
    if (stored) setHighScore(Number.parseInt(stored));
  }, []);

  // Countdown before game
  useEffect(() => {
    if (gameStarted) {
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
  }, [gameStarted, initGame]);

  useEffect(() => {
    window.addEventListener('keydown', onKeydown);
    return () => window.removeEventListener('keydown', onKeydown);
  }, [currentWord, gameOver, countdown, sessionEnded]);

  // Session timer logic
  useEffect(() => {
    if (
      !currentWord ||
      gameOver ||
      countdown !== null ||
      sessionEnded ||
      sessionTimeLimit === 0
    )
      return;

    sessionTimerRef.current = setInterval(() => {
      setSessionTimeRemaining((prev) => {
        if (prev === null || prev <= 1) {
          endSession();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (sessionTimerRef.current) {
        clearInterval(sessionTimerRef.current);
      }
    };
  }, [
    currentWord,
    gameOver,
    countdown,
    sessionEnded,
    sessionTimeLimit,
    endSession,
  ]);

  // Per-word timer logic
  useEffect(() => {
    if (!currentWord || gameOver || countdown !== null || sessionEnded) return;

    const { duration } = DIFFICULTY_CONFIG[currentDifficulty];
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
  }, [
    currentWord,
    gameOver,
    countdown,
    changeCurrentWord,
    currentDifficulty,
    sessionEnded,
  ]);

  // Format time for display
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Start Screen
  if (!gameStarted) {
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
                Timeless Mode
              </h1>
              {/* Settings Button */}
              <div className="flex justify-center mb-6">
                <Dialog open={showSettings} onOpenChange={setShowSettings}>
                  <DialogTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="w-12 h-12 absolute top-2 right-2 cursor-pointer rounded-full  text-white hover:bg-white/20 transition-all duration-300 group flex items-center justify-center"
                    >
                      <Settings className="w-5 h-5 group-hover:rotate-90 transition-transform duration-300" />
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="glass border border-white/20 text-white max-w-[95vw] sm:max-w-md mx-4">
                    <DialogHeader>
                      <DialogTitle className="text-xl font-bold text-center gradient-text">
                        Game Settings
                      </DialogTitle>
                    </DialogHeader>
                    <div className="space-y-6 p-4">
                      {/* Session Time Limit */}
                      <div className="space-y-3">
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-blue-500/20 rounded-lg">
                            <Timer className="w-5 h-5 text-blue-400" />
                          </div>
                          <Label
                            htmlFor="session-time-modal"
                            className="text-white font-medium"
                          >
                            Session Time Limit
                          </Label>
                        </div>
                        <Input
                          id="session-time-modal"
                          type="number"
                          min="0"
                          max="60"
                          value={sessionTimeLimit}
                          onChange={(e) =>
                            setSessionTimeLimit(Number(e.target.value) || 0)
                          }
                          className="text-center text-lg font-mono bg-white/10 border-white/20 text-white placeholder-white/50 focus:border-blue-400/50 focus:ring-blue-400/25"
                          placeholder="0"
                        />
                        <p className="text-xs text-white/60 text-center">
                          Minutes (0 = No Time Limit)
                        </p>
                      </div>

                      {/* Sound Settings */}
                      <div className="space-y-3">
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-purple-500/20 rounded-lg">
                            <span className="text-purple-400 text-lg">🔊</span>
                          </div>
                          <Label
                            htmlFor="sound-toggle"
                            className="text-white font-medium"
                          >
                            Game Sounds
                          </Label>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-white/70 text-sm">
                            {soundEnabled
                              ? 'Sound effects enabled'
                              : 'Sound effects disabled'}
                          </span>
                          <Switch
                            id="sound-toggle"
                            checked={soundEnabled}
                            onCheckedChange={setSoundEnabled}
                            className="data-[state=checked]:bg-purple-500"
                          />
                        </div>
                      </div>

                      {/* Close Button */}
                      <div className="flex justify-center pt-4">
                        <Button
                          onClick={() => setShowSettings(false)}
                          className="bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white border-0 px-8 py-2 font-medium transition-all duration-300 hover:scale-105"
                        >
                          Save Settings
                        </Button>
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
              <p className="text-lg sm:text-xl text-white/70 font-light mb-2">
                Progressive difficulty typing challenge
              </p>
              <p className="text-xs sm:text-sm text-white/50 max-w-2xl mx-auto mb-6">
                Start with easy words and progress through medium to hard as you
                improve. No time pressure, just pure skill development.
              </p>

              {/* Difficulty Progression Info */}
              <div className="grid gap-2 sm:gap-3 grid-cols-3 max-w-lg mx-auto mb-8">
                {(
                  Object.keys(DIFFICULTY_CONFIG) as Array<
                    keyof typeof DIFFICULTY_CONFIG
                  >
                ).map((level, index) => {
                  const config = DIFFICULTY_CONFIG[level];
                  return (
                    <div
                      key={level}
                      className="flex items-center gap-2 text-white/60"
                    >
                      <div className="text-2xl">{config.icon}</div>
                      <div className="text-left">
                        <div className="text-sm font-medium">{level}</div>
                        <div className="text-xs opacity-70">
                          {config.description}
                        </div>
                      </div>
                      {index < 2 && (
                        <TrendingUp className="w-4 h-4 text-white/40" />
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Start Button */}
            <Button
              onClick={startGame}
              size="lg"
              className="bg-gradient-to-r from-emerald-500 via-blue-500 to-purple-500 hover:from-emerald-600 hover:via-blue-600 hover:to-purple-600 text-white border-0 px-12 py-4 text-xl font-bold transition-all duration-300 hover:scale-110 shadow-2xl hover:shadow-blue-500/25 group touch-manipulation"
            >
              <Play className="w-6 h-6 mr-3 group-hover:scale-110 transition-transform duration-300" />
              Start Timeless Journey
            </Button>
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
            Get ready for your timeless journey...
          </div>
          <div className="mb-4">
            <Badge className="bg-emerald-500/20 text-emerald-400 border border-emerald-400/30 px-6 py-2 text-lg font-semibold">
              <span className="mr-2">🌱</span>
              Starting with Easy Mode
            </Badge>
          </div>
          {sessionTimeLimit > 0 && (
            <div className="mb-4">
              <Badge className="bg-blue-500/20 text-blue-400 border border-blue-400/30 px-4 py-2">
                <Timer className="w-4 h-4 mr-2" />
                {sessionTimeLimit} minute session
              </Badge>
            </div>
          )}
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
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-indigo-950 to-slate-950 flex flex-col justify-center p-3 sm:p-4 relative overflow-hidden">
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

            {/* Level Up Animation */}
            {showLevelUp && (
              <div className="fixed inset-0 flex items-center justify-center z-50 pointer-events-none">
                <div className="text-center animate-fade-bounce">
                  <div className="text-6xl mb-4 filter drop-shadow-lg">🎉</div>
                  <div className="text-3xl font-black text-white gradient-text drop-shadow-lg">
                    Level Up!
                  </div>
                  <div className="text-xl text-white/80 mt-2">
                    Now playing {currentDifficulty} mode
                  </div>
                </div>
              </div>
            )}

            {/* Enhanced Header Stats */}
            <div className="flex justify-center mb-6">
              <Card className="glass shadow-2xl border border-white/10 hover:border-white/20 transition-all duration-300">
                <CardContent className="p-3 sm:p-4">
                  <div className="flex items-center gap-2 sm:gap-3 lg:gap-6 xl:gap-8 text-white overflow-x-auto pb-2 scrollbar-hide">
                    <div className="flex items-center gap-1.5 sm:gap-2 group flex-shrink-0 min-w-0">
                      <div className="p-1 sm:p-1.5 md:p-2 bg-yellow-500/20 rounded-lg group-hover:bg-yellow-500/30 transition-colors duration-300 group-hover:scale-110 flex-shrink-0">
                        <Zap className="w-3 h-3 sm:w-4 sm:h-4 md:w-5 md:h-5 text-yellow-400" />
                      </div>
                      <div className="min-w-0">
                        <div className="text-xs text-white/60 font-medium truncate">
                          Score
                        </div>
                        <div className="text-sm sm:text-lg md:text-xl font-bold text-yellow-400">
                          {score}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 sm:gap-2 group flex-shrink-0 min-w-0">
                      <div className="p-1 sm:p-1.5 md:p-2 bg-green-500/20 rounded-lg group-hover:bg-green-500/30 transition-colors duration-300 group-hover:scale-110 flex-shrink-0">
                        <Target className="w-3 h-3 sm:w-4 sm:h-4 md:w-5 md:h-5 text-green-400" />
                      </div>
                      <div className="min-w-0">
                        <div className="text-xs text-white/60 font-medium truncate">
                          Accuracy
                        </div>
                        <div className="text-sm sm:text-lg md:text-xl font-bold text-green-400">
                          {accuracy}%
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 sm:gap-2 group flex-shrink-0 min-w-0">
                      <div className="p-1 sm:p-1.5 md:p-2 bg-blue-500/20 rounded-lg group-hover:bg-blue-500/30 transition-colors duration-300 group-hover:scale-110 flex-shrink-0">
                        <Clock className="w-3 h-3 sm:w-4 sm:h-4 md:w-5 md:h-5 text-blue-400" />
                      </div>
                      <div className="min-w-0">
                        <div className="text-xs text-white/60 font-medium truncate">
                          WPM
                        </div>
                        <div className="text-sm sm:text-lg md:text-xl font-bold text-blue-400">
                          {wpm}
                        </div>
                      </div>
                    </div>

                    {sessionTimeRemaining !== null && (
                      <div className="flex items-center gap-1.5 sm:gap-2 group flex-shrink-0 min-w-0">
                        <div className="p-1 sm:p-1.5 md:p-2 bg-orange-500/20 rounded-lg group-hover:bg-orange-500/30 transition-colors duration-300 group-hover:scale-110 flex-shrink-0">
                          <Timer className="w-3 h-3 sm:w-4 sm:h-4 md:w-5 md:h-5 text-orange-400" />
                        </div>
                        <div className="min-w-0">
                          <div className="text-xs text-white/60 font-medium truncate">
                            Session
                          </div>
                          <div className="text-sm sm:text-lg md:text-xl font-bold text-orange-400">
                            {formatTime(sessionTimeRemaining)}
                          </div>
                        </div>
                      </div>
                    )}

                    <div className="flex items-center gap-1.5 sm:gap-2 group flex-shrink-0 min-w-0">
                      <div className="p-1 sm:p-1.5 md:p-2 bg-purple-500/20 rounded-lg group-hover:bg-purple-500/30 transition-colors duration-300 group-hover:scale-110 flex-shrink-0">
                        <Trophy className="w-3 h-3 sm:w-4 sm:h-4 md:w-5 md:h-5 text-purple-400" />
                      </div>
                      <div className="min-w-0">
                        <div className="text-xs text-white/60 font-medium truncate">
                          Best
                        </div>
                        <div className="text-sm sm:text-lg md:text-xl font-bold text-purple-400">
                          {highScore}
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Quit Button */}
            <div className="flex justify-center mb-4 sm:mb-4">
              <Button
                onClick={quitSession}
                variant="outline"
                size="default"
                className="bg-red-500/10 border-red-400/30 text-red-400 hover:bg-red-500/20 hover:border-red-400/50 transition-all duration-300 px-6 py-3 text-base font-medium touch-manipulation"
              >
                <X className="w-4 h-4 mr-2" />
                Quit Session
              </Button>
            </div>

            {/* Enhanced Main Game Area */}
            <Card className="glass shadow-2xl border border-white/10 overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent"></div>
              <CardContent className="p-4 sm:p-6 text-center relative z-10">
                <div className="mb-4 sm:mb-6">
                  <Badge
                    className={cn(
                      'mb-4 sm:mb-6 text-sm sm:text-lg px-4 sm:px-6 py-1.5 sm:py-2 font-semibold border-0 shadow-lg hover:scale-105 transition-transform duration-300',
                      `bg-gradient-to-r ${DIFFICULTY_CONFIG[currentDifficulty].gradient}`
                    )}
                  >
                    <span className="mr-2">
                      {DIFFICULTY_CONFIG[currentDifficulty].icon}
                    </span>
                    {currentDifficulty} Mode
                  </Badge>
                  <div className="text-sm text-white/60 mt-2">
                    Progress: {wordsInCurrentDifficulty}/
                    {DIFFICULTY_CONFIG[currentDifficulty].wordsToProgress ===
                    Number.POSITIVE_INFINITY
                      ? '∞'
                      : DIFFICULTY_CONFIG[currentDifficulty]
                          .wordsToProgress}{' '}
                    words
                  </div>
                </div>

                {/* Enhanced Word Display */}
                <div className="mb-6 sm:mb-8">
                  <div className="text-xl sm:text-2xl md:text-3xl lg:text-5xl font-black tracking-wider mb-4 sm:mb-6 font-mono leading-none break-all">
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
                  <div className="block sm:hidden mb-6">
                    <div className="relative">
                      <input
                        type="text"
                        value={input}
                        onChange={handleMobileInput}
                        className="w-full p-4 text-xl font-mono text-center bg-white/10 border-2 border-white/20 rounded-2xl text-white placeholder-white/50 focus:outline-none focus:ring-4 focus:ring-purple-500/50 focus:border-purple-500/50 transition-all duration-300"
                        placeholder="Type the word here..."
                        autoFocus
                        autoComplete="off"
                        autoCapitalize="off"
                        autoCorrect="off"
                        spellCheck="false"
                        inputMode="text"
                      />
                    </div>
                    <p className="text-sm text-white/60 mt-2 text-center">
                      Use your device keyboard to type
                    </p>
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
                      <span className="hidden sm:inline">Word Time</span>
                      <span className="sm:hidden">Time</span>
                    </span>
                    <span className="text-sm sm:text-lg font-mono bg-white/10 px-2 sm:px-3 py-1 rounded-lg">
                      {Math.ceil(
                        (progress / 100) *
                          (DIFFICULTY_CONFIG[currentDifficulty].duration / 1000)
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
                  {sessionEnded ? '⏰' : '🎉'}
                </div>
                <h2 className="text-2xl sm:text-3xl lg:text-4xl font-black text-white mb-3 sm:mb-4 gradient-text drop-shadow-2xl">
                  {sessionEnded
                    ? 'Session Complete!'
                    : 'Timeless Journey Complete!'}
                </h2>
                <p className="text-lg sm:text-xl text-white/70 font-light mb-2">
                  {sessionEnded
                    ? "Time's up! Here are your results"
                    : "You've mastered the timeless challenge"}
                </p>
                <p className="text-sm text-white/50">
                  You reached {currentDifficulty} difficulty level!
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
                Start New Journey
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
