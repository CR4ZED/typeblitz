import { ReactNode } from 'react';

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

export default function Layout({ children }: { children: ReactNode }) {
  return <>{children}</>;
}
