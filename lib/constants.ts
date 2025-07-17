export const SUPPORTED_CHAINS = {
  MAINNET: 1,
  SEPOLIA: 11155111,
  POLYGON: 137,
  OPTIMISM: 10,
  ARBITRUM: 42161,
  BASE: 8453,
} as const

export const CONTRACT_ADDRESSES = {
  [SUPPORTED_CHAINS.SEPOLIA]: {
    ASSET_MANAGEMENT: "0x6183367a204F2E2E9638d2ee5fDb281dB6f42F48",
    TDOGE_TOKEN: "0x46507E8929Fe9C20c8914fc9036829F6e7740D9D",
  },
  // Add other networks as needed
} as const

export const EXPLORER_URLS = {
  [SUPPORTED_CHAINS.MAINNET]: "https://etherscan.io",
  [SUPPORTED_CHAINS.SEPOLIA]: "https://sepolia.etherscan.io",
  [SUPPORTED_CHAINS.POLYGON]: "https://polygonscan.com",
  [SUPPORTED_CHAINS.OPTIMISM]: "https://optimistic.etherscan.io",
  [SUPPORTED_CHAINS.ARBITRUM]: "https://arbiscan.io",
  [SUPPORTED_CHAINS.BASE]: "https://basescan.org",
} as const
