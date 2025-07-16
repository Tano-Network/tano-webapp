// app/providers.tsx
'use client'; // This component will contain client-side providers

import * as React from 'react';
import {
  RainbowKitProvider,
  getDefaultConfig,
  lightTheme, // Or darkTheme, midnightTheme, or createTheme
  darkTheme,
} from '@rainbow-me/rainbowkit';
import {
  argentWallet,
  trustWallet,
  ledgerWallet,
} from '@rainbow-me/rainbowkit/wallets';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { WagmiProvider } from 'wagmi';
import {
  arbitrum,
  base,
  mainnet,
  optimism,
  polygon,
  sepolia, // Added a testnet for development
} from 'wagmi/chains';

// --- Configuration for Wagmi and RainbowKit ---

// You should get your PROJECT_ID from WalletConnect Cloud:
// https://cloud.walletconnect.com/
// It is required to provide the `projectId` for the connectors to work.
const projectId = process.env.NEXT_PUBLIC_WC_PROJECT_ID || 'YOUR_WALLETCONNECT_PROJECT_ID'; // Replace with your actual project ID

const config = getDefaultConfig({
  appName: 'Tano App',
  projectId,
  chains: [
    mainnet,
    polygon,
    optimism,
    arbitrum,
    base,
    sepolia, // Good for testing
    ...(process.env.NEXT_PUBLIC_ENABLE_TESTNETS === 'true' ? [sepolia] : []),
  ],
  ssr: true, // Important for Next.js App Router
});

const queryClient = new QueryClient();

// --- Your Custom Theme (choose one) ---
// Option A: Using a built-in theme with customizations
const myRainbowKitTheme = lightTheme({
  accentColor: '#4F46E5', // A vibrant purple/blue
  accentColorForeground: 'white',
  borderRadius: 'large', // Makes elements more rounded
  fontStack: 'system', // Uses native system fonts
  overlayBlur: 'small', // A subtle blur for the modal backdrop
});

// Option B: Using a dark theme (if your app's base theme is dark)
const myDarkRainbowKitTheme = darkTheme({
  accentColor: '#8B5CF6', // A slightly brighter purple for dark mode
  accentColorForeground: 'white',
  borderRadius: 'large',
  fontStack: 'system',
  overlayBlur: 'small',
});

// Option C: Create a fully custom theme (uncomment and modify if needed)
/*
const customTanoTheme = createTheme({
  colors: {
    accentColor: '#4F46E5',
    accentColorForeground: '#FFFFFF',
    actionButtonBorder: '#E0E0E0',
    // ... all other color properties as in previous example
  },
  fonts: {
    body: 'Inter, sans-serif',
  },
  radii: {
    actionButton: '9999px',
    connectButton: '9999px',
    modal: '12px',
    // ... other radii
  },
  shadows: {
    connectButton: '0px 2px 8px rgba(0, 0, 0, 0.1)',
    // ... other shadows
  },
});
*/

// --- Providers Component ---
export function Providers({ children }: { children: React.ReactNode }) {
  // Determine which theme to use based on your app's current theme mode
  // You might need to read your theme state (light/dark) from your global context
  // For simplicity, let's assume we're always using `myRainbowKitTheme` for now,
  // or you can conditionally apply `darkTheme` if your app supports it.
  const currentTheme = myRainbowKitTheme; // Change to myDarkRainbowKitTheme or customTanoTheme if preferred

  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <RainbowKitProvider theme={currentTheme}>
          {children}
        </RainbowKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
}