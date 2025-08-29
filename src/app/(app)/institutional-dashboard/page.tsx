"use client"

import { BackButton } from "@/components/BackButton"
import { useUserType } from "@/contexts/UserTypeContexts"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { ArrowRight, Lock, Coins, TrendingUp, Shield, AlertCircle } from "lucide-react"
import { useAccount, useChainId } from "wagmi"
import { readContract } from "@wagmi/core"
import { formatUnits } from "viem"
import { config } from "@/lib/wagmiConfig"
import { ZeroAddress } from "ethers"
import assetManagementAbi from "@/abi/assetManagement.json"
import assetAbi from "@/abi/asset.json"
import {
  CONTRACT_ADDRESSES,
  SUPPORTED_CHAINS,
} from "@/lib/constants"
import { LoadingSpinner } from "@/components/LoadingSpinner"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

// Define a type for the vault data including fetched values
interface Vault {
  id: string;
  asset: string;
  icon: string;
  totalLocked: string;
  apy: string;
  minted: string;
  whitelistContract: string;
  whitelistAbi: any;
  tokenAddress: string;
  tokenAbi: any;
  color: string;
  status: string;
  description: string;
  totalMinted: string;
  isWhitelisted?: boolean | null;
  mintableAmount?: bigint;
  allowance?: bigint;
  mintedAmount?: bigint;
}

// Initial vaults data (copied from vault/page.tsx for now)
const initialVaults: Vault[] = [
  {
    id: "doge",
    asset: "DOGE",
    icon: "Ð",
    totalLocked: "150.5M tDOGE",
    apy: "12.8%",
    minted: "0.00",
    whitelistContract:
      CONTRACT_ADDRESSES[SUPPORTED_CHAINS.SEPOLIA].TDOGE_ASSET_MANAGEMENT,
    whitelistAbi: assetManagementAbi,
    tokenAddress: CONTRACT_ADDRESSES[SUPPORTED_CHAINS.SEPOLIA].TDOGE_TOKEN,
    tokenAbi: assetAbi,
    color: "from-yellow-500 to-orange-500",
    status:
      CONTRACT_ADDRESSES[SUPPORTED_CHAINS.SEPOLIA].TDOGE_ASSET_MANAGEMENT !==
      ZeroAddress
        ? "active"
        : "coming-soon",
    description: "The original meme coin, now earning yield",
    totalMinted: "0",
  },
  {
    id: "litecoin",
    asset: "LTC",
    icon: "Ł",
    totalLocked: "250.2 tLTC",
    apy: "8.2%",
    minted: "0.00",
    whitelistContract:
      CONTRACT_ADDRESSES[SUPPORTED_CHAINS.SEPOLIA].TLTC_ASSET_MANAGEMENT,
    whitelistAbi: assetManagementAbi,
    color: "from-gray-400 to-gray-600",
    status:
      CONTRACT_ADDRESSES[SUPPORTED_CHAINS.SEPOLIA].TLTC_ASSET_MANAGEMENT !==
      ZeroAddress
        ? "active"
        : "coming-soon",
    description: "Digital silver for the digital age",
    totalMinted: "0",
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
    whitelistContract:
      CONTRACT_ADDRESSES[SUPPORTED_CHAINS.SEPOLIA].TBCH_ASSET_MANAGEMENT,
    whitelistAbi: assetManagementAbi,
    color: "from-green-500 to-emerald-600",
    status:
      CONTRACT_ADDRESSES[SUPPORTED_CHAINS.SEPOLIA].TBCH_ASSET_MANAGEMENT !==
      ZeroAddress
        ? "active"
        : "coming-soon",
    description: "Peer-to-peer electronic cash system",
    totalMinted: "0",
    tokenAddress: CONTRACT_ADDRESSES[SUPPORTED_CHAINS.SEPOLIA].TBCH_TOKEN,
    tokenAbi: assetAbi,
  },
  {
    id: "xrp",
    asset: "XRP",
    icon: "X",
    totalLocked: "0.00 tXRP",
    apy: "0.0%",
    minted: "0.00",
    whitelistContract:
      CONTRACT_ADDRESSES[SUPPORTED_CHAINS.SEPOLIA].TXRP_ASSET_MANAGEMENT,
    whitelistAbi: assetManagementAbi,
    tokenAddress: CONTRACT_ADDRESSES[SUPPORTED_CHAINS.SEPOLIA].TXRP_TOKEN,
    tokenAbi: assetAbi,
    color: "from-blue-400 to-indigo-600",
    status:
      CONTRACT_ADDRESSES[SUPPORTED_CHAINS.SEPOLIA].TXRP_ASSET_MANAGEMENT !==
      ZeroAddress
        ? "active"
        : "coming-soon",
    description: "The digital asset for payments",
    totalMinted: "0",
  },
];

