"use client"
import { useEffect, useState } from "react"
import { Plus, Minus, TrendingUp, Coins, Shield, Info } from "lucide-react"
import { RainbowConnectButton } from "@/components/RainbowConnectButton"
import { useAccount } from "wagmi"
import { ethers } from "ethers"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Progress } from "@/components/ui/progress"
import { LoadingSpinner } from "@/components/LoadingSpinner"
import { cn } from "@/lib/utils"

export default function EarnPage() {
  const [depositAmount, setDepositAmount] = useState("")
  const [withdrawAmount, setWithdrawAmount] = useState("")
  const [currentDeposit, setCurrentDeposit] = useState(5432.1)
  const [mode, setMode] = useState<"deposit" | "withdraw">("deposit")
  const { isConnected, address, chain } = useAccount()
  const [isWhitelisted, setIsWhitelisted] = useState<boolean | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [pageLoaded, setPageLoaded] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)

  useEffect(() => {
    setPageLoaded(true)
  }, [])

  useEffect(() => {
    if (isConnected && address) {
      console.log("Connected address:", address)
      const WHITELIST_CONTRACT = "0x6183367a204F2E2E9638d2ee5fDb281dB6f42F48"
      const ABI = ["function isWhitelisted(address user) view returns (bool)"]

      async function checkWhitelist() {
        setIsLoading(true)
        try {
          const provider = new ethers.BrowserProvider(window.ethereum)
          const contract = new ethers.Contract(WHITELIST_CONTRACT, ABI, provider)
          const whitelisted = await contract.isWhitelisted(address)
          setIsWhitelisted(whitelisted)
          console.log("Whitelist check:", whitelisted)
        } catch (err) {
          setIsWhitelisted(false)
          console.error("Whitelist check error:", err)
        } finally {
          setIsLoading(false)
        }
      }
      checkWhitelist()
    }
  }, [isConnected, address])

  const handleAction = async () => {
    const amount = Number.parseFloat(mode === "deposit" ? depositAmount : withdrawAmount)
    if (isNaN(amount) || amount <= 0) return

    setIsProcessing(true)

    // Simulate transaction processing
    await new Promise((resolve) => setTimeout(resolve, 2000))

    console.log("Earn action:", mode, amount)
    if (mode === "deposit") {
      setCurrentDeposit((prev) => prev + amount)
      setDepositAmount("")
    } else {
      setCurrentDeposit((prev) => Math.max(0, prev - amount))
      setWithdrawAmount("")
    }

    setIsProcessing(false)
  }

  const poolStats = {
    totalDeposited: "25.7M",
    currentAPY: "15.2%",
    yourShare: "0.021%",
    pendingRewards: "127.45",
  }

  const StatsCard = ({ icon, label, value, description, delay = 0 }) => (
    <Card
      className="hover:shadow-lg transition-all duration-300 hover:-translate-y-1"
      style={{ animationDelay: `${delay}ms` }}
    >
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">{label}</CardTitle>
        <div className="bg-primary/10 p-2 rounded-lg border border-primary/20">{icon}</div>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold text-foreground">{value}</div>
        {description && <p className="text-xs text-muted-foreground mt-1">{description}</p>}
      </CardContent>
    </Card>
  )

  return (
    <div
      className={cn(
        "container mx-auto p-4 md:p-8 max-w-6xl transition-all duration-700",
        pageLoaded ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4",
      )}
    >
      {/* Header */}
      <div className="mb-8 text-center md:text-left">
        <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-2 bg-gradient-to-r from-foreground to-primary bg-clip-text text-transparent">
          Stability Pool
        </h1>
        <p className="text-muted-foreground text-lg md:text-xl max-w-2xl">
          Deposit your tDOGE into the Stability Pool to earn rewards and help maintain protocol stability
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatsCard
          icon={<Coins size={20} className="text-primary" />}
          label="Total Deposited"
          value={poolStats.totalDeposited + " tDOGE"}
          description="Pool liquidity"
          delay={0}
        />
        <StatsCard
          icon={<TrendingUp size={20} className="text-primary" />}
          label="Current APY"
          value={poolStats.currentAPY}
          description="Annual percentage yield"
          delay={100}
        />
        <StatsCard
          icon={<Shield size={20} className="text-primary" />}
          label="Your Share"
          value={poolStats.yourShare}
          description="Of total pool"
          delay={200}
        />
        <StatsCard
          icon={<Plus size={20} className="text-primary" />}
          label="Pending Rewards"
          value={poolStats.pendingRewards + " tDOGE"}
          description="Ready to claim"
          delay={300}
        />
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Pool Card */}
        <div className="lg:col-span-2">
          <Card className="hover:shadow-xl transition-all duration-300">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-2xl flex items-center gap-2">
                    <div className="bg-gradient-to-br from-yellow-500 to-orange-500 p-2 rounded-lg text-white">Ð</div>
                    Stability Pool
                  </CardTitle>
                  <CardDescription>Earn rewards by providing stability to the protocol</CardDescription>
                </div>
                {isWhitelisted && (
                  <Badge variant="default" className="bg-green-500">
                    Whitelisted
                  </Badge>
                )}
              </div>
            </CardHeader>

            <CardContent className="space-y-6">
              {/* Wallet Info */}
              {/* <Alert className="border-primary/20 bg-primary/5">
                <Info className="h-4 w-4" />
                <AlertDescription className="flex items-center justify-between w-full">
                  <div className="flex flex-col sm:flex-row sm:items-center gap-2 text-sm">
                    <span>
                      Network: <strong>{chain?.name || "Unknown"}</strong>
                    </span>
                    <span className="hidden sm:inline">•</span>
                    <span>
                      Address:{" "}
                      <code className="bg-secondary px-2 py-1 rounded text-xs">
                        {address?.slice(0, 6)}...{address?.slice(-4)}
                      </code>
                    </span>
                  </div>
                  <RainbowConnectButton />
                </AlertDescription>
              </Alert> */}

              {/* Your Position */}
              <div className="bg-secondary/30 p-4 rounded-lg">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm text-muted-foreground">Your Deposit</span>
                  <span className="text-2xl font-bold text-foreground">{currentDeposit.toLocaleString()} tDOGE</span>
                </div>
                <Progress value={65} className="h-2 mb-2" />
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>Pool share: {poolStats.yourShare}</span>
                  <span>Earning {poolStats.currentAPY} APY</span>
                </div>
              </div>

              {/* Mode Toggle */}
              <div className="flex bg-secondary/30 rounded-lg p-1">
                <button
                  onClick={() => setMode("deposit")}
                  className={cn(
                    "w-1/2 py-3 rounded-md font-semibold transition-all duration-200",
                    mode === "deposit"
                      ? "bg-primary text-primary-foreground shadow-sm"
                      : "text-muted-foreground hover:bg-secondary/50",
                  )}
                >
                  <Plus size={16} className="inline mr-2" />
                  Deposit
                </button>
                <button
                  onClick={() => setMode("withdraw")}
                  className={cn(
                    "w-1/2 py-3 rounded-md font-semibold transition-all duration-200",
                    mode === "withdraw"
                      ? "bg-primary text-primary-foreground shadow-sm"
                      : "text-muted-foreground hover:bg-secondary/50",
                  )}
                >
                  <Minus size={16} className="inline mr-2" />
                  Withdraw
                </button>
              </div>

              {/* Input Section */}
              <div className="space-y-4">
                {mode === "deposit" ? (
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-muted-foreground block">Amount to deposit</label>
                    <div className="relative">
                      <Input
                        type="number"
                        placeholder="0.00"
                        value={depositAmount}
                        onChange={(e) => setDepositAmount(e.target.value)}
                        className="text-xl h-12 pr-20"
                        disabled={isProcessing}
                      />
                      <span className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground font-bold">
                        tDOGE
                      </span>
                    </div>
                    <div className="flex justify-between text-sm text-muted-foreground">
                      <span>Available: 10,000 tDOGE</span>
                      <Button variant="link" size="sm" className="h-auto p-0">
                        Max
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-muted-foreground block">Amount to withdraw</label>
                    <div className="relative">
                      <Input
                        type="number"
                        placeholder="0.00"
                        value={withdrawAmount}
                        onChange={(e) => setWithdrawAmount(e.target.value)}
                        className="text-xl h-12 pr-20"
                        disabled={isProcessing}
                      />
                      <span className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground font-bold">
                        tDOGE
                      </span>
                    </div>
                    <div className="flex justify-between text-sm text-muted-foreground">
                      <span>Deposited: {currentDeposit.toLocaleString()} tDOGE</span>
                      <Button variant="link" size="sm" className="h-auto p-0">
                        Max
                      </Button>
                    </div>
                  </div>
                )}

                <Button
                  onClick={handleAction}
                  disabled={
                    isProcessing ||
                    !isWhitelisted ||
                    (mode === "deposit" && (!depositAmount || Number.parseFloat(depositAmount) <= 0)) ||
                    (mode === "withdraw" && (!withdrawAmount || Number.parseFloat(withdrawAmount) <= 0))
                  }
                  className="w-full h-12 text-base"
                  size="lg"
                >
                  {isProcessing ? (
                    <>
                      <LoadingSpinner size="sm" className="mr-2" />
                      Processing...
                    </>
                  ) : mode === "deposit" ? (
                    <>
                      <Plus size={20} className="mr-2" />
                      Deposit
                    </>
                  ) : (
                    <>
                      <Minus size={20} className="mr-2" />
                      Withdraw
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Rewards Card */}
          <Card className="hover:shadow-lg transition-all duration-300">
            <CardHeader>
              <CardTitle className="text-lg">Your Rewards</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {isLoading ? (
                <div className="space-y-3">
                  {[...Array(3)].map((_, i) => (
                    <div key={i} className="space-y-2">
                      <div className="h-3 bg-muted rounded animate-pulse" />
                      <div className="h-4 bg-muted rounded animate-pulse w-2/3" />
                    </div>
                  ))}
                </div>
              ) : (
                <>
                  <div>
                    <p className="text-sm text-muted-foreground">Pending Rewards</p>
                    <p className="text-lg font-semibold text-green-600">{poolStats.pendingRewards} tDOGE</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Total Earned</p>
                    <p className="text-lg font-semibold">1,234.56 tDOGE</p>
                  </div>
                  <Button className="w-full bg-transparent" variant="outline">
                    Claim Rewards
                  </Button>
                </>
              )}
            </CardContent>
          </Card>

          {/* Pool Info */}
          <Card className="hover:shadow-lg transition-all duration-300">
            <CardHeader>
              <CardTitle className="text-lg">Pool Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Total Liquidity</span>
                <span className="font-medium">{poolStats.totalDeposited} tDOGE</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Current APY</span>
                <span className="font-medium text-green-600">{poolStats.currentAPY}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Pool Utilization</span>
                <span className="font-medium">78.5%</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Lock Period</span>
                <span className="font-medium">None</span>
              </div>
            </CardContent>
          </Card>

          {/* Risk Info */}
          <Card className="border-yellow-200 bg-yellow-50 dark:border-yellow-800 dark:bg-yellow-950/20">
            <CardHeader>
              <CardTitle className="text-lg text-yellow-800 dark:text-yellow-200">Risk Information</CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-yellow-700 dark:text-yellow-300">
              <p>
                Stability Pool deposits may be used to liquidate risky positions. While this is rare, depositors are
                compensated with liquidation bonuses.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
