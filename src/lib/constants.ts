import { sepolia } from "wagmi/chains"
import { ZeroAddress } from "ethers";

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
    TDOGE_ASSET_MANAGEMENT: "0xA566F07897D73A232540B5376F04122E2b3547e9",
    TDOGE_TOKEN: "0x7a8f8685dA403b4AA0Ea964aD3dbE8771f0F9E2b",
    TDOGE_STAKING_POOL: "0x66c31f33C340d6916b21433f1d9C74d41323a18d",
    TLTC_TOKEN: "0xC1819d63807e34bb4a120abF1eF58a6D140964Ec",
    // TLTC_STAKING_POOL: "0x479641cb71FC11646e551e1F578707a7bBA673a8",
    TLTC_STAKING_POOL: "0x0000000000000000000000000000000000000000",
    TLTC_ASSET_MANAGEMENT: "0xA4F45B2628f2cFac02d2E8f3C2267e87c5e02BFf",
    // TLTC_ASSET_MANAGEMENT: "0x0000000000000000000000000000000000000000", // Placeholder
    TBCH_TOKEN: "0x0000000000000000000000000000000000000000",
    TBCH_STAKING_POOL: "0x0000000000000000000000000000000000000000",
    TBCH_ASSET_MANAGEMENT: "0x0000000000000000000000000000000000000000",
    TXRP_TOKEN: "0x165d03D3Df6443B87b4B7a6268fd13d37C5e3127",
    TXRP_STAKING_POOL: "0x5c7B95E596A7190a6796975056562EbC457A80D6",
    TXRP_ASSET_MANAGEMENT: "0x25920221ff112bb8902Bc0A82a6A8744717A8323",
    TADA_TOKEN: "0xF81e5CA71ACbF721578c574Ed65Fe3DE1a6151A5", 
    TADA_ASSET_MANAGEMENT: "0x0B6F45a00D5f28A8641B64b95a396C248D72339e", 
    TADA_STAKING_POOL: "0x705e902C664aDc3e9C672Ca2dF07067111b88451", 
  },
} satisfies Record<number, Record<string, `0x${string}`>>;

export const EXPLORER_URLS = {
  [SUPPORTED_CHAINS.MAINNET]: "https://etherscan.io",
  [SUPPORTED_CHAINS.SEPOLIA]: "https://sepolia.etherscan.io",
  [SUPPORTED_CHAINS.POLYGON]: "https://polygonscan.com",
  [SUPPORTED_CHAINS.OPTIMISM]: "https://optimistic.etherscan.io",
  [SUPPORTED_CHAINS.ARBITRUM]: "https://arbiscan.io",
  [SUPPORTED_CHAINS.BASE]: "https://basescan.org",
} as const;

export interface Vault {
  id: string;
  name: string;
  asset: string;
  coin: string;
  tokenAddress: `0x${string}`;
  assetManagementAddress: `0x${string}`;
  nativeChainName: string;
  nativeAddress: string;
  icon: string;
  iconChar: string;
  color: string;
  description: string;
  shortDescription: string;
  coinGeckoId: string;
  explorerUrl: string;
  evmChain: string;
  evmChainId: number;
  evmExplorerUrl: string;
  stakingContractAddress: `0x${string}`;
  stakingDecimals: number;
  apy: string;
  stakingStatus: 'active' | 'inactive';
  stakingDescription: string;
}

