'use client';

import { createContext, ReactNode } from 'react';

type wordList = { easy: string[]; medium: string[]; hard: string[] };
export const WordsContext = createContext<wordList>({
  easy: [],
  medium: [],
  hard: [],
});

export function WordsProvider({
  wordList,
  children,
}: {
  wordList: wordList;
  children: ReactNode;
}) {
  return (
    <WordsContext.Provider value={wordList}>{children}</WordsContext.Provider>
  );
}
