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

const myRainbowKitTheme = lightTheme({
  accentColor: '#4F46E5', // A vibrant purple/blue
  accentColorForeground: 'white',
  borderRadius: 'large', // Makes elements more rounded
  fontStack: 'system', // Uses native system fonts
  overlayBlur: 'small', // A subtle blur for the modal backdrop
});

const myDarkRainbowKitTheme = darkTheme({
  accentColor: '#8B5CF6', // A slightly brighter purple for dark mode
  accentColorForeground: 'white',
  borderRadius: 'large',
  fontStack: 'system',
  overlayBlur: 'small',
});



// --- Providers Component ---
export function Providers({ children }: { children: React.ReactNode }) {
  
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