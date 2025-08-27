"use client";
import { BackButton } from "@/components/BackButton";
import { useEffect, useState } from "react";
import { useToast } from "@/hooks/use-toast";
import {
  Lock,
  Coins,
  TrendingUp,
  Shield,
  AlertCircle,
  CheckCircle2,
  Sparkles,
} from "lucide-react";
import { useAccount, useChainId, usePublicClient } from "wagmi";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { LoadingSpinner } from "@/components/LoadingSpinner"; // Corrected import
import { cn } from "@/lib/utils";
import { CONTRACT_ADDRESSES, SUPPORTED_CHAINS } from "@/lib/constants";
import earnStakingAbi from "@/abi/earnStaking.json";
import { formatUnits, ZeroAddress } from "ethers";
import { getCoinPrices } from "@/app/actions/get-prices";
import { AlertDialog } from "@radix-ui/react-alert-dialog";

// Define a type for the earn pool data including fetched values
interface EarnPool {
  id: string;
  asset: string;
  icon: string;
  contractAddress: string;
  stakingTokenAddress: string;
  decimals: number;
  totalStaked: string; // Will be fetched
  apy: string; // Placeholder for now
  myDeposit: string; // Will be fetched
  color: string;
  status: string; // "active" | "coming-soon"
  description: string;
  coinGeckoId: string; // Added for price fetching
}

