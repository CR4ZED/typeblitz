import { useCallback, useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Trophy, Target, Zap, RotateCcw, Keyboard, Clock } from "lucide-react";
import { cn } from "@/lib/utils";

const TIMER_DURATION = 30000;

const DIFFICULTY_FILTERS = {
  Easy: (word: string) => word.length >= 4 && word.length <= 5,
  Medium: (word: string) => word.length >= 6 && word.length <= 8,
  Hard: (word: string) => word.length > 8,
};

const DIFFICULTY_CONFIG = {
  Easy: {
    gradient: "from-emerald-400 via-teal-500 to-cyan-500",
    shadowColor: "shadow-emerald-500/30",
    glowColor: "shadow-emerald-500/50",
    description: "4-5 letters",
    icon: "🌱",
    bgGradient: "from-emerald-500/20 to-teal-500/20",
    accentColor: "text-emerald-400",
    borderColor: "border-emerald-400/30",
  },
  Medium: {
    gradient: "from-amber-400 via-orange-500 to-red-500",
    shadowColor: "shadow-amber-500/30",
    glowColor: "shadow-amber-500/50",
    description: "6-8 letters",
    icon: "🔥",
    bgGradient: "from-amber-500/20 to-orange-500/20",
    accentColor: "text-amber-400",
    borderColor: "border-amber-400/30",
  },
  Hard: {
    gradient: "from-purple-400 via-pink-500 to-red-500",
    shadowColor: "shadow-purple-500/30",
    glowColor: "shadow-purple-500/50",
    description: "9+ letters",
    icon: "⚡",
    bgGradient: "from-purple-500/20 to-pink-500/20",
    accentColor: "text-purple-400",
    borderColor: "border-purple-400/30",
  },
};

// Sample words for demo (in a real app, this would come from an API)
const SAMPLE_WORDS = {
  Easy: [
    "hello",
    "world",
    "type",
    "fast",
    "game",
    "quick",
    "light",
    "space",
    "music",
    "heart",
  ],
  Medium: [
    "typing",
    "challenge",
    "keyboard",
    "letters",
    "amazing",
    "journey",
    "digital",
    "creative",
  ],
  Hard: [
    "difficulty",
    "incredible",
    "championship",
    "extraordinary",
    "sophisticated",
    "revolutionary",
  ],
};

