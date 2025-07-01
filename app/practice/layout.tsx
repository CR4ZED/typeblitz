import { WordsProvider } from '@/providers/words-provider';
import { ReactNode } from 'react';
import easy from '@/data/easy_words.json';
import medium from '@/data/medium_words.json';
import hard from '@/data/hard_words.json';

export const metadata = {
  title: 'Practice Mode',
  description:
    'Practice typing on TypeBlitz – a fast-paced typing challenge where you race against time in easy, medium, or hard mode. Improve your speed, accuracy, and reflexes.',
  keywords: [
    'typing game',
    'typing practice',
    'typing speed test',
    'typeblitz',
    'typerush',
    'typing challenge',
    'wpm test',
    'fast typing game',
    'react typing game',
    'web typing game',
    'type test',
    'word game',
  ],
  openGraph: {
    title: 'Practice Mode | TypeBlitz - Fast Typing Game',
    description:
      'Choose from easy, medium, or hard and type the words before time runs out. Sharpen your reflexes with Practice Mode in the TypeBlitz universe.',
    siteName: 'TypeBlitz',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Practice Mode | TypeBlitz - Fast Typing Game',
    description:
      'Challenge yourself with different difficulty levels and track your progress as you become a typing master.',
  },
};

export default async function Layout({ children }: { children: ReactNode }) {
  const wordList = {
    easy,
    medium,
    hard,
  };

  return <WordsProvider wordList={wordList}>{children}</WordsProvider>;
}
