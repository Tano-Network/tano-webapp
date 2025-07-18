'use client';

import '@rainbow-me/rainbowkit/styles.css';
import { getDefaultConfig, RainbowKitProvider } from '@rainbow-me/rainbowkit';
import { WagmiProvider } from 'wagmi';
import { mainnet, polygon, optimism, arbitrum, base, sepolia } from 'wagmi/chains';
import { QueryClientProvider, QueryClient } from "@tanstack/react-query";

// Set up chains and generate config
const config = getDefaultConfig({
  appName: process.env.NEXT_PUBLIC_PROJECT_NAME??'',
  projectId: process.env.NEXT_PUBLIC_PROJECT_ID??'', // Get one from WalletConnect Cloud
  chains: [mainnet, polygon, optimism, arbitrum, base , sepolia],
  ssr: true, // If your app is server-side rendered
});

const queryClient = new QueryClient();

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <RainbowKitProvider>
          {children}
        </RainbowKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
}