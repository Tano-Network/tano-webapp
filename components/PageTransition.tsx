"use client"
import { usePathname } from "next/navigation"
import type React from "react"

import { useEffect, useState } from "react"
import { cn } from "@/lib/utils"

export function PageTransition({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const [isTransitioning, setIsTransitioning] = useState(false)
  const [displayChildren, setDisplayChildren] = useState(children)

  useEffect(() => {
    setIsTransitioning(true)

    const timer = setTimeout(() => {
      setDisplayChildren(children)
      setIsTransitioning(false)
    }, 150)

    return () => clearTimeout(timer)
  }, [pathname, children])

  return (
    <div className="relative min-h-full">
      <div
        className={cn(
          "transition-all duration-300 ease-in-out",
          isTransitioning
            ? "opacity-0 transform translate-y-2 scale-[0.98]"
            : "opacity-100 transform translate-y-0 scale-100",
        )}
      >
        {displayChildren}
      </div>

      {/* Transition overlay */}
      {isTransitioning && (
        <div className="absolute inset-0 bg-background/20 backdrop-blur-[1px] z-10 pointer-events-none" />
      )}
    </div>
  )
}
