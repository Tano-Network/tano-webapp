'use client';

import * as React from 'react';
import {
  RainbowKitProvider,
  darkTheme,
  getDefaultConfig,
} from '@rainbow-me/rainbowkit';
import {
  WagmiProvider,
  http,
} from 'wagmi';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

import {
  mainnet,
  sepolia,
  goerli,
  optimism,
  optimismGoerli,
  polygon,
  polygonMumbai,
  arbitrum,
  arbitrumGoerli,
  base,
  baseGoerli,
  baseSepolia
 
} from 'wagmi/chains';

const chains = [
  mainnet,
  sepolia,
  goerli,
  polygon,
  polygonMumbai,
  optimism,
  optimismGoerli,
  arbitrum,
  arbitrumGoerli,
  base,
  baseGoerli,
  baseSepolia
];

const config = getDefaultConfig({
  appName: 'T-Doge Finance',
  projectId: 'YOUR_PROJECT_ID', // 🔁 Replace with actual WalletConnect project ID
  chains: [
  mainnet,
  sepolia,
  goerli,
  polygon,
  polygonMumbai,
  optimism,
  optimismGoerli,
  arbitrum,
  arbitrumGoerli,
  base,
  baseGoerli,
  baseSepolia
],
  transports: Object.fromEntries(
    chains.map((chain) => [chain.id, http()])
  ),
});

const queryClient = new QueryClient();

export function Web3Providers({ children }: { children: React.ReactNode }) {
  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <RainbowKitProvider
          // theme={darkTheme()}
          coolMode
        >
          {children}
        </RainbowKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
}