export default function Index() {
  const [words, setWords] = useState<string[]>([]);
  const [usedWords, setUsedWords] = useState<string[]>([]);
  const [currentWord, setCurrentWord] = useState<string | null>(null);
  const [input, setInput] = useState("");
  const [difficulty, setDifficulty] = useState<
    "Easy" | "Medium" | "Hard" | null
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
    correctAudio.current = new Audio("/correct.mp3");
    failAudio.current = new Audio("/fail.mp3");
  }, []);

  // Load high score
  useEffect(() => {
    const stored = localStorage.getItem("typeRushHighScore");
    if (stored) setHighScore(Number.parseInt(stored));
  }, []);

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
    // Using sample words for demo - in production, load from API
    const wordsForDifficulty = SAMPLE_WORDS[difficulty!];
    setWords(wordsForDifficulty);
    const random = getRandomWord(wordsForDifficulty, []);
    setCurrentWord(random);
    setUsedWords([random]);
    setInput("");
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
    if (filtered.length === 0) return null;
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
      setCurrentWord(next);
      setUsedWords((prev) => [...prev, next]);
      setInput("");
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
    if (["Shift", "Tab", "Enter", "Space"].includes(e.key)) return;

    if (e.key === "Backspace") {
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
        failAudio.current.play();
      }

      if (newInput === currentWord) {
        correctAudio.current.play();
        setShowSuccess(true);
        setTimeout(() => setShowSuccess(false), 800);
        setScore((s) => {
          const newScore = s + 1;
          if (newScore > highScore) {
            setHighScore(newScore);
            localStorage.setItem("typeRushHighScore", String(newScore));
          }
          return newScore;
        });
        changeCurrentWord();
      }

      return newInput;
    });
  };

  useEffect(() => {
    window.addEventListener("keydown", onKeydown);
    return () => window.removeEventListener("keydown", onKeydown);
  }, [currentWord, gameOver, countdown]);

  // Timer logic
  useEffect(() => {
    if (!currentWord || gameOver || countdown !== null) return;

    const interval = 100;
    const decrement = (100 * interval) / TIMER_DURATION;

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
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-indigo-950 to-slate-950 flex items-center justify-center p-4 relative overflow-hidden">
        {/* Enhanced animated background elements */}
        <div className="absolute inset-0">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl animate-float"></div>
          <div
            className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl animate-float"
            style={{ animationDelay: "1.5s" }}
          ></div>
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-indigo-500/5 rounded-full blur-3xl animate-pulse-soft"></div>
          <div
            className="absolute top-3/4 left-1/3 w-64 h-64 bg-cyan-500/8 rounded-full blur-2xl animate-float"
            style={{ animationDelay: "3s" }}
          ></div>
        </div>

        <Card className="w-full max-w-5xl glass shadow-2xl border border-white/10 relative z-10 overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent"></div>
          <CardContent className="p-4 text-center relative z-10">
            <div className="mb-16">
              <div className="inline-block animate-bounce-subtle mb-8">
                <div className="w-24 h-24 mx-auto mb-8 bg-gradient-to-br from-purple-400 via-pink-500 to-red-500 rounded-3xl flex items-center justify-center text-4xl shadow-2xl shadow-purple-500/25 animate-shimmer">
                  <Keyboard className="w-12 h-12 text-white" />
                </div>
              </div>
              <h1 className="text-8xl font-black mb-8 gradient-text-rainbow tracking-tight">
                TypeRush
              </h1>
              <p className="text-3xl text-white/70 font-light mb-4">
                Master the art of speed typing
              </p>
              <p className="text-lg text-white/50 max-w-2xl mx-auto">
                Challenge yourself with different difficulty levels and track
                your progress as you become a typing master.
              </p>
            </div>

            <div className="grid gap-8 md:grid-cols-3 mb-16">
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
                      "h-48 flex flex-col items-center justify-center gap-6 text-white border-2 border-white/10 hover:border-white/30 transition-all duration-500 hover:scale-105 glass group relative overflow-hidden",
                      `bg-gradient-to-br ${config.gradient}`,
                      config.shadowColor,
                      "hover:shadow-2xl"
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

            {highScore > 0 && (
              <Card className="glass border-yellow-400/30 max-w-lg mx-auto hover:border-yellow-400/50 transition-all duration-300 hover:scale-105">
                <CardContent className="p-8">
                  <div className="flex items-center justify-center gap-4 text-white">
                    <div className="p-3 bg-yellow-400/20 rounded-full">
                      <Trophy className="w-8 h-8 text-yellow-400 animate-pulse-soft" />
                    </div>
                    <div>
                      <div className="text-sm text-white/60 font-medium">
                        Personal Best
                      </div>
                      <span className="text-3xl font-bold text-yellow-400">
                        {highScore}
                      </span>
                      <span className="text-lg text-white/70 ml-2">words</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </CardContent>
        </Card>
      </div>
    );
  }

  // Enhanced Countdown Screen
  if (countdown !== null) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-indigo-950 to-slate-950 flex items-center justify-center relative overflow-hidden">
        <div className="absolute inset-0">
          <div className="absolute top-1/3 left-1/3 w-96 h-96 bg-purple-500/20 rounded-full blur-3xl animate-pulse"></div>
          <div
            className="absolute bottom-1/3 right-1/3 w-96 h-96 bg-blue-500/20 rounded-full blur-3xl animate-pulse"
            style={{ animationDelay: "0.5s" }}
          ></div>
        </div>

        <div className="text-center relative z-10">
          <div className="text-9xl font-black text-white mb-12 animate-bounce-subtle gradient-text-rainbow drop-shadow-2xl">
            {countdown}
          </div>
          <div className="text-4xl text-white/70 font-light animate-pulse-soft mb-8">
            Get ready to type...
          </div>
          <div className="mb-8">
            <Badge
              className={cn(
                "text-xl px-8 py-3 font-semibold",
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
            <Keyboard className="w-5 h-5" />
            <span>Position your fingers on the home row</span>
          </div>
        </div>
      </div>
    );
  }

  // Enhanced Game Screen
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-indigo-950 to-slate-950 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Dynamic background effects */}
      <div className="absolute inset-0">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl animate-float"></div>
        <div
          className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl animate-float"
          style={{ animationDelay: "2s" }}
        ></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-indigo-500/8 rounded-full blur-2xl animate-pulse-soft"></div>
      </div>

      <div className="w-full max-w-7xl relative z-10">
        {!gameOver ? (
          <>
            {/* Success Animation */}
            {showSuccess && (
              <div className="fixed inset-0 flex items-center justify-center z-50 pointer-events-none">
                <div className="text-8xl animate-bounce-subtle filter drop-shadow-lg">
                  ✨
                </div>
              </div>
            )}

            {/* Enhanced Header Stats */}
            <div className="flex justify-center mb-10">
              <Card className="glass shadow-2xl border border-white/10 hover:border-white/20 transition-all duration-300">
                <CardContent className="p-8">
                  <div className="flex items-center gap-16 text-white">
                    <div className="flex items-center gap-4 group">
                      <div className="p-3 bg-yellow-500/20 rounded-xl group-hover:bg-yellow-500/30 transition-colors duration-300 group-hover:scale-110">
                        <Zap className="w-7 h-7 text-yellow-400" />
                      </div>
                      <div>
                        <div className="text-sm text-white/60 font-medium mb-1">
                          Score
                        </div>
                        <div className="text-3xl font-bold text-yellow-400">
                          {score}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-4 group">
                      <div className="p-3 bg-green-500/20 rounded-xl group-hover:bg-green-500/30 transition-colors duration-300 group-hover:scale-110">
                        <Target className="w-7 h-7 text-green-400" />
                      </div>
                      <div>
                        <div className="text-sm text-white/60 font-medium mb-1">
                          Accuracy
                        </div>
                        <div className="text-3xl font-bold text-green-400">
                          {accuracy}%
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-4 group">
                      <div className="p-3 bg-blue-500/20 rounded-xl group-hover:bg-blue-500/30 transition-colors duration-300 group-hover:scale-110">
                        <Clock className="w-7 h-7 text-blue-400" />
                      </div>
                      <div>
                        <div className="text-sm text-white/60 font-medium mb-1">
                          WPM
                        </div>
                        <div className="text-3xl font-bold text-blue-400">
                          {wpm}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-4 group">
                      <div className="p-3 bg-purple-500/20 rounded-xl group-hover:bg-purple-500/30 transition-colors duration-300 group-hover:scale-110">
                        <Trophy className="w-7 h-7 text-purple-400" />
                      </div>
                      <div>
                        <div className="text-sm text-white/60 font-medium mb-1">
                          Best
                        </div>
                        <div className="text-3xl font-bold text-purple-400">
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
              <CardContent className="p-8 text-center relative z-10">
                <div className="mb-16">
                  <Badge
                    className={cn(
                      "mb-10 text-xl px-8 py-3 font-semibold border-0 shadow-lg hover:scale-105 transition-transform duration-300",
                      `bg-gradient-to-r ${
                        DIFFICULTY_CONFIG[difficulty!].gradient
                      }`
                    )}
                  >
                    <span className="mr-3">
                      {DIFFICULTY_CONFIG[difficulty!].icon}
                    </span>
                    {difficulty} Mode
                  </Badge>
                </div>

                {/* Enhanced Word Display */}
                <div className="mb-20">
                  <div className="text-9xl font-black tracking-wider mb-12 font-mono leading-none">
                    {currentWord?.split("").map((letter, index) => (
                      <span
                        key={`${letter}_${index}`}
                        className={cn(
                          "transition-all duration-300 inline-block drop-shadow-lg",
                          {
                            "text-green-400 scale-125 animate-bounce-subtle filter blur-0":
                              input[index] === letter,
                            "text-red-400 animate-pulse scale-125 filter blur-0":
                              input[index] && input[index] !== letter,
                            "text-white/40 hover:text-white/60 transition-colors":
                              !input[index],
                          }
                        )}
                      >
                        {letter}
                      </span>
                    ))}
                  </div>

                  {/* Enhanced Input visualization */}
                  <div className="text-4xl text-white/50 font-mono bg-white/5 rounded-2xl p-8 max-w-2xl mx-auto border border-white/10 backdrop-blur-sm">
                    <div className="flex items-center justify-center gap-2">
                      <Keyboard className="w-6 h-6 text-white/30" />
                      <span>{input || "Start typing..."}</span>
                      <span className="animate-pulse text-white/70 ml-2">
                        |
                      </span>
                    </div>
                  </div>
                </div>

                {/* Enhanced Progress Bar */}
                <div className="max-w-2xl mx-auto">
                  <div className="mb-6 flex items-center justify-between text-white/70">
                    <span className="text-xl font-medium flex items-center gap-2">
                      <Clock className="w-5 h-5" />
                      Time Remaining
                    </span>
                    <span className="text-xl font-mono bg-white/10 px-4 py-2 rounded-lg">
                      {Math.ceil((progress / 100) * (TIMER_DURATION / 1000))}s
                    </span>
                  </div>
                  <div className="relative">
                    <Progress
                      value={progress}
                      className="h-6 bg-white/10 border border-white/20 shadow-inner"
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
            <CardContent className="p-8 text-center relative z-10">
              <div className="mb-16">
                <div className="text-9xl mb-12 animate-bounce-subtle filter drop-shadow-2xl">
                  🎉
                </div>
                <h2 className="text-7xl font-black text-white mb-8 gradient-text drop-shadow-lg">
                  Amazing Work!
                </h2>
                <p className="text-3xl text-white/70 font-light mb-4">
                  You've completed the typing challenge
                </p>
                <p className="text-lg text-white/50">
                  Your fingers are getting faster every day!
                </p>
              </div>

              <div className="grid gap-10 md:grid-cols-3 max-w-4xl mx-auto mb-16">
                <Card className="glass border-yellow-400/30 hover:border-yellow-400/50 transition-all duration-300 hover:scale-105 group">
                  <CardContent className="p-10 text-center">
                    <div className="p-4 bg-yellow-400/20 rounded-full w-fit mx-auto mb-4 group-hover:bg-yellow-400/30 transition-colors">
                      <Zap className="w-8 h-8 text-yellow-400" />
                    </div>
                    <div className="text-6xl font-black text-yellow-400 mb-3">
                      {score}
                    </div>
                    <div className="text-white/70 text-xl font-medium">
                      Words Completed
                    </div>
                  </CardContent>
                </Card>
                <Card className="glass border-green-400/30 hover:border-green-400/50 transition-all duration-300 hover:scale-105 group">
                  <CardContent className="p-10 text-center">
                    <div className="p-4 bg-green-400/20 rounded-full w-fit mx-auto mb-4 group-hover:bg-green-400/30 transition-colors">
                      <Target className="w-8 h-8 text-green-400" />
                    </div>
                    <div className="text-6xl font-black text-green-400 mb-3">
                      {accuracy}%
                    </div>
                    <div className="text-white/70 text-xl font-medium">
                      Accuracy Rate
                    </div>
                  </CardContent>
                </Card>
                <Card className="glass border-blue-400/30 hover:border-blue-400/50 transition-all duration-300 hover:scale-105 group">
                  <CardContent className="p-10 text-center">
                    <div className="p-4 bg-blue-400/20 rounded-full w-fit mx-auto mb-4 group-hover:bg-blue-400/30 transition-colors">
                      <Clock className="w-8 h-8 text-blue-400" />
                    </div>
                    <div className="text-6xl font-black text-blue-400 mb-3">
                      {wpm}
                    </div>
                    <div className="text-white/70 text-xl font-medium">
                      Words Per Minute
                    </div>
                  </CardContent>
                </Card>
              </div>

              <Button
                onClick={restartGame}
                size="lg"
                className="bg-gradient-to-r from-purple-500 via-pink-500 to-red-500 hover:from-purple-600 hover:via-pink-600 hover:to-red-600 text-white border-0 px-16 py-6 text-2xl font-bold transition-all duration-300 hover:scale-110 shadow-2xl hover:shadow-purple-500/25 group"
              >
                <RotateCcw className="w-8 h-8 mr-4 group-hover:rotate-180 transition-transform duration-500" />
                Play Again
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
