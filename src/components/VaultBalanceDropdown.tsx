"use client"

import * as React from "react"
import { Button } from "@/components/ui/button"
import {
  Wallet,
  Dog,
  Coins,
  Bitcoin,
  Banknote,
  Plus,
} from "lucide-react"
import { CONTRACT_ADDRESSES, SUPPORTED_CHAINS } from "@/lib/constants"
import { useAccount, useBalance } from "wagmi"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu"
import { cn, formatNumberForTable } from "@/lib/utils"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { getCoinPrices } from "@/app/actions/get-prices"

const ZERO_ADDRESS = "0x0000000000000000000000000000000000000000"

// inline icon mapping
const vaultIcons: Record<string, React.ReactNode> = {
  TDOGE: <Dog className="h-5 w-5 text-yellow-500" />,
  TLTC: <Coins className="h-5 w-5 text-gray-400" />,
  TBCH: <Bitcoin className="h-5 w-5 text-green-500" />,
  TXRP: <Banknote className="h-5 w-5 text-blue-500" />,
}

// symbol → coingecko key
const priceMap: Record<string, keyof Awaited<ReturnType<typeof getCoinPrices>>> = {
  TDOGE: "dogecoin",
  TLTC: "litecoin",
  TBCH: "bitcoin-cash",
  TXRP: "ripple",
}

interface VaultBalanceItemProps {
  symbol: string;
  token: `0x${string}`;
  address: `0x${string}` | undefined;
  prices: Record<string, number>;
  onValueChange: (value: number) => void;
  onAddToMetaMask: (symbol: string, token: `0x${string}`, decimals: number) => void;
  currentChainId: number;
  tokenChainId: number;
}

function VaultBalanceItem({ symbol, token, address, prices, onValueChange, onAddToMetaMask, currentChainId, tokenChainId }: VaultBalanceItemProps) {
  const shouldFetch = address && tokenChainId === currentChainId;

  const { data: balanceData } = useBalance({
    address,
    token,
    enabled: shouldFetch,
  });
  const { data: tokenData } = useBalance({
    address: token,
    enabled: shouldFetch,
  });

  const balance = balanceData?.formatted ? parseFloat(balanceData.formatted) : 0
  const decimals = tokenData?.decimals ?? 18

  const priceKey = priceMap[symbol]
  const usdValue = priceKey && prices[priceKey] ? balance * prices[priceKey] : 0

  React.useEffect(() => {
    onValueChange(usdValue)
  }, [usdValue, onValueChange])

  if (!shouldFetch) return null;

  return (
    <DropdownMenuItem
      key={symbol}
      className={cn(
        "flex items-center justify-between rounded-lg p-3",
        "hover:bg-secondary/50 hover:scale-[1.01] transition-transform"
      )}
    >
      {vaultIcons[symbol] ?? <Wallet className="h-5 w-5" />}
      <div className="flex-1 ml-3">
        <p className="text-sm font-medium">{symbol}</p>
        <p className="text-xs text-muted-foreground">
          {formatNumberForTable(balance)} {symbol}
        </p>
        {usdValue > 0 && (
          <p className="text-xs text-muted-foreground">
            ${formatNumberForTable(usdValue)}
          </p>
        )}
      </div>

      {/* Add to MetaMask */}
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6"
              onClick={() =>
                onAddToMetaMask(symbol, token, decimals)
              }
            >
              <Plus className="h-3 w-3" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Add {symbol} to MetaMask</TooltipContent>
        </Tooltip>
      </TooltipProvider>
    </DropdownMenuItem>
  )
}

export function VaultBalanceDropdown() {
  const { address, chain } = useAccount()
  const [prices, setPrices] = React.useState<Record<string, number>>({})
  const [tokenValues, setTokenValues] = React.useState<Record<string, number>>({})

  const [mounted, setMounted] = React.useState(false);
  React.useEffect(() => setMounted(true), []);

  // Use active chain or fallback to Sepolia
  const chainId = chain?.id ?? SUPPORTED_CHAINS.SEPOLIA

  const allPossibleTokens = React.useMemo(() => {
    const tokens: { symbol: string; token: `0x${string}`; chainId: number }[] = [];
    for (const chainIdStr in CONTRACT_ADDRESSES) {
      const currentChainId = Number(chainIdStr);
      const contracts = CONTRACT_ADDRESSES[currentChainId as keyof typeof CONTRACT_ADDRESSES];
      for (const key in contracts) {
        if (key.endsWith("_TOKEN") && contracts[key as keyof typeof contracts] !== ZERO_ADDRESS) {
          tokens.push({
            symbol: key.replace("_TOKEN", ""),
            token: contracts[key as keyof typeof contracts] as `0x${string}`,
            chainId: currentChainId,
          });
        }
      }
    }
    return tokens;
  }, []);

  // Load USD prices on mount
  React.useEffect(() => {
    getCoinPrices().then((res) => setPrices(res))
  }, [])

  const portfolioValue = Object.values(tokenValues).reduce((sum, value) => sum + value, 0)

  // Add token to MetaMask
  async function addTokenToMetaMask(symbol: string, token: `0x${string}`, decimals: number) {
    try {
      if (typeof window !== "undefined" && (window as any).ethereum) {
        await (window as any).ethereum.request({
          method: "wallet_watchAsset",
          params: {
            type: "ERC20",
            options: {
              address: token,
              symbol,
              decimals,
            },
          },
        })
      }
    } catch (err) {
      console.error("Failed to add token:", err)
    }
  }

  const handleValueChange = React.useCallback((symbol: string, value: number) => {
    setTokenValues(prev => {
      if (prev[symbol] === value) return prev
      return { ...prev, [symbol]: value }
    })
  }, [])

  if (!mounted) return null;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="icon" className="relative">
          <Wallet className="h-4 w-4" />
          <span className="sr-only">Vault Balances</span>
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent className="w-80 p-3 space-y-2">
        {/* Portfolio total */}
        <div className="px-2 pb-2 border-b border-border/50">
          <p className="text-xs text-muted-foreground">Portfolio Value</p>
          <p className="text-lg font-semibold">
            ${formatNumberForTable(portfolioValue)}
          </p>
        </div>

        {allPossibleTokens.map(({ symbol, token, chainId: tokenChainId }) => (
          <VaultBalanceItem
            key={`${symbol}-${tokenChainId}`}
            symbol={symbol}
            token={token}
            address={address}
            prices={prices}
            onValueChange={(value) => handleValueChange(symbol, value)}
            onAddToMetaMask={addTokenToMetaMask}
            currentChainId={chainId}
            tokenChainId={tokenChainId}
          />
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}