// Initial earn pools with placeholders for fetched data
const initialEarnPools: EarnPool[] = [
  {
    id: "doge",
    asset: "tDOGE",
    icon: "Ð",
    contractAddress:
      CONTRACT_ADDRESSES[SUPPORTED_CHAINS.SEPOLIA].TDOGE_STAKING_POOL,
    stakingTokenAddress:
      CONTRACT_ADDRESSES[SUPPORTED_CHAINS.SEPOLIA].TDOGE_TOKEN,
    decimals: 18, // Assuming 18 decimals for tDOGE
    totalStaked: "0.00",
    apy: "15.2%",
    myDeposit: "0.00",
    color: "from-yellow-500 to-orange-500",
    status:
      CONTRACT_ADDRESSES[SUPPORTED_CHAINS.SEPOLIA].TDOGE_STAKING_POOL !==
      ZeroAddress
        ? "active"
        : "coming-soon",
    description: "Stake your tDOGE to earn rewards",
    coinGeckoId: "dogecoin",
  },
  {
    id: "litecoin",
    asset: "tLTC",
    icon: "Ł",
    contractAddress:
      CONTRACT_ADDRESSES[SUPPORTED_CHAINS.SEPOLIA].TLTC_STAKING_POOL, // Placeholder, will be updated
    stakingTokenAddress:
      CONTRACT_ADDRESSES[SUPPORTED_CHAINS.SEPOLIA].TLTC_TOKEN, // Placeholder, will be updated
    decimals: 18, // Assuming 18 decimals for tLTC
    totalStaked: "0.00",
    apy: "0.0%",
    myDeposit: "0.00",
    color: "from-gray-400 to-gray-600",
    status:
      CONTRACT_ADDRESSES[SUPPORTED_CHAINS.SEPOLIA].TLTC_STAKING_POOL !==
      ZeroAddress
        ? "active"
        : "coming-soon",
    description: "Stake your tLTC to earn rewards",
    coinGeckoId: "litecoin",
  },
  {
    id: "bitcoin_cash",
    asset: "tBCH",
    icon: "₿",
    contractAddress:
      CONTRACT_ADDRESSES[SUPPORTED_CHAINS.SEPOLIA].TBCH_STAKING_POOL, // Placeholder, will be updated
    stakingTokenAddress:
      CONTRACT_ADDRESSES[SUPPORTED_CHAINS.SEPOLIA].TBCH_TOKEN, // Placeholder, will be updated
    decimals: 18, // Assuming 18 decimals for tBCH
    totalStaked: "0.00",
    apy: "0.0%",
    myDeposit: "0.00",
    color: "from-green-500 to-emerald-600",
    status:
      CONTRACT_ADDRESSES[SUPPORTED_CHAINS.SEPOLIA].TBCH_STAKING_POOL !==
      ZeroAddress
        ? "active"
        : "coming-soon",
    description: "Stake your tBCH to earn rewards",
    coinGeckoId: "bitcoin-cash",
  },
  {
    id: "ripple",
    asset: "tXRP",
    icon: "X",
    contractAddress:
      CONTRACT_ADDRESSES[SUPPORTED_CHAINS.SEPOLIA].TXRP_STAKING_POOL,
    stakingTokenAddress:
      CONTRACT_ADDRESSES[SUPPORTED_CHAINS.SEPOLIA].TXRP_TOKEN,
    decimals: 18, // Assuming 18 decimals for tXRP
    totalStaked: "0.00",
    apy: "0.0%",
    myDeposit: "0.00",
    color: "from-blue-400 to-indigo-600",
    status:
      CONTRACT_ADDRESSES[SUPPORTED_CHAINS.SEPOLIA].TXRP_STAKING_POOL !==
      ZeroAddress
        ? "active"
        : "coming-soon",
    description: "Stake your tXRP to earn rewards",
    coinGeckoId: "ripple",
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

/**
 * A card component for displaying a statistic, with a gradient background
 * and a loading state.
 *
 * @param {React.ReactNode} icon - The icon to display
 * @param {string} label - The label to display
 * @param {string | null} value - The value to display, or null for the loading state
 * @param {string} [description] - An optional description to display
 * @param {boolean} [isLoading=false] - Whether to display the loading state
 * @param {number} [delay=0] - The animation delay in milliseconds
 */
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
);
interface EarnPoolCardProps {
  pool: any;
  onSelect: (pool: any) => void;
  isLoading: boolean;
  index: number;
}
/**
 * EarnPoolCard component displays information about an earning pool.
 *
 * @param {object} pool - The pool data containing status, asset, description, icon, color, total staked, APY, and user's deposit info.
 * @param {function} onSelect - Callback function triggered when the card is clicked.
 * @param {boolean} isLoading - Flag indicating if the data is still loading.
 * @param {number} index - The index of the pool, used for animation delay.
 *
 * @returns JSX.Element representing the card with pool details, including status badge, total staked, APY,
 *          user's deposit, and an action button. The card has different states for loading, active, and coming soon pools.
 */
const EarnPoolCard = ({
  pool,
  onSelect,
  isLoading,
  index,
}: EarnPoolCardProps) => {
  const [isHovered, setIsHovered] = useState(false);

  const getStatusBadge = () => {
    if (pool.status === "coming-soon") {
      return (
        <Badge variant="secondary" className="animate-pulse">
          Coming Soon
        </Badge>
      );
    }
    if (pool.status === "active") {
      return (
        <Badge
          variant="default"
          className="bg-green-500 hover:bg-green-600 animate-pulse"
        >
          <CheckCircle2 size={12} className="mr-1" />
          Active
        </Badge>
      );
    }
    return <Skeleton className="h-5 w-20" />;
  };

  const isDisabled = pool.status === "coming-soon";

  return (
    <Card
      className={cn(
        "group relative overflow-hidden transition-all duration-500 hover:shadow-2xl cursor-pointer",
        "hover:-translate-y-2 hover:scale-[1.02]",
        isDisabled && "opacity-60 cursor-not-allowed"
      )}
      style={{
        animationDelay: `${index * 100}ms`,
        animation: "slideInUp 0.6s ease-out forwards",
      }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={() => !isDisabled && onSelect(pool)}
    >
      <div
        className={cn(
          "absolute inset-0 bg-gradient-to-br opacity-5 transition-opacity duration-500",
          pool.color,
          isHovered ? "opacity-20" : "opacity-5"
        )}
      />

      {/* Sparkle effect for active pools */}
      {pool.status === "active" && isHovered && (
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
                pool.color,
                isHovered && "scale-110 shadow-xl"
              )}
            >
              {pool.icon}
            </div>
            <div>
              <CardTitle className="text-lg group-hover:text-primary transition-colors">
                {pool.asset} Pool
              </CardTitle>
              <CardDescription className="transition-colors group-hover:text-muted-foreground/80">
                {pool.description}
              </CardDescription>
            </div>
          </div>
          {getStatusBadge()}
        </div>
      </CardHeader>

      <CardContent className="space-y-4 relative">
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1">
            <div className="text-sm text-muted-foreground">Total Staked</div>
            {isLoading ? (
              <Skeleton className="h-6 w-24" />
            ) : (
              <div className="font-semibold group-hover:text-primary transition-colors">
                {Number.parseFloat(pool.totalStaked).toFixed(2)} {pool.asset}
              </div>
            )}
          </div>
          <div className="space-y-1">
            <div className="text-sm text-muted-foreground">APY</div>
            {isLoading ? (
              <Skeleton className="h-6 w-16" />
            ) : (
              <div className="font-semibold text-green-600 dark:text-green-400 group-hover:text-green-500 transition-colors">
                {pool.apy}
              </div>
            )}
          </div>
        </div>

        <div className="space-y-1">
          <div className="text-sm text-muted-foreground">My Deposit</div>
          {isLoading ? (
            <Skeleton className="h-6 w-20" />
          ) : (
            <div className="font-semibold">
              {Number.parseFloat(pool.myDeposit).toFixed(2)} {pool.asset}
            </div>
          )}
        </div>

        <Button
          onClick={(e) => {
            e.stopPropagation();
            onSelect(pool);
          }}
          disabled={isDisabled || isLoading}
          className={cn(
            "w-full transition-all duration-300 group-hover:scale-105",
            !isDisabled && "hover:shadow-lg"
          )}
          variant={isDisabled ? "secondary" : "default"}
        >
          {isLoading ? (
            <div className="flex items-center gap-2">
              <LoadingSpinner size="sm" />
              Checking...
            </div>
          ) : pool.status === "coming-soon" ? (
            "Coming Soon"
          ) : (
            "Open Pool"
          )}
        </Button>
      </CardContent>
    </Card>
  );
};

/**
 * Earn dashboard page, displays various statistics and earn pools
 *
 * @remarks
 * This page is the main entry point for users to view and interact with earn pools.
 * It fetches data from the contract and displays the total value staked, total rewards distributed, average APY, and active pool count.
 * Additionally, it displays a grid of earn pools, allowing users to open each pool and stake their assets.
 * The page also includes a help section with links to documentation, Discord, and tutorials.
 */
export default function EarnDashboardPage() {
  const router = useRouter();
  const { address, isConnected, chain } = useAccount();
  const chainId = useChainId();
  const publicClient = usePublicClient({ chainId: SUPPORTED_CHAINS.SEPOLIA });
  const { toast } = useToast();
  const [earnPoolsData, setEarnPoolsData] =
    useState<EarnPool[]>(initialEarnPools);
  const [isLoadingData, setIsLoadingData] = useState(true);
  const [pageLoaded, setPageLoaded] = useState(false);
  const [coinPrices, setCoinPrices] = useState<Record<string, number>>({});

  useEffect(() => {
    setPageLoaded(true);
  }, []);

  // Check if we're on Sepolia testnet
  const isCorrectNetwork = chainId === SUPPORTED_CHAINS.SEPOLIA;

  // Fetch contract data and prices
  useEffect(() => {
    if (!isCorrectNetwork) {
      toast({
        title: "Wrong Network",
        description: "Please switch to Sepolia testnet to use the vaults",
        variant: "destructive",
      });
      return;
    }

    /**
     * Fetches earn pool data and coin prices from CoinGecko.
     *
     * - Fetches total staked amount for each active pool with a valid contract address.
     * - Fetches the user's staked balance for each active pool if the user is connected.
     * - Fetches prices from CoinGecko.
     * - Updates the earn pool data state with the fetched data.
     * - Sets an error message if any of the fetches fail.
     * - Automatically called when the component mounts.
     * @returns {Promise<void>}
     */
    const fetchData = async () => {
      setIsLoadingData(true);
      try {
        if (!publicClient) {
          console.warn("Public client not available for Sepolia.");
          // We can still try to fetch prices even if publicClient is not ready
        }

        // Fetch prices from CoinGecko
        const prices = await getCoinPrices();
        setCoinPrices(prices);

        const updatedPools = await Promise.all(
          initialEarnPools.map(async (pool) => {
            let totalStaked = 0;
            let myDeposit = 0;

            // Only fetch if the pool is active and has a valid contract address
            if (
              pool.status === "active" &&
              pool.contractAddress !== ZeroAddress &&
              publicClient
            ) {
              try {
                // Fetch total staked
                const totalStakedResult = await publicClient.readContract({
                  address: pool.contractAddress as `0x${string}`,
                  abi: earnStakingAbi,
                  functionName: "totalStaked",
                });
                totalStaked = totalStakedResult as number;

                // Fetch user's staked balance if connected
                if (isConnected && address) {
                  const myDepositResult = await publicClient.readContract({
                    address: pool.contractAddress as `0x${string}`,
                    abi: earnStakingAbi,
                    functionName: "getStakedBalance",
                    args: [address],
                  });
                  myDeposit = myDepositResult as number;
                }
              } catch (contractError) {
                console.error(
                  `Error fetching data for ${pool.asset} pool:`,
                  contractError
                );
                // Fallback to default 0 values if contract call fails
                totalStaked = 0;
                myDeposit = 0;
              }
            }

            return {
              ...pool,
              totalStaked: formatUnits(totalStaked, pool.decimals),
              myDeposit: formatUnits(myDeposit, pool.decimals),
            };
          })
        );
        setEarnPoolsData(updatedPools);
      } catch (error) {
        console.error("Failed to fetch earn pool data or prices:", error);
      } finally {
        setIsLoadingData(false);
      }
    };

    fetchData();
  }, [publicClient, isConnected, address, chainId]); // Re-fetch if publicClient, connection, address, or chain changes

  /**
   * Navigates to the earn pool page if the pool is active.
   *
   * - Prevents navigation if the pool's status is "coming-soon".
   * - Uses the router to push the user to the URL corresponding to the pool's id.
   *
   * @param pool - The earn pool object containing pool details.
   */
  const onSelectPool = (pool: EarnPool) => {
    if (pool.status === "coming-soon") return;
    router.push(`/earn/${pool.id}`);
  };

  // Calculate total value staked in USD
  const totalValueStakedUSD = earnPoolsData.reduce((sum, pool) => {
    const stakedAmount = Number.parseFloat(pool.totalStaked);
    let price = 0;
    if (pool.coinGeckoId === "dogecoin") price = coinPrices.dogecoin;
    else if (pool.coinGeckoId === "litecoin") price = coinPrices.litecoin;
    else if (pool.coinGeckoId === "bitcoin-cash")
      price = coinPrices.bitcoin_cash;
    else if (pool.coinGeckoId === "ripple")
      price = coinPrices.ripple;

    return sum + stakedAmount * price;
  }, 0);

  // Calculate total staked for each asset type
  const totalStakedDOGE =
    earnPoolsData.find((p) => p.id === "doge")?.totalStaked || "0.00";
  const totalStakedLTC =
    earnPoolsData.find((p) => p.id === "litecoin")?.totalStaked || "0.00";
  const totalStakedBCH =
    earnPoolsData.find((p) => p.id === "bitcoin_cash")?.totalStaked || "0.00";
  const totalStakedXRP =
    earnPoolsData.find((p) => p.id === "ripple")?.totalStaked || "0.00";

  // Placeholder for total rewards distributed (needs contract function or historical data)
  const totalRewardsDistributed = "0"; // Keep as placeholder for now

  // Placeholder for average APY (needs real APY calculation logic)
  const averageAPY = "12.5%"; // Keep as placeholder for now

  const activePoolCount = earnPoolsData.filter(
    (p) => p.status === "active"
  ).length;

  return (
    <div
      className={cn(
        "container mx-auto p-4 md:p-8 max-w-7xl transition-all duration-700",
        pageLoaded ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
      )}
    >
      {/* Header Section */}
      <div className="mb-8 text-center md:text-left">
        <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-2 bg-gradient-to-r from-foreground to-primary bg-clip-text text-transparent">
          Earn Dashboard
        </h1>
        <div className="mb-4">
          <BackButton />
        </div>
        <div className="text-muted-foreground text-lg md:text-xl max-w-2xl">
          Stake your assets in various pools to earn passive income
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
        <StatCard
          icon={<Lock size={20} className="text-primary" />}
          label="Total Value Staked"
          value={isLoadingData ? null : `$${totalValueStakedUSD.toFixed(2)}`}
          description="Across all pools"
          isLoading={isLoadingData}
          delay={0}
        />
        <StatCard
          icon={<Coins size={20} className="text-primary" />}
          label="Total Rewards Distributed"
          value={isLoadingData ? null : totalRewardsDistributed}
          description="Since inception"
          isLoading={isLoadingData}
          delay={100}
        />
        <StatCard
          icon={<TrendingUp size={20} className="text-primary" />}
          label="Average APY"
          value={isLoadingData ? null : averageAPY}
          description="Weighted average"
          isLoading={isLoadingData}
          delay={200}
        />
        <StatCard
          icon={<Shield size={20} className="text-primary" />}
          label="Active Pools"
          value={isLoadingData ? null : activePoolCount.toString()}
          description="More coming soon"
          isLoading={isLoadingData}
          delay={300}
        />
      </div>

      {/* Total Staked by Asset Type */}
      <div className="mb-12">
        <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-6">
          Total Staked by Asset
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">tDOGE Staked</CardTitle>
            </CardHeader>
            <CardContent>
              {isLoadingData ? (
                <Skeleton className="h-8 w-32" />
              ) : (
                <div className="text-2xl font-bold">
                  {Number.parseFloat(totalStakedDOGE).toFixed(2)} tDOGE
                </div>
              )}
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">tLTC Staked</CardTitle>
            </CardHeader>
            <CardContent>
              {isLoadingData ? (
                <Skeleton className="h-8 w-32" />
              ) : (
                <div className="text-2xl font-bold">
                  {Number.parseFloat(totalStakedLTC).toFixed(2)} tLTC
                </div>
              )}
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">tBCH Staked</CardTitle>
            </CardHeader>
            <CardContent>
              {isLoadingData ? (
                <Skeleton className="h-8 w-32" />
              ) : (
                <div className="text-2xl font-bold">
                  {Number.parseFloat(totalStakedBCH).toFixed(2)} tBCH
                </div>
              )}
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">tXRP Staked</CardTitle>
            </CardHeader>
            <CardContent>
              {isLoadingData ? (
                <Skeleton className="h-8 w-32" />
              ) : (
                <div className="text-2xl font-bold">
                  {Number.parseFloat(totalStakedXRP).toFixed(2)} tXRP
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Earn Pools Section */}
      <div className="mb-12">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl md:text-3xl font-bold text-foreground">
            Available Earn Pools
          </h2>
          {isLoadingData && (
            <div className="flex items-center gap-2 text-muted-foreground">
              <LoadingSpinner size="sm" />
              <span className="text-sm">Loading pool data...</span>
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {earnPoolsData.map((pool, index) => (
            <EarnPoolCard
              key={pool.id}
              pool={pool}
              onSelect={onSelectPool}
              isLoading={isLoadingData}
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
            Need Help with Staking?
          </CardTitle>
          <CardDescription className="text-base">
            Learn how our earn pools work and discover strategies to maximize
            your passive income safely.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4">
            <Button
              variant="outline"
              size="sm"
              className="hover:scale-105 transition-transform bg-transparent"
            >
              📚 Read Documentation
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="hover:scale-105 transition-transform bg-transparent"
            >
              💬 Join Discord
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="hover:scale-105 transition-transform bg-transparent"
            >
              🎥 Watch Tutorials
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
