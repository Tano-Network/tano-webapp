import type React from "react"
import type { Metadata } from "next"
import "./globals.css"
import { Toaster } from "@/components/ui/toaster"
import { ThemeProvider } from "@/components/theme-provider"
import { Web3Providers } from "@/components/RainbowKitProvider"

export const metadata: Metadata = {
  title: "Tano Finance - Decentralized Finance Platform",
  description:
    "Unlock the power of your cryptocurrency with Tano Finance. Earn yield and participate in a decentralized financial ecosystem.",
  keywords: ["DeFi", "Cryptocurrency", "Yield Farming", "Blockchain", "Finance"],
  authors: [{ name: "Tano Finance Team" }],
  viewport: "width=device-width, initial-scale=1",
  openGraph: {
    title: "Tano Finance - Decentralized Finance Platform",
    description: "Earn yield and participate in the future of decentralized finance",
    type: "website",
  },
    generator: 'v0.dev'
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="font-sans bg-grid-pattern antialiased">
        <Web3Providers>
          <ThemeProvider attribute="class" defaultTheme="dark" enableSystem disableTransitionOnChange>
            <div className="min-h-screen bg-background transition-colors duration-300">{children}</div>
            <Toaster />
          </ThemeProvider>
        </Web3Providers>
      </body>
    </html>
  )
}
