"use client"
import { useState, Suspense, useEffect } from "react"
import type React from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { X, Menu, Wallet, TrendingUp, ArrowRight } from "lucide-react"
import { cn } from "@/lib/utils"
import { RainbowConnectButton } from "@/components/RainbowConnectButton"
import { ThemeToggle } from "@/components/theme-toggle"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { useAccount } from "wagmi"
import { LoadingSpinner } from "@/components/LoadingSpinner"
import { PageTransition } from "@/components/PageTransition"

function AppHeaderSkeleton() {
  return (
    <nav className="bg-card/50 backdrop-blur-lg border-b border-border/50 sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center space-x-8">
            <Skeleton className="h-8 w-16" />
            <div className="hidden md:flex space-x-4">
              <Skeleton className="h-8 w-16" />
              <Skeleton className="h-8 w-16" />
            </div>
          </div>
          <div className="flex items-center gap-4">
            <Skeleton className="h-10 w-32" />
            <Skeleton className="h-10 w-10" />
          </div>
        </div>
      </div>
    </nav>
  )
}

function AppHeader() {
  const pathname = usePathname()
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [isTransitioning, setIsTransitioning] = useState(false)

  const navLinks = [
    {
      href: "/vault",
      label: "Vault",
      icon: Wallet,
      badge: "New",
    },
    {
      href: "/earn",
      label: "Earn",
      icon: TrendingUp,
      badge: null,
    },
  ]

  const closeMobileMenu = () => setIsMobileMenuOpen(false)

  const handleNavigation = (href: string) => {
    if (pathname !== href) {
      setIsTransitioning(true)
      closeMobileMenu()
      // Let the page transition handle the loading state
      setTimeout(() => setIsTransitioning(false), 300)
    }
  }

  return (
    <nav className="bg-card/50 backdrop-blur-lg border-b border-border/50 sticky top-0 z-40 transition-all duration-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center">
            <Link
              href="/"
              className="flex-shrink-0 text-foreground font-bold text-2xl cursor-pointer hover:text-primary transition-colors duration-200 group"
              onClick={() => handleNavigation("/")}
            >
              <span className="group-hover:scale-105 transition-transform duration-200 inline-block">Tano</span>
            </Link>
            <div className="hidden md:block ml-10">
              <div className="flex items-baseline space-x-4">
                {navLinks.map((link) => {
                  const Icon = link.icon
                  const isActive = pathname.startsWith(link.href)
                  return (
                    <Link
                      key={link.href}
                      href={link.href}
                      onClick={() => handleNavigation(link.href)}
                      className={cn(
                        "group relative px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 flex items-center gap-2",
                        isActive
                          ? "bg-primary/10 text-primary border border-primary/20 shadow-sm"
                          : "text-muted-foreground hover:bg-secondary/50 hover:text-secondary-foreground hover:scale-105",
                      )}
                    >
                      <Icon size={16} className="transition-transform group-hover:scale-110" />
                      {link.label}
                      {link.badge && (
                        <Badge variant="secondary" className="ml-1 text-xs animate-pulse">
                          {link.badge}
                        </Badge>
                      )}
                      {isActive && (
                        <div className="absolute inset-x-0 -bottom-px h-px bg-gradient-to-r from-transparent via-primary to-transparent" />
                      )}
                    </Link>
                  )
                })}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="hidden sm:block">
              <RainbowConnectButton />
            </div>
            <ThemeToggle />
            <Button
              variant="ghost"
              size="icon"
              className="md:hidden hover:scale-105 transition-transform"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            >
              <div className="relative w-5 h-5">
                <Menu
                  size={20}
                  className={cn(
                    "absolute transition-all duration-200",
                    isMobileMenuOpen ? "rotate-90 opacity-0" : "rotate-0 opacity-100",
                  )}
                />
                <X
                  size={20}
                  className={cn(
                    "absolute transition-all duration-200",
                    isMobileMenuOpen ? "rotate-0 opacity-100" : "-rotate-90 opacity-0",
                  )}
                />
              </div>
              <span className="sr-only">Toggle menu</span>
            </Button>
          </div>
        </div>
      </div>

      {/* Mobile menu with smooth animation */}
      <div
        className={cn(
          "md:hidden transition-all duration-300 ease-in-out overflow-hidden",
          isMobileMenuOpen ? "max-h-96 opacity-100" : "max-h-0 opacity-0",
        )}
      >
        <div className="px-4 pt-2 pb-3 space-y-1 bg-card/80 backdrop-blur-sm border-t border-border/50">
          {navLinks.map((link, index) => {
            const Icon = link.icon
            const isActive = pathname.startsWith(link.href)
            return (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => handleNavigation(link.href)}
                className={cn(
                  "flex items-center gap-3 px-3 py-3 rounded-lg text-base font-medium transition-all duration-200",
                  "transform hover:scale-[1.02] hover:shadow-sm",
                  isActive
                    ? "bg-primary/10 text-primary border border-primary/20"
                    : "text-muted-foreground hover:bg-secondary/50 hover:text-secondary-foreground",
                )}
                style={{
                  animationDelay: `${index * 50}ms`,
                  animation: isMobileMenuOpen ? "slideInLeft 0.3s ease-out forwards" : undefined,
                }}
              >
                <Icon size={18} />
                {link.label}
                {link.badge && (
                  <Badge variant="secondary" className="ml-auto text-xs">
                    {link.badge}
                  </Badge>
                )}
                <ArrowRight size={16} className="ml-auto opacity-50" />
              </Link>
            )
          })}
          <div className="pt-2 border-t border-border/50">
            <RainbowConnectButton />
          </div>
        </div>
      </div>

      {/* Loading overlay for transitions */}
      {isTransitioning && (
        <div className="absolute inset-0 bg-background/50 backdrop-blur-sm flex items-center justify-center z-50">
          <LoadingSpinner size="sm" />
        </div>
      )}
    </nav>
  )
}

function WalletGuard({ children }: { children: React.ReactNode }) {
  const { isConnected, isConnecting } = useAccount()
  const router = useRouter()

  if (isConnecting) {
    return (
      <div className="relative min-h-full">
        <div className="className="relative min-h-full"">
          <LoadingSpinner size="lg" />
          <p className="text-muted-foreground">Connecting wallet...</p>
        </div>
      </div>
    )
  }

  if (!isConnected) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <div className="bg-card border border-border shadow-lg rounded-xl p-8 max-w-md w-full text-center space-y-6">
        <div className="flex justify-center">
          <div className="bg-primary/10 p-4 rounded-full text-primary">
            <Wallet className="w-8 h-8" />
          </div>
        </div>
        <h2 className="text-xl font-semibold text-foreground">Wallet Not Connected</h2>
        <p className="text-muted-foreground text-sm">
          Please connect your wallet to continue using the app.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link href="/" className="w-full sm:w-auto">
            <Button variant="outline" className="w-full">
              Go to Homepage
            </Button>
          </Link>
          <div className="w-full sm:w-auto">
            <RainbowConnectButton />
          </div>
        </div>
      </div>
    </div>
  )
}


  return <>{children}</>
}


export default function AppLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Suspense fallback={<AppHeaderSkeleton />}>
        <AppHeader />
      </Suspense>
      <main className="flex-1 relative">
        <WalletGuard>
          <PageTransition>{children}</PageTransition>
        </WalletGuard>
      </main>
    </div>
  )
}
