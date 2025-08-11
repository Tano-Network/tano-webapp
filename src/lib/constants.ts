import { sepolia } from "wagmi/chains"
export const SUPPORTED_CHAINS = {
  MAINNET: 1,
  SEPOLIA: 11155111,
  POLYGON: 137,
  OPTIMISM: 10,
  ARBITRUM: 42161,
  BASE: 8453,
} as const;

export const CONTRACT_ADDRESSES = {
  [SUPPORTED_CHAINS.SEPOLIA]: {
    TDOGE_ASSET_MANAGEMENT: "0x6183367a204F2E2E9638d2ee5fDb281dB6f42F48",
    TDOGE_TOKEN: "0x46507E8929Fe9C20c8914fc9036829F6e7740D9D",
    TDOGE_STAKING_POOL: "0x839D1424D64ad061e9f612a5f9A438fe9619D5B6",
    TLTC_TOKEN: "0xC1819d63807e34bb4a120abF1eF58a6D140964Ec",
    TLTC_STAKING_POOL: "0x479641cb71FC11646e551e1F578707a7bBA673a8",
    TLTC_ASSET_MANAGEMENT: "0xA4F45B2628f2cFac02d2E8f3C2267e87c5e02BFf",
    TBCH_TOKEN: "0x0000000000000000000000000000000000000000",
    TBCH_STAKING_POOL: "0x0000000000000000000000000000000000000000",
    TBCH_ASSET_MANAGEMENT: "0x0000000000000000000000000000000000000000",
  },
  // Add other networks as needed
} satisfies Record<number, Record<string, `0x${string}`>>;

export const EXPLORER_URLS = {
  [SUPPORTED_CHAINS.MAINNET]: "https://etherscan.io",
  [SUPPORTED_CHAINS.SEPOLIA]: "https://sepolia.etherscan.io",
  [SUPPORTED_CHAINS.POLYGON]: "https://polygonscan.com",
  [SUPPORTED_CHAINS.OPTIMISM]: "https://optimistic.etherscan.io",
  [SUPPORTED_CHAINS.ARBITRUM]: "https://arbiscan.io",
  [SUPPORTED_CHAINS.BASE]: "https://basescan.org",
} as const;

export const VAULTS = [
  {
    id: "tdoge",
    name: "tDOGE Vault",
    asset: "tDOGE",
    coin: "DOGE",
    tokenAddress: CONTRACT_ADDRESSES[SUPPORTED_CHAINS.SEPOLIA].TDOGE_TOKEN,
    assetManagementAddress: CONTRACT_ADDRESSES[SUPPORTED_CHAINS.SEPOLIA].TDOGE_ASSET_MANAGEMENT,
    nativeChainName: "dogecoin",
    nativeAddress: "DUSUKMHowSXK13YixvC12AyqXr5tRUdK6e",
    icon: "https://assets.coingecko.com/coins/images/5/thumb/dogecoin.png",
    color: "from-yellow-500 to-orange-500",
    description: "Redeem DOGE from your tDOGE balance on the Dogecoin testnet.",
    coinGeckoId: "dogecoin",
    explorerUrl: "https://sochain.com/tx/DOGETEST",
    evmChain: sepolia.name, // Added
    evmChainId: sepolia.id, // Added
  },
  {
    id: "tltc",
    name: "tLTC Vault",
    asset: "tLTC",
    coin: "LTC",
    tokenAddress: CONTRACT_ADDRESSES[SUPPORTED_CHAINS.SEPOLIA].TLTC_TOKEN,
    assetManagementAddress: CONTRACT_ADDRESSES[SUPPORTED_CHAINS.SEPOLIA].TLTC_ASSET_MANAGEMENT,
    nativeChainName: "Litecoin Testnet",
    nativeAddress: "tltc1qw508d6qejxtdg4y5r3zarvary0c5xw7kygt080",
    icon: "https://assets.coingecko.com/coins/images/2/thumb/litecoin.png",
    color: "from-gray-400 to-gray-600",
    description: "Redeem Litecoin from your tLTC balance on the Litecoin testnet.",
    coinGeckoId: "litecoin",
    explorerUrl: "https://sochain.com/testnet/ltc",
    evmChain: sepolia.name, // Added
    evmChainId: sepolia.id, // Added
  },
  {
    id: "tbch",
    name: "tBCH Vault",
    asset: "tBCH",
    coin: "BCH",
    tokenAddress: CONTRACT_ADDRESSES[SUPPORTED_CHAINS.SEPOLIA].TBCH_TOKEN,
    assetManagementAddress: CONTRACT_ADDRESSES[SUPPORTED_CHAINS.SEPOLIA].TBCH_ASSET_MANAGEMENT,
    nativeChainName: "Bitcoin Cash Testnet",
    nativeAddress: "bchtest:qr6m7j9njldwwzlg9v7v53unlr4jkmx6eylep8ekg2",
    icon: "https://assets.coingecko.com/coins/images/780/thumb/bitcoin-cash-circle.png",
    color: "bg-green-500",
    description: "Redeem BCH from your tBCH balance on the Bitcoin Cash testnet.",
    coinGeckoId: "bitcoin-cash",
    explorerUrl: "https://www.blocktrail.com/tBCC",
    evmChain: sepolia.name, // Added
    evmChainId: sepolia.id, // Added
  },
]
export const DEFAULT_INSTITUTIONAL_NATIVE_ADDRESS = "INSTITUTIONAL_DEFAULT_ADDRESS_PLACEHOLDER"; // Placeholder for institutional default address