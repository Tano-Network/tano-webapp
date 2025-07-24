import Link from "next/link"
import { Button } from "@/components/ui/button"
import { CircleDollarSign, Github, Twitter } from "lucide-react"
import { ThemeToggle } from "./theme-toggle"

export function HomeHeader() {
  return (
    <header className="py-4 px-4 sm:px-6 lg:px-8 border-b bg-card/50 backdrop-blur-lg border-border/50 sticky top-0 z-50">
      <div className="container mx-auto flex items-center justify-between">
        <Link
          href="/"
          className="flex items-center gap-2 font-bold text-xl text-foreground hover:text-primary transition-colors"
        >
          <div className="bg-gradient-to-br from-primary to-purple-500 p-2 rounded-lg">
            <CircleDollarSign className="h-6 w-6 text-white" />
          </div>
          <span>Tano Finance</span>
        </Link>

        <div className="flex items-center gap-4">
          <div className="hidden md:flex items-center gap-2">
            <Button variant="ghost" size="icon" asChild>
              <Link href="https://github.com" target="_blank" rel="noopener noreferrer">
                <Github className="h-4 w-4" />
                <span className="sr-only">GitHub</span>
              </Link>
            </Button>
            <Button variant="ghost" size="icon" asChild>
              <Link href="https://twitter.com" target="_blank" rel="noopener noreferrer">
                <Twitter className="h-4 w-4" />
                <span className="sr-only">Twitter</span>
              </Link>
            </Button>
          </div>

          <Button asChild className="bg-primary hover:bg-primary/90 text-primary-foreground font-semibold">
            <Link href="/vault">Launch App</Link>
          </Button>
          <ThemeToggle />
        </div>
      </div>
    </header>
  )
}
