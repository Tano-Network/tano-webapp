"use client"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import { Lock, Coins, TrendingUp, Shield, AlertCircle, CheckCircle2, Sparkles } from "lucide-react"
import { useAccount, useChainId } from "wagmi"
import { readContract } from '@wagmi/core'
import { formatUnits } from 'viem'
import { config } from '@/lib/wagmiConfig'
import { ZeroAddress } from "ethers"
import assetManagementAbi from "@/abi/assetManagement.json"
import assetAbi from "@/abi/asset.json"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { LoadingSpinner } from "@/components/LoadingSpinner"
import { useToast } from "@/hooks/use-toast"
import { cn } from "@/lib/utils"
import { CONTRACT_ADDRESSES, EXPLORER_URLS, SUPPORTED_CHAINS } from "@/lib/constants"

const vaults = [
  {
    id: "doge",
    asset: "DOGE",
    icon: "Ð",
    totalLocked: "150.5M tDOGE",
    apy: "12.8%",
    minted: "0.00",
    whitelistContract: CONTRACT_ADDRESSES[SUPPORTED_CHAINS.SEPOLIA].TDOGE_ASSET_MANAGEMENT,
    whitelistAbi: assetManagementAbi,
    tokenAddress: CONTRACT_ADDRESSES[SUPPORTED_CHAINS.SEPOLIA].TDOGE_TOKEN,
    tokenAbi: assetAbi,
    color: "from-yellow-500 to-orange-500",
    status: (CONTRACT_ADDRESSES[SUPPORTED_CHAINS.SEPOLIA].TDOGE_ASSET_MANAGEMENT !== ZeroAddress) ? "active" : "coming-soon",
    description: "The original meme coin, now earning yield",
    totalMinted: '0'
  },
  {
    id: "litecoin",
    asset: "LTC",
    icon: "Ł",
    totalLocked: "250.2 tLTC",
    apy: "8.2%",
    minted: "0.00",
    whitelistContract: CONTRACT_ADDRESSES[SUPPORTED_CHAINS.SEPOLIA].TLTC_ASSET_MANAGEMENT,
    whitelistAbi: assetManagementAbi,
    color: "from-gray-400 to-gray-600",
    status: (CONTRACT_ADDRESSES[SUPPORTED_CHAINS.SEPOLIA].TLTC_ASSET_MANAGEMENT !== ZeroAddress) ? "active" : "coming-soon",
    description: "Digital silver for the digital age",
    totalMinted: '0',
    tokenAddress: CONTRACT_ADDRESSES[SUPPORTED_CHAINS.SEPOLIA].TLTC_TOKEN,
    tokenAbi: assetAbi,
  


  },
  {
    id: "bitcoin_cash",
    asset: "BCH",
    icon: "₿",
    totalLocked: "5,120 tBCH",
    apy: "9.5%",
    minted: "0.00",
    whitelistContract: CONTRACT_ADDRESSES[SUPPORTED_CHAINS.SEPOLIA].TBCH_ASSET_MANAGEMENT,
    whitelistAbi: assetManagementAbi,
    color: "from-green-500 to-emerald-600",
    status: (CONTRACT_ADDRESSES[SUPPORTED_CHAINS.SEPOLIA].TBCH_ASSET_MANAGEMENT !== ZeroAddress) ? "active" : "coming-soon",
    description: "Peer-to-peer electronic cash system",
    totalMinted: '0',
    tokenAddress: CONTRACT_ADDRESSES[SUPPORTED_CHAINS.SEPOLIA].TBCH_TOKEN,
    tokenAbi: assetAbi,
  },
]
interface StatCardProps {
  icon: React.ReactNode
  label: string
  value: string | null // Allow null for loading state
  description?: string
  isLoading?: boolean
  delay?: number
}
const StatCard = ({ icon, label, value, description, isLoading = false, delay = 0 }: StatCardProps) => (
  <Card
    className="relative overflow-hidden group hover:shadow-xl transition-all duration-500 hover:-translate-y-1"
    style={{ animationDelay: `${delay}ms` }}
  >
    <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-purple-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 relative">
      <CardTitle className="text-sm font-medium text-muted-foreground transition-colors group-hover:text-foreground">
        {label}
      </CardTitle>
      <div className="bg-primary/10 p-2 rounded-lg border border-primary/20 group-hover:bg-primary/20 group-hover:scale-110 transition-all duration-300">
        {icon}
      </div>
    </CardHeader>
    <CardContent className="relative">
      {isLoading ? (
        <div className="space-y-2">
          <Skeleton className="h-8 w-24 animate-pulse" />
          <Skeleton className="h-3 w-16 animate-pulse" />
        </div>
      ) : (
        <>
          <div className="text-2xl font-bold text-foreground group-hover:text-primary transition-colors duration-300">
            {value}
          </div>
          {description && (
            <div className="text-xs text-muted-foreground mt-1 group-hover:text-muted-foreground/80 transition-colors">
              {description}
            </div>
          )}
        </>
      )}
    </CardContent>
  </Card>
)
interface VaultCardProps {
  vault: {
    id: string
    asset: string
    icon: string
    totalLocked: string
    apy: string
    minted: string
    whitelistContract: string
    whitelistAbi: any
    color: string
    status: string
    description: string
  }
  isWhitelisted: boolean | null
  onSelect: (vault: any) => void
  isLoading: boolean
  index: number
}
const VaultCard = ({ vault, isWhitelisted, onSelect, isLoading, index }: VaultCardProps) => {
  const [isHovered, setIsHovered] = useState(false)

  const getStatusBadge = () => {
    if (vault.status === "coming-soon") {
      return (
        <Badge variant="secondary" className="animate-pulse">
          Coming Soon
        </Badge>
      )
    }
    if (isWhitelisted === false) {
      return <Badge variant="destructive">Address Not Whitelisted</Badge>
    }
    if (isWhitelisted === true) {
      return (
        <Badge variant="default" className="bg-green-500 hover:bg-green-600 animate-pulse">
          <CheckCircle2 size={12} className="mr-1" />
          Whitelisted
        </Badge>
      )
    }
    return <Skeleton className="h-5 w-20" />
  }

  // const isDisabled = vault.status === "coming-soon" || isWhitelisted === false
  const isDisabled = vault.status === "coming-soon"

  return (
    <Card
      className={cn(
        "group relative overflow-hidden transition-all duration-500 hover:shadow-2xl cursor-pointer",
        "hover:-translate-y-2 hover:scale-[1.02]",
        isDisabled && "opacity-60 cursor-not-allowed",
      )}
      style={{
        animationDelay: `${index * 100}ms`,
        animation: "slideInUp 0.6s ease-out forwards",
      }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={() => !isDisabled && onSelect(vault)}
    >
      <div
        className={cn(
          "absolute inset-0 bg-gradient-to-br opacity-5 transition-opacity duration-500",
          vault.color,
          isHovered ? "opacity-20" : "opacity-5",
        )}
      />

      {/* Sparkle effect for active vaults */}
      {vault.status === "active" && isHovered && (
        <div className="absolute top-4 right-4 text-yellow-400 animate-pulse">
          <Sparkles size={16} />
        </div>
      )}

      <CardHeader className="relative">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div
              className={cn(
                "bg-gradient-to-br text-white rounded-full h-12 w-12 flex items-center justify-center text-xl font-bold shadow-lg transition-all duration-300",
                vault.color,
                isHovered && "scale-110 shadow-xl",
              )}
            >
              {vault.icon}
            </div>
            <div>
              <CardTitle className="text-lg group-hover:text-primary transition-colors">{vault.asset}</CardTitle>
              <CardDescription className="transition-colors group-hover:text-muted-foreground/80">
                {vault.description}
              </CardDescription>
            </div>
          </div>
          {getStatusBadge()}
        </div>
      </CardHeader>

      <CardContent className="space-y-4 relative">
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1">
            <div className="text-sm text-muted-foreground">Total Locked</div>
            <div className="font-semibold group-hover:text-primary transition-colors">{vault.totalLocked}</div>
          </div>
          <div className="space-y-1">
            <div className="text-sm text-muted-foreground">APY</div>
            <div className="font-semibold text-green-600 dark:text-green-400 group-hover:text-green-500 transition-colors">
              {vault.apy}
            </div>
          </div>
        </div>

        <div className="space-y-1">
          <div className="text-sm text-muted-foreground">My Minted</div>
          <div className="font-semibold">
            {vault.minted} {vault.asset}
          </div>
        </div>

        <Button
          onClick={(e) => {
            e.stopPropagation()
            onSelect(vault)
          }}
          disabled={isDisabled || isLoading}
          className={cn("w-full transition-all duration-300 group-hover:scale-105", !isDisabled && "hover:shadow-lg")}
          variant={isDisabled ? "secondary" : "default"}
        >
          {isLoading ? (
            <div className="flex items-center gap-2">
              <LoadingSpinner size="sm" />
              Checking...
            </div>
          ) : vault.status === "coming-soon" ? (
            "Coming Soon"
          ) : (
            "Open Vault"
          )}
        </Button>
      </CardContent>
    </Card>
  )
}

export default function VaultsPage() {
  const router = useRouter()
  const { address, isConnected } = useAccount()
  const chainId = useChainId()
  const { toast } = useToast()
  const [whitelistStatus, setWhitelistStatus] = useState<Record<string, boolean | null>>({})
  const [isLoading, setIsLoading] = useState(false)
  const [pageLoaded, setPageLoaded] = useState(false)

  // Check if we're on Sepolia testnet
  const isCorrectNetwork = chainId === 11155111

  useEffect(() => {
    setPageLoaded(true)
  }, [])

  useEffect(() => {
    if (!isConnected || !address) return

    if (!isCorrectNetwork) {
      toast({
        title: "Wrong Network",
        description: "Please switch to Sepolia testnet to use the vaults",
        variant: "destructive",
      })
      return
    }

    

 // or wherever your config is

async function checkAllVaults() {
  setIsLoading(true)
  try {
    const statusUpdates = await Promise.all(
      vaults.map(async (vault) => {
        const { whitelistContract, whitelistAbi, id, tokenAddress, tokenAbi } = vault

        if (!whitelistContract || whitelistContract === '0x0000000000000000000000000000000000000000') {
          return { id, whitelisted: null, supply: null, mints: null }
        }

        if (!tokenAddress || tokenAddress === ZeroAddress) {
          return { id, whitelisted: null, supply: null, mints: null }
        }

        try {
          const [whitelisted, supply, mints] = await Promise.all([
            readContract(config, {
              address: whitelistContract as `0x${string}`,
              abi: whitelistAbi,
              functionName: 'isWhitelisted',
              args: address ? [address] : [],
            }),
            readContract(config, {
              address: tokenAddress as `0x${string}`,
              abi: tokenAbi,
              functionName: 'totalSupply',
            }),
            readContract(config, {
              address: whitelistContract as `0x${string}`,
              abi: whitelistAbi,
              functionName: 'getMintedAmount',
              args: address ? [address] : [],
            }),
          ])

          return { id, whitelisted, supply, mints }
        } catch (err) {
          console.error(`Error reading vault ${id}:`, err)
          return { id, whitelisted: false, supply: null, mints: null }
        }
      })
    )

    const newStatus: Record<string, boolean | null> = {}

    for (const { id, whitelisted, supply, mints } of statusUpdates) {
      newStatus[id] = whitelisted as boolean

      const vault = vaults.find((v) => v.id === id)
      if (!vault) continue

      if (supply) {
        vault.totalMinted = `${formatUnits(supply as bigint, 18)} ${vault.asset}`
      }

      if (mints) {
        vault.minted = `${formatUnits(mints as bigint, 18)} ${vault.asset}`
      }
    }

    setWhitelistStatus(newStatus)
  } catch (error) {
    console.error('Error checking vaults:', error)
    toast({
      title: 'Error',
      description: 'Failed to check vault status. Please try again.',
      variant: 'destructive',
    })
  } finally {
    setIsLoading(false)
  }
}



    checkAllVaults()
  }, [isConnected, address, isCorrectNetwork, toast])

  const onSelectVault = (vault: any) => {
    if (vault.status === "coming-soon") {
      toast({
        title: "Coming Soon",
        description: `${vault.asset} vault is not yet available`,
      })
      return
    }

    if (whitelistStatus[vault.id] === false) {
      toast({
        title: "Access Restricted",
        description: `You are not whitelisted for the ${vault.asset} vault`,
        variant: "destructive",
      })
      return
    }

    if (!isCorrectNetwork) {
      toast({
        title: "Wrong Network",
        description: "Please switch to Sepolia testnet",
        variant: "destructive",
      })
      return
    }

    router.push(`/vault/${vault.id}`)
  }

  return (
    <div
      className={cn(
        "container mx-auto p-4 md:p-8 max-w-7xl transition-all duration-700",
        pageLoaded ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4",
      )}
    >
      {/* Header Section */}
      <div className="mb-8 text-center md:text-left">
        <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-2 bg-gradient-to-r from-foreground to-primary bg-clip-text text-transparent">
          Vaults Dashboard
        </h1>
        <div className="text-muted-foreground text-lg md:text-xl max-w-2xl">
          Deposit your crypto assets and earn yield through our secure, audited vaults
        </div>
      </div>

      {/* Network Warning */}
      {!isCorrectNetwork && isConnected && (
        <Alert className="mb-8 border-destructive/20 bg-destructive/5">
          <AlertCircle className="h-4 w-4 text-destructive" />
          <AlertDescription className="flex items-center justify-between w-full">
            <div className="text-destructive">
              <strong>Wrong Network:</strong> Please switch to Sepolia testnet to use the vaults. Current network ID:{" "}
              {chainId}
            </div>
          </AlertDescription>
        </Alert>
      )}

      {/* Wallet Info Alert */}
      {isConnected && isCorrectNetwork && (
        <div></div>
      )}

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
        <StatCard
          icon={<Lock size={20} className="text-primary" />}
          label="Total Locked Assets"
          value="150.5M $"
          description="Across all vaults"
          delay={0}
        />
        <StatCard
          icon={<Coins size={20} className="text-primary" />}
          label="Total t-DOGE Minted"
          value={vaults[0].totalMinted}
          description="Available for trading"
          delay={100}
        />
        <StatCard
          icon={<Coins size={20} className="text-primary" />}
          label="Total t-LTC Minted"
          value={vaults[1].totalMinted}
          description="Available for trading"
          delay={100}
        />
        <StatCard
          icon={<TrendingUp size={20} className="text-primary" />}
          label="Average APY"
          value="10.2%"
          description="Weighted average"
          delay={200}
        />
        <StatCard
          icon={<Shield size={20} className="text-primary" />}
          label="Active Vaults"
          value= {(vaults.filter(v => v.status === "active").length).toString()}
          description="On Sepolia testnet"
          delay={300}
        />
      </div>

      {/* Vaults Section */}
      <div className="mb-12">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl md:text-3xl font-bold text-foreground">Available Vaults</h2>
          {isLoading && (
            <div className="flex items-center gap-2 text-muted-foreground">
              <LoadingSpinner size="sm" />
              <span className="text-sm">Checking whitelist status...</span>
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {vaults.map((vault, index) => (
            <VaultCard
              key={vault.id}
              vault={vault}
              isWhitelisted={whitelistStatus[vault.id]}
              onSelect={onSelectVault}
              isLoading={isLoading}
              index={index}
            />
          ))}
        </div>
      </div>

      {/* Help Section */}
      <Card className="border-border/50 hover:border-primary/20 transition-all duration-300 hover:shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-xl">
            <AlertCircle className="w-5 h-5 text-primary" />
            Need Help Getting Started?
          </CardTitle>
          <CardDescription className="text-base">
            New to DeFi? Learn how our vaults work and discover strategies to maximize your yields safely. Make sure
            you're connected to Sepolia testnet to interact with the vaults.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4">
            <Button variant="outline" size="sm" className="hover:scale-105 transition-transform bg-transparent">
              📚 Read Documentation
            </Button>
            <Button variant="outline" size="sm" className="hover:scale-105 transition-transform bg-transparent">
              💬 Join Discord
            </Button>
            <Button variant="outline" size="sm" className="hover:scale-105 transition-transform bg-transparent">
              🎥 Watch Tutorials
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
