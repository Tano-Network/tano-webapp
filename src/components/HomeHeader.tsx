import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { CircleDollarSign } from 'lucide-react';
import { ThemeToggle } from './theme-toggle';

export function HomeHeader() {
  return (
    <header className="py-4 px-4 sm:px-6 lg:px-8 border-b bg-card/50 backdrop-blur-lg border-border/50 sticky top-0 z-40">
      <div className="container mx-auto flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2 font-bold text-xl text-foreground">
          <CircleDollarSign className="h-8 w-8 text-primary" />
          <span>Tano Finance</span>
        </Link>
        <div className="flex items-center gap-4">
          <Button asChild className="bg-primary hover:bg-primary/90 text-primary-foreground font-semibold">
            <Link href="/vault">Launch App</Link>
          </Button>
          <ThemeToggle />
        </div>
      </div>
    </header>
  );
}