export const VAULTS: Vault[] = [
  {
    id: "tdoge",
    name: "tDOGE Vault",
    asset: "tDOGE",
    coin: "DOGE",
    tokenAddress: CONTRACT_ADDRESSES[SUPPORTED_CHAINS.SEPOLIA].TDOGE_TOKEN,
    assetManagementAddress: CONTRACT_ADDRESSES[SUPPORTED_CHAINS.SEPOLIA].TDOGE_ASSET_MANAGEMENT,
    nativeChainName: "dogecoin",
    nativeAddress: "DHGrS3MYGyKzRVdMNxziTPF7QXvaYoEndA",
    icon: "https://assets.coingecko.com/coins/images/5/thumb/dogecoin.png",
    iconChar: "Ð",
    color: "from-yellow-500 to-orange-500",
    description: "Redeem DOGE from your tDOGE balance on the Dogecoin testnet.",
    shortDescription: "The original meme coin, now earning yield",
    coinGeckoId: "dogecoin",
    explorerUrl: "https://dogechain.info/",
    evmChain: sepolia.name,
    evmChainId: sepolia.id,
    evmExplorerUrl: EXPLORER_URLS[SUPPORTED_CHAINS.SEPOLIA],
    stakingContractAddress: CONTRACT_ADDRESSES[SUPPORTED_CHAINS.SEPOLIA].TDOGE_STAKING_POOL,
    stakingDecimals: 18,
    apy: "15.2%",
    stakingStatus: CONTRACT_ADDRESSES[SUPPORTED_CHAINS.SEPOLIA].TDOGE_STAKING_POOL !== ZeroAddress ? "active" : "inactive",
    stakingDescription: "Stake your tDOGE to earn rewards",
  },
  // {
  //   id: "tltc",
  //   name: "tLTC Vault",
  //   asset: "tLTC",
  //   coin: "LTC",
  //   tokenAddress: CONTRACT_ADDRESSES[SUPPORTED_CHAINS.SEPOLIA].TLTC_TOKEN,
  //   assetManagementAddress: CONTRACT_ADDRESSES[SUPPORTED_CHAINS.SEPOLIA].TLTC_ASSET_MANAGEMENT,
  //   nativeChainName: "Litecoin Testnet",
  //   nativeAddress: "tltc1qw508d6qejxtdg4y5r3zarvary0c5xw7kygt080",
  //   icon: "https://assets.coingecko.com/coins/images/2/thumb/litecoin.png",
  //   iconChar: "Ł",
  //   color: "from-gray-400 to-gray-600",
  //   description: "Redeem Litecoin from your tLTC balance on the Litecoin testnet.",
  //   shortDescription: "Digital silver for the digital age",
  //   coinGeckoId: "litecoin",
  //   explorerUrl: "https://sochain.com/testnet/ltc",
  //   evmChain: sepolia.name,
  //   evmChainId: sepolia.id,
  //   evmExplorerUrl: EXPLORER_URLS[SUPPORTED_CHAINS.SEPOLIA],
  //   stakingContractAddress: CONTRACT_ADDRESSES[SUPPORTED_CHAINS.SEPOLIA].TLTC_STAKING_POOL,
  //   stakingDecimals: 18,
  //   apy: "0.0%",
  //   stakingStatus: CONTRACT_ADDRESSES[SUPPORTED_CHAINS.SEPOLIA].TLTC_STAKING_POOL !== ZeroAddress ? "active" : "inactive",
  //   stakingDescription: "Stake your tLTC to earn rewards",
  // },
  // {
  //   id: "tbch",
  //   name: "tBCH Vault",
  //   asset: "tBCH",
  //   coin: "BCH",
  //   tokenAddress: CONTRACT_ADDRESSES[SUPPORTED_CHAINS.SEPOLIA].TBCH_TOKEN,
  //   assetManagementAddress: CONTRACT_ADDRESSES[SUPPORTED_CHAINS.SEPOLIA].TBCH_ASSET_MANAGEMENT,
  //   nativeChainName: "Bitcoin Cash Testnet",
  //   nativeAddress: "bchtest:qr6m7j9njldwwzlg9v7v53unlr4jkmx6eylep8ekg2",
  //   icon: "https://assets.coingecko.com/coins/images/780/thumb/bitcoin-cash-circle.png",
  //   iconChar: "₿",
  //   color: "from-green-500 to-emerald-600",
  //   description: "Redeem BCH from your tBCH balance on the Bitcoin Cash testnet.",
  //   shortDescription: "Peer-to-peer electronic cash system",
  //   coinGeckoId: "bitcoin-cash",
  //   explorerUrl: "https://www.blocktrail.com/tBCC",
  //   evmChain: sepolia.name,
  //   evmChainId: sepolia.id,
  //   evmExplorerUrl: EXPLORER_URLS[SUPPORTED_CHAINS.SEPOLIA],
  //   stakingContractAddress: CONTRACT_ADDRESSES[SUPPORTED_CHAINS.SEPOLIA].TBCH_STAKING_POOL,
  //   stakingDecimals: 18,
  //   apy: "0.0%",
  //   stakingStatus: CONTRACT_ADDRESSES[SUPPORTED_CHAINS.SEPOLIA].TBCH_STAKING_POOL !== ZeroAddress ? "active" : "inactive",
  //   stakingDescription: "Stake your tBCH to earn rewards",
  // },
  {
    id: "txrp",
    name: "tXRP Vault",
    asset: "tXRP",
    coin: "XRP",
    tokenAddress: CONTRACT_ADDRESSES[SUPPORTED_CHAINS.SEPOLIA].TXRP_TOKEN,
    assetManagementAddress: CONTRACT_ADDRESSES[SUPPORTED_CHAINS.SEPOLIA].TXRP_ASSET_MANAGEMENT,
    nativeChainName: "XRP Testnet",
    nativeAddress: "rPT1Sjq2YGrBMTttX4GZHjKu9dyfzbpAYe",
    icon: "https://assets.coingecko.com/coins/images/44/thumb/xrp-symbol-white-128.png",
    iconChar: "X",
    color: "from-blue-400 to-indigo-600",
    description: "Redeem XRP from your tXRP balance on the XRP testnet.",
    shortDescription: "The digital asset for payments",
    coinGeckoId: "ripple",
    explorerUrl: "https://xrpscan.com",
    evmChain: sepolia.name,
    evmChainId: sepolia.id,
    evmExplorerUrl: EXPLORER_URLS[SUPPORTED_CHAINS.SEPOLIA],
    stakingContractAddress: CONTRACT_ADDRESSES[SUPPORTED_CHAINS.SEPOLIA].TXRP_STAKING_POOL,
    stakingDecimals: 18,
    apy: "0.0%",
    stakingStatus: CONTRACT_ADDRESSES[SUPPORTED_CHAINS.SEPOLIA].TXRP_STAKING_POOL !== ZeroAddress ? "active" : "inactive",
    stakingDescription: "Stake your tXRP to earn rewards",
  },
  {
    id: "tada",
    name: "tADA Vault",
    asset: "tADA",
    coin: "ADA",
    tokenAddress: CONTRACT_ADDRESSES[SUPPORTED_CHAINS.SEPOLIA].TADA_TOKEN,
    assetManagementAddress: CONTRACT_ADDRESSES[SUPPORTED_CHAINS.SEPOLIA].TADA_ASSET_MANAGEMENT,
    nativeChainName: "Cardano",
    nativeAddress: "addr1qyvxngqhhvzunlxlkw4f9m6nep00spqtmrlvfgynmrq5q7r0mjnf84mnk78ytza3sunyvqs3llehvfjuwvk338d69t2qqag5yl", // Placeholder for Cardano testnet address
    icon: "https://assets.coingecko.com/coins/images/975/thumb/cardano.png", // Cardano icon
    iconChar: "₳",
    color: "from-blue-500 to-white", // Example color for Cardano
    description: "Redeem ADA from your tADA balance on the Cardano blockchain.",
    shortDescription: "Cardano's native asset, now earning yield",
    coinGeckoId: "cardano",
    explorerUrl: "https://testnet.cardanoscan.io/transaction/", // Placeholder for Cardano testnet explorer
    evmChain: sepolia.name,
    evmChainId: sepolia.id,
    evmExplorerUrl: EXPLORER_URLS[SUPPORTED_CHAINS.SEPOLIA],
    stakingContractAddress: CONTRACT_ADDRESSES[SUPPORTED_CHAINS.SEPOLIA].TADA_STAKING_POOL,
    stakingDecimals: 18,
    apy: "0.0%",
    stakingStatus: CONTRACT_ADDRESSES[SUPPORTED_CHAINS.SEPOLIA].TADA_STAKING_POOL !== ZeroAddress ? "active" : "inactive",
    stakingDescription: "Stake your tADA to earn rewards",
  },
]

export const DEFAULT_INSTITUTIONAL_NATIVE_ADDRESS = "INSTITUTIONAL_DEFAULT_ADDRESS_PLACEHOLDER"; // Placeholder for institutional default address
