import Image from 'next/image';
import Link from 'next/link';

export default function Home() {
  return (
    <div className="grid grid-rows-[20px_1fr_20px] items-center justify-items-center min-h-screen p-8 pb-20 gap-16 sm:p-20 font-[family-name:var(--font-geist-sans)]">
      <main className="flex flex-col gap-[32px] row-start-2 items-center sm:items-center text-center sm:text-left">
        <Image
          src="/assets/icons/logo.svg"
          alt="TypeBlitz logo"
          width={120}
          height={120}
          priority
        />
        <div className="flex flex-col gap-2">
          <h1 className="text-3xl font-bold tracking-tight">
            Welcome to TypeBlitz ⚡
          </h1>
          <p className="text-base text-muted-foreground max-w-md">
            Choose a mode to begin your typing challenge:
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
          <Link
            href="/practice"
            className="rounded-full border border-black/[.08] dark:border-white/[.145] transition-colors flex items-center justify-center text-sm sm:text-base font-medium px-5 h-12 w-full sm:w-auto hover:bg-[#f2f2f2]"
          >
            Practice Mode
          </Link>
          <Link
            href="/timeless"
            className="rounded-full border border-black/[.08] dark:border-white/[.145] transition-colors flex items-center justify-center text-sm sm:text-base font-medium px-5 h-12 w-full sm:w-auto hover:bg-[#f2f2f2]"
          >
            Timeless Typing
          </Link>
          <Link
            href="/arena"
            className="rounded-full border border-black/[.08] dark:border-white/[.145] transition-colors flex items-center justify-center text-sm sm:text-base font-medium px-5 h-12 w-full sm:w-auto hover:bg-[#f2f2f2]"
          >
            Type Arena
          </Link>
        </div>
      </main>

      <footer className="row-start-3 text-sm text-muted-foreground">
        <p>© {new Date().getFullYear()} TypeBlitz</p>
      </footer>
    </div>
  );
}
