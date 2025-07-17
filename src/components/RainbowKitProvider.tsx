"use client"

import type * as React from "react"
import { RainbowKitProvider, darkTheme, lightTheme, getDefaultConfig } from "@rainbow-me/rainbowkit"
import { WagmiProvider, http } from "wagmi"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { useTheme } from "next-themes"

import { mainnet, sepolia, polygon, optimism, arbitrum, base } from "wagmi/chains"

const chains = [mainnet, sepolia, polygon, optimism, arbitrum, base] as const

const config = getDefaultConfig({
  appName: "Tano Finance",
  projectId: process.env.NEXT_PUBLIC_WC_PROJECT_ID || "YOUR_PROJECT_ID",
  chains,
  transports: Object.fromEntries(chains.map((chain) => [chain.id, http()])),
})

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      retry: 3,
    },
  },
})

function RainbowKitThemeProvider({ children }: { children: React.ReactNode }) {
  const { theme } = useTheme()

  const rainbowTheme =
    theme === "dark"
      ? darkTheme({
          accentColor: "#8B5CF6",
          accentColorForeground: "white",
          borderRadius: "large",
          fontStack: "system",
          overlayBlur: "small",
        })
      : lightTheme({
          accentColor: "#4F46E5",
          accentColorForeground: "white",
          borderRadius: "large",
          fontStack: "system",
          overlayBlur: "small",
        })

  return (
    <RainbowKitProvider theme={rainbowTheme} coolMode>
      {children}
    </RainbowKitProvider>
  )
}

export function Web3Providers({ children }: { children: React.ReactNode }) {
  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <RainbowKitThemeProvider>{children}</RainbowKitThemeProvider>
      </QueryClientProvider>
    </WagmiProvider>
  )
}
