import { createConfig, http } from 'wagmi'
import { sepolia } from 'wagmi/chains'
import { injected } from 'wagmi/connectors'

export const config = createConfig({
  chains: [sepolia],
  connectors: [
    injected(), // Supports MetaMask, Coinbase Extension, Brave, etc.
  ],
  transports: {
    [sepolia.id]: http(), // Uses default RPC (can customize)
  },
  ssr: true, // only if you're using Next.js SSR
})
