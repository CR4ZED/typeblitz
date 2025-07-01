import axios from 'axios';
import { WordsProvider } from '@/providers/words-provider';
import { ReactNode } from 'react';

export const metadata = {
  title: 'Practice Mode | TypeBlitz - Fast Typing Game',
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
    // url: "https://yourdomain.com/typerush",
    siteName: 'TypeBlitz',
    // images: [
    //   {
    //     url: "https://yourdomain.com/og-image.png", // Replace with your OG image
    //     width: 1200,
    //     height: 630,
    //     alt: "TypeBlitz - Fast Typing Game",
    //   },
    // ],
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Practice Mode | TypeBlitz - Fast Typing Game',
    description:
      'Challenge yourself with different difficulty levels and track your progress as you become a typing master.',
    // images: ["https://yourdomain.com/og-image.png"], // Replace with your image
  },
};

export default async function Layout({ children }: { children: ReactNode }) {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';

  const words = await Promise.all(
    ['easy', 'medium', 'hard'].map((level) =>
      axios
        .get(`${baseUrl}/assets/data/${level}_words.json`)
        .then((res) => res.data)
    )
  );

  const [easy, medium, hard] = words;

  const wordList = {
    easy,
    medium,
    hard,
  };

  return <WordsProvider wordList={wordList}>{children}</WordsProvider>;
}
