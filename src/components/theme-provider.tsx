"use client"

import * as React from "react"
import { ThemeProvider as NextThemesProvider } from "next-themes"
import { type ThemeProviderProps } from "next-themes/dist/types"

export function ThemeProvider({ children, ...props }: ThemeProviderProps) {
  return (
    <NextThemesProvider
      {...props}
      themes={[
        "light",
        "dark",
        "system",
        "light-purple",
        "dark-purple",
        "light-blue",
        "dark-blue",
        "light-green",
        "dark-green",
        "light-red",
        "dark-red",
        "light-orange",
        "dark-orange",
        "light-yellow",
        "dark-yellow",
        "light-pink",
        "dark-pink",
        "light-indigo",
        "dark-indigo",
      ]}
      attribute="class"
      defaultTheme="system"
      enableSystem
    >
      {children}
    </NextThemesProvider>
  )
}
