import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import './globals.css';

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
  display: 'swap',
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
  display: 'swap',
});

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  metadataBase: new URL('https://typeblitz.com'),
  title: {
    default: 'TypeBlitz – Master Speed Typing Game Online',
    template: '%s | TypeBlitz',
  },
  description:
    'Play TypeBlitz, the ultimate online typing game! Boost your typing speed, accuracy, and compete in real-time multiplayer typing races. Perfect for students, professionals, and anyone looking to improve keyboard skills. Free, fun, and challenging!',
  keywords: [
    'typing game',
    'online typing game',
    'typing speed test',
    'multiplayer typing game',
    'typing practice',
    'typing challenge',
    'keyboard skills',
    'improve typing speed',
    'typeblitz',
    'typing competition',
    'typing for kids',
    'typing for adults',
    'free typing game',
    'fast typing test',
    'typing accuracy',
    'learn to type',
    'touch typing',
    'typing races',
    'typing leaderboard',
  ],
  authors: [
    { name: 'Ankush Jha', url: 'https://github.com/cr4zed' },
    // { name: 'TypeBlitz Team', url: 'https://typeblitz.com/about' },
  ],
  creator: 'Ankush Jha',
  publisher: 'TypeBlitz',
  robots: {
    index: true,
    follow: true,
    nocache: false,
    'max-snippet': -1,
    'max-image-preview': 'large',
    'max-video-preview': -1,
  },
  alternates: {
    canonical: 'https://typeblitz.com',
    languages: {
      'en-US': 'https://typeblitz.com',
      // Add more languages as you localize
    },
  },
  openGraph: {
    title: 'TypeBlitz – Master Speed Typing Game Online',
    description:
      'Boost your typing speed and accuracy with TypeBlitz. Compete in multiplayer typing races or practice solo. Track your progress and become a typing champion!',
    url: 'https://typeblitz.com',
    siteName: 'TypeBlitz',
    locale: 'en_US',
    type: 'website',
    // images: [
    //   {
    //     url: 'https://typeblitz.com/og-image.png',
    //     width: 1200,
    //     height: 630,
    //     alt: 'TypeBlitz – Online Typing Game Screenshot',
    //   },
    // ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'TypeBlitz – Master Speed Typing Game',
    description:
      'Sharpen your typing skills with fun speed challenges, multiplayer competitions, and real-time leaderboards. Join TypeBlitz now!',
    // images: ['https://typeblitz.com/og-image.png'],
    creator: '@typeblitzgame',
  },
  icons: {
    icon: '/favicon.ico',
    apple: '/apple-touch-icon.png',
  },
  category: 'Games',
  applicationName: 'TypeBlitz',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased min-h-screen bg-background text-foreground`}
      >
        {children}
      </body>
    </html>
  );
}