interface StatCardProps {
  icon: React.ReactNode;
  label: string;
  value: string | null; // Allow null for loading state
  description?: string;
  isLoading?: boolean;
  delay?: number;
}

const StatCard = ({
  icon,
  label,
  value,
  description,
  isLoading = false,
  delay = 0,
}: StatCardProps) => (
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
          <div className="h-8 w-24 animate-pulse bg-gray-200 rounded" />
          <div className="h-3 w-16 animate-pulse bg-gray-200 rounded" />
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
);

export default function InstitutionalDashboardPage() {
  const { userType } = useUserType()
  const router = useRouter()
  const { address, isConnected } = useAccount()
  const chainId = useChainId()

  const [vaultsData, setVaultsData] = useState<Vault[]>(initialVaults)
  const [isLoadingVaultData, setIsLoadingVaultData] = useState(true)

  const isCorrectNetwork = chainId === SUPPORTED_CHAINS.SEPOLIA

  useEffect(() => {
    if (userType && userType !== "institutional") {
      router.push("/retail-dashboard")
    } else if (!userType) {
      // Optionally redirect to a user type selection page or home if userType is not set
      // router.push("/")
    }
  }, [userType, router])

  useEffect(() => {
    const fetchVaultData = async () => {
      if (!isConnected || !address || !isCorrectNetwork) {
        setIsLoadingVaultData(false)
        return
      }

      setIsLoadingVaultData(true)
      try {
        const updatedVaults = await Promise.all(
          initialVaults.map(async (vault) => {
            let isWhitelisted: boolean | null = null;
            let mintableAmount: bigint = BigInt(0);
            let allowance: bigint = BigInt(0);
            let mintedAmount: bigint = BigInt(0);
            let totalMinted: bigint = BigInt(0);

            if (
              vault.status === "active" &&
              vault.whitelistContract !== ZeroAddress &&
              vault.tokenAddress !== ZeroAddress
            ) {
              try {
                const [
                  whitelisted,
                  mintable,
                  allowanceAmt,
                  mintedAmt,
                  supply,
                ] = await Promise.all([
                  readContract(config, {
                    address: vault.whitelistContract as `0x${string}`,
                    abi: vault.whitelistAbi,
                    functionName: "isWhitelisted",
                    args: [address],
                  }),
                  readContract(config, {
                    address: vault.whitelistContract as `0x${string}`,
                    abi: vault.whitelistAbi,
                    functionName: "getMintableAmount",
                    args: [address],
                  }),
                  readContract(config, {
                    address: vault.whitelistContract as `0x${string}`,
                    abi: vault.whitelistAbi,
                    functionName: "getAllowance",
                    args: [address],
                  }),
                  readContract(config, {
                    address: vault.whitelistContract as `0x${string}`,
                    abi: vault.whitelistAbi,
                    functionName: "getMintedAmount",
                    args: [address],
                  }),
                  readContract(config, {
                    address: vault.tokenAddress as `0x${string}`,
                    abi: assetAbi,
                    functionName: "totalSupply",
                  }),
                ]);

                isWhitelisted = whitelisted as boolean;
                mintableAmount = mintable as bigint;
                allowance = allowanceAmt as bigint;
                mintedAmount = mintedAmt as bigint;
                totalMinted = supply as bigint;

              } catch (contractError) {
                console.error(
                  `Error fetching data for ${vault.asset} vault:`,
                  contractError
                );
                isWhitelisted = false; // Assume not whitelisted on error
              }
            }

            return {
              ...vault,
              isWhitelisted,
              mintableAmount,
              allowance,
              mintedAmount,
              totalMinted: formatUnits(totalMinted, 18),
            };
          })
        );
        setVaultsData(updatedVaults);
      } catch (error) {
        console.error("Failed to fetch vault data:", error);
      } finally {
        setIsLoadingVaultData(false);
      }
    };

    fetchVaultData()
  }, [address, isConnected, isCorrectNetwork])

  const totalValueLocked = vaultsData.reduce((sum, vault) => {
    // This is a placeholder. A real implementation would sum actual locked values.
    // For now, we'll just sum the 'totalMinted' as a proxy for total value in the vault.
    return sum + parseFloat(vault.totalMinted || "0");
  }, 0);

  const activeVaultCount = vaultsData.filter(
    (v) => v.status === "active"
  ).length;

  return (
    <div className="container mx-auto py-10">
      <h1 className="text-3xl font-bold mb-6">Institutional Dashboard</h1>
      <div className="mb-4">
        <BackButton />
      </div>
      <p className="mb-8">Welcome to your Institutional Dashboard! Here you will find functions tailored for institutional users and a summary of vault activities.</p>

      {!isCorrectNetwork && isConnected && (
        <Alert className="mb-8 border-destructive/20 bg-destructive/5">
          <AlertCircle className="h-4 w-4 text-destructive" />
          <AlertDescription className="flex items-center justify-between w-full">
            <div className="text-destructive">
              <strong>Wrong Network:</strong> Please switch to Sepolia testnet
              to view vault data.
            </div>
          </AlertDescription>
        </Alert>
      )}

      <h2 className="text-2xl font-bold mb-4">Vaults Overview</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatCard
          icon={<Lock size={20} className="text-primary" />}
          label="Total Value Locked (tAssets)"
          value={isLoadingVaultData ? null : `${totalValueLocked.toFixed(2)}`}
          description="Across all active vaults"
          isLoading={isLoadingVaultData}
          delay={0}
        />
        <StatCard
          icon={<Coins size={20} className="text-primary" />}
          label="Total tDOGE Minted"
          value={isLoadingVaultData ? null : parseFloat(vaultsData.find(v => v.id === "doge")?.totalMinted || "0").toFixed(2)}
          description="Total minted tDOGE"
          isLoading={isLoadingVaultData}
          delay={100}
        />
        <StatCard
          icon={<Coins size={20} className="text-primary" />}
          label="Total tLTC Minted"
          value={isLoadingVaultData ? null : parseFloat(vaultsData.find(v => v.id === "litecoin")?.totalMinted || "0").toFixed(2)}
          description="Total minted tLTC"
          isLoading={isLoadingVaultData}
          delay={200}
        />
        <StatCard
          icon={<Shield size={20} className="text-primary" />}
          label="Active Vaults"
          value={isLoadingVaultData ? null : activeVaultCount.toString()}
          description="Currently operational"
          isLoading={isLoadingVaultData}
          delay={300}
        />
      </div>

      <h2 className="text-2xl font-bold mb-4">Your Vaults</h2>
      <Card>
        <CardHeader>
          <CardTitle>Your Vault Details</CardTitle>
          <CardDescription>Detailed information about vaults you can interact with.</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoadingVaultData ? (
            <div className="flex justify-center items-center h-32">
              <LoadingSpinner />
              <span className="ml-2">Loading vault data...</span>
            </div>
          ) : vaultsData.filter(vault => vault.isWhitelisted).length > 0 ? (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Asset</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Your Minted</TableHead>
                    <TableHead>Mintable</TableHead>
                    <TableHead>Total Allowance</TableHead>
                    <TableHead>Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {vaultsData.filter(vault => vault.isWhitelisted).map((vault) => (
                    <TableRow key={vault.id}>
                      <TableCell className="font-medium">{vault.asset}</TableCell>
                      <TableCell>
                        <Badge variant="default">Whitelisted</Badge>
                      </TableCell>
                      <TableCell>{parseFloat(formatUnits(vault.mintedAmount || BigInt(0), 18)).toFixed(2)}</TableCell>
                      <TableCell>{parseFloat(formatUnits(vault.mintableAmount || BigInt(0), 18)).toFixed(2)}</TableCell>
                      <TableCell>{parseFloat(formatUnits(vault.allowance || BigInt(0), 18)).toFixed(2) }</TableCell>
                      <TableCell>
                        <Button asChild size="sm" disabled={vault.status === "coming-soon"}>
                          <Link href={`/vault/${vault.id}`}>Open Vault</Link>
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <p className="text-muted-foreground">No vault data available.</p>
          )}
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-8">
        <Card className="bg-card p-6 rounded-lg shadow flex flex-col justify-between">
          <div>
            <h2 className="text-xl font-semibold mb-4">Vault Management</h2>
            <p className="text-muted-foreground">Access detailed vault management.</p>
          </div>
          <Button asChild className="mt-4">
            <Link href="/vault" className="flex items-center gap-2">
              Go to Vaults
              <ArrowRight size={16} />
            </Link>
          </Button>
        </Card>
        <Card className="bg-card p-6 rounded-lg shadow flex flex-col justify-between">
          <div>
            <h2 className="text-xl font-semibold mb-4">Earn</h2>
            <p className="text-muted-foreground">Explore earning opportunities.</p>
          </div>
          <Button asChild className="mt-4">
            <Link href="/earn" className="flex items-center gap-2">
              Go to Earn
              <ArrowRight size={16} />
            </Link>
          </Button>
        </Card>
        <Card className="bg-card p-6 rounded-lg shadow flex flex-col justify-between">
          <div>
            <h2 className="text-xl font-semibold mb-4">Redeem</h2>
            <p className="text-muted-foreground">Redeem your tAssets for native tokens.</p>
          </div>
          <Button asChild className="mt-4">
            <Link href="/redeem" className="flex items-center gap-2">
              Go to Redeem
              <ArrowRight size={16} />
            </Link>
          </Button>
        </Card>
      </div>
    </div>
  )
}
