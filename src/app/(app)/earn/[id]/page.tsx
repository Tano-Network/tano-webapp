"use client"
import { useEffect, useState } from "react"
import { Contract, BrowserProvider, parseUnits, formatUnits } from "ethers"
import Link from "next/link"
import { CheckCircle2, ExternalLink, ArrowLeft, Loader2, AlertTriangle, Info } from "lucide-react"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Progress } from "@/components/ui/progress"
import { useToast } from "@/hooks/use-toast"
import earnStakingAbi from "@/abi/earnStaking.json" // New ABI for staking
import assetAbi from "@/abi/asset.json" // ABI for ERC20 token (tDOGE)
import { cn } from "@/lib/utils"
import { useAccount, useChainId } from "wagmi"
import { CONTRACT_ADDRESSES, EXPLORER_URLS, SUPPORTED_CHAINS } from "@/lib/constants"
import {LoadingSpinner} from "@/components/LoadingSpinner" // Import LoadingSpinner

interface EarnParams {
  id: string
}

const getEarnPoolData = (id: string) => {
  const earnPools: Record<
    string,
    {
      asset: string
      icon: string
      contractAddress: string // Staking pool contract
      stakingTokenAddress: string // The token being staked (e.g., tDOGE)
      color: string
      description: string
    }
  > = {
    doge: {
      asset: "tDOGE",
      icon: "Ð",
      contractAddress: CONTRACT_ADDRESSES[SUPPORTED_CHAINS.SEPOLIA].TDOGE_STAKING_POOL,
      stakingTokenAddress: CONTRACT_ADDRESSES[SUPPORTED_CHAINS.SEPOLIA].TDOGE_TOKEN,
      color: "from-yellow-500 to-orange-500",
      description: "Stake your tDOGE to earn rewards",
    },
    litecoin: {
      asset: "tLTC",
      icon: "Ł",
      contractAddress: CONTRACT_ADDRESSES[SUPPORTED_CHAINS.SEPOLIA].TLTC_STAKING_POOL,
      stakingTokenAddress: CONTRACT_ADDRESSES[SUPPORTED_CHAINS.SEPOLIA].TLTC_TOKEN,
      color: "from-gray-400 to-gray-600",
      description: "Stake your tLTC to earn rewards",
    },
    bitcoin_cash: {
      asset: "tBCH",
      icon: "₿",
      contractAddress: CONTRACT_ADDRESSES[SUPPORTED_CHAINS.SEPOLIA].TBCH_STAKING_POOL,
      stakingTokenAddress: CONTRACT_ADDRESSES[SUPPORTED_CHAINS.SEPOLIA].TBCH_TOKEN,
      color: "from-green-500 to-emerald-600",
      description: "Stake your tBCH to earn rewards",
    },
  }
  return (
    earnPools[id] || {
      asset: "Unknown",
      icon: "?",
      contractAddress: "0x0000000000000000000000000000000000000000",
      stakingTokenAddress: "0x0000000000000000000000000000000000000000",
      color: "from-gray-400 to-gray-600",
      description: "Unknown earn pool",
    }
  )
}

export default function EarnPoolPage({ params }: { params: EarnParams }) {
  // Safely access params.id
  const poolId = typeof params.id === "string" ? params.id : ""
  const pool = getEarnPoolData(poolId)

  const { address, isConnected } = useAccount()
  const chainId = useChainId()
  const { toast } = useToast()

  const [depositAmount, setDepositAmount] = useState("")
  const [withdrawAmount, setWithdrawAmount] = useState("")
  const [mode, setMode] = useState<"deposit" | "withdraw">("deposit")

  const [stakingContract, setStakingContract] = useState<Contract | null>(null)
  const [stakingTokenContract, setStakingTokenContract] = useState<Contract | null>(null)

  const [stakedBalance, setStakedBalance] = useState<bigint>(0n)
  const [totalStaked, setTotalStaked] = useState<bigint>(0n)
  const [tokenBalance, setTokenBalance] = useState<bigint>(0n)
  const [tokenAllowance, setTokenAllowance] = useState<bigint>(0n)

  const [isProcessing, setIsProcessing] = useState(false)
  const [showModal, setShowModal] = useState(false)
  const [modalContent, setModalContent] = useState<{
    title: string
    description: string
    isSuccess: boolean
    txHash?: string
  }>({ title: "", description: "", isSuccess: false })

  const [isLoading, setIsLoading] = useState(true)
  const [pageError, setPageError] = useState<string | null>(null) // Renamed to avoid conflict with 'error' in modal

  // Check if we're on Sepolia testnet
  const isCorrectNetwork = chainId === SUPPORTED_CHAINS.SEPOLIA
  const explorerUrl = EXPLORER_URLS[chainId as keyof typeof EXPLORER_URLS] || EXPLORER_URLS[SUPPORTED_CHAINS.SEPOLIA]

  // Handle invalid pool ID early
  useEffect(() => {
    if (!poolId || pool.asset === "Unknown") {
      setPageError("Invalid earn pool ID. Please go back to the Earn Dashboard.")
      setIsLoading(false)
    }
  }, [poolId, pool.asset])

  // Connect to contracts
  useEffect(() => {
    const connect = async () => {
      if (pageError) return // Don't connect if there's a page error

      try {
        if (!window.ethereum) {
          setPageError("Please install MetaMask or another Web3 wallet")
          return
        }

        if (!isConnected || !address) {
          setPageError("Please connect your wallet")
          return
        }

        if (!isCorrectNetwork) {
          setPageError(`Please switch to Sepolia testnet (Chain ID: ${SUPPORTED_CHAINS.SEPOLIA})`)
          return
        }

        if (pool.contractAddress === "0x0000000000000000000000000000000000000000") {
          setPageError("This earn pool is not yet active or has an invalid contract address.")
          return
        }

        const provider = new BrowserProvider(window.ethereum)
        const signer = await provider.getSigner()

        const stakingContractInstance = new Contract(pool.contractAddress, earnStakingAbi, signer)
        const stakingTokenContractInstance = new Contract(pool.stakingTokenAddress, assetAbi, signer) // Assuming staking token is an ERC20

        setStakingContract(stakingContractInstance)
        setStakingTokenContract(stakingTokenContractInstance)
        setPageError(null)
      } catch (err) {
        console.error("Connection error:", err)
        setPageError("Failed to connect to contracts. Ensure correct network and contract addresses.")
      }
    }
    connect()
  }, [pool.contractAddress, pool.stakingTokenAddress, isConnected, address, isCorrectNetwork, pageError])

  // Fetch pool and user data
  useEffect(() => {
    const fetchState = async () => {
      if (!stakingContract || !stakingTokenContract || !address || !isCorrectNetwork || pageError) {
        setIsLoading(false) // Ensure loading is false if prerequisites aren't met
        return
      }

      setIsLoading(true)
      try {
        const [stakedBal, totalStakedAmt, tokenBal, tokenAllow] = await Promise.all([
          stakingContract.getStakedBalance(address),
          stakingContract.totalStaked(),
          stakingTokenContract.balanceOf(address),
          stakingTokenContract.allowance(address, pool.contractAddress),
        ])

        setStakedBalance(stakedBal)
        setTotalStaked(totalStakedAmt)
        setTokenBalance(tokenBal)
        setTokenAllowance(tokenAllow)
        setPageError(null)
      } catch (err) {
        console.error("Fetch error:", err)
        setPageError(
          "Failed to fetch earn pool data. Please ensure you're on Sepolia testnet and contracts are deployed.",
        )
      } finally {
        setIsLoading(false)
      }
    }
    fetchState()
  }, [stakingContract, stakingTokenContract, address, isCorrectNetwork, pageError, pool.contractAddress])

  const handleApprove = async () => {
    if (!stakingTokenContract || !depositAmount || Number.parseFloat(depositAmount) <= 0) {
      toast({
        title: "Invalid Amount",
        description: "Please enter a valid amount to approve",
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

    setIsProcessing(true)
    setShowModal(true)
    setModalContent({
      title: "Approving Token",
      description: `Please confirm approval for ${pool.asset} in your wallet...`,
      isSuccess: false,
    })

    try {
      const amountBigInt = parseUnits(depositAmount, 18) // Assuming 18 decimals for tDOGE

      const tx = await stakingTokenContract.approve(pool.contractAddress, amountBigInt)

      setModalContent({
        title: "Approval Submitted",
        description: "Waiting for blockchain confirmation...",
        isSuccess: false,
      })

      const receipt = await tx.wait()

      if (receipt.status === 1) {
        setModalContent({
          title: "Approval Successful!",
          description: `Successfully approved ${depositAmount} ${pool.asset}`,
          isSuccess: true,
          txHash: tx.hash,
        })
        toast({
          title: "Success!",
          description: `Approved ${depositAmount} ${pool.asset}`,
        })
        // Refresh allowance
        const newAllowance = await stakingTokenContract.allowance(address!, pool.contractAddress)
        setTokenAllowance(newAllowance)
      } else {
        throw new Error("Approval transaction failed")
      }
    } catch (err: any) {
      console.error("Approval error:", err)
      let errorMessage = "Approval failed"
      if (err?.reason) {
        errorMessage = err.reason
      } else if (err?.message) {
        if (err.message.includes("user rejected")) {
          errorMessage = "Approval was cancelled"
        } else if (err.message.includes("insufficient funds")) {
          errorMessage = "Insufficient funds for gas"
        } else {
          errorMessage = err.message
        }
      }
      setModalContent({
        title: "Approval Failed",
        description: errorMessage,
        isSuccess: false,
      })
      toast({
        title: "Approval Failed",
        description: errorMessage,
        variant: "destructive",
      })
    } finally {
      setIsProcessing(false)
    }
  }

  const handleDeposit = async () => {
    if (!stakingContract || !depositAmount || Number.parseFloat(depositAmount) <= 0) {
      toast({
        title: "Invalid Amount",
        description: "Please enter a valid amount to deposit",
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

    setIsProcessing(true)
    setShowModal(true)
    setModalContent({
      title: "Preparing Deposit Transaction",
      description: "Please confirm the transaction in your wallet...",
      isSuccess: false,
    })

    try {
      const amountBigInt = parseUnits(depositAmount, 18) // Assuming 18 decimals

      if (amountBigInt > tokenBalance) {
        throw new Error(`Insufficient ${pool.asset} balance. You have ${formatUnits(tokenBalance, 18)} ${pool.asset}.`)
      }

      if (amountBigInt > tokenAllowance) {
        throw new Error(`Allowance too low. Please approve at least ${depositAmount} ${pool.asset}.`)
      }

      setModalContent({
        title: "Deposit Transaction Pending",
        description: "Confirm the deposit transaction in your wallet...",
        isSuccess: false,
      })

      const tx = await stakingContract.deposit(amountBigInt)

      setModalContent({
        title: "Deposit Transaction Submitted",
        description: "Waiting for blockchain confirmation...",
        isSuccess: false,
      })

      const receipt = await tx.wait()

      if (receipt.status === 1) {
        setModalContent({
          title: "Deposit Successful!",
          description: `Successfully deposited ${depositAmount} ${pool.asset}`,
          isSuccess: true,
          txHash: tx.hash,
        })

        toast({
          title: "Success!",
          description: `Deposited ${depositAmount} ${pool.asset}`,
        })

        setDepositAmount("")
        // Refresh data
        const [stakedBal, totalStakedAmt, tokenBal, tokenAllow] = await Promise.all([
          stakingContract.getStakedBalance(address!),
          stakingContract.totalStaked(),
          stakingTokenContract!.balanceOf(address!),
          stakingTokenContract!.allowance(address!, pool.contractAddress),
        ])
        setStakedBalance(stakedBal)
        setTotalStaked(totalStakedAmt)
        setTokenBalance(tokenBal)
        setTokenAllowance(tokenAllow)
      } else {
        throw new Error("Deposit transaction failed")
      }
    } catch (err: any) {
      console.error("Deposit error:", err)

      let errorMessage = "Deposit transaction failed"
      if (err?.reason) {
        errorMessage = err.reason
      } else if (err?.message) {
        if (err.message.includes("user rejected")) {
          errorMessage = "Transaction was cancelled"
        } else if (err.message.includes("insufficient funds")) {
          errorMessage = "Insufficient funds for gas"
        } else {
          errorMessage = err.message
        }
      }

      setModalContent({
        title: "Deposit Failed",
        description: errorMessage,
        isSuccess: false,
      })

      toast({
        title: "Deposit Failed",
        description: errorMessage,
        variant: "destructive",
      })
    } finally {
      setIsProcessing(false)
    }
  }

  const handleWithdraw = async () => {
    if (!stakingContract || !withdrawAmount || Number.parseFloat(withdrawAmount) <= 0) {
      toast({
        title: "Invalid Amount",
        description: "Please enter a valid amount to withdraw",
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

    setIsProcessing(true)
    setShowModal(true)
    setModalContent({
      title: "Preparing Withdrawal Transaction",
      description: "Please confirm the transaction in your wallet...",
      isSuccess: false,
    })

    try {
      const amountBigInt = parseUnits(withdrawAmount, 18) // Assuming 18 decimals

      if (amountBigInt > stakedBalance) {
        throw new Error(`Insufficient staked balance. You have ${formatUnits(stakedBalance, 18)} ${pool.asset} staked.`)
      }

      setModalContent({
        title: "Withdrawal Transaction Pending",
        description: "Confirm the withdrawal transaction in your wallet...",
        isSuccess: false,
      })

      const tx = await stakingContract.withdraw(amountBigInt)

      setModalContent({
        title: "Withdrawal Transaction Submitted",
        description: "Waiting for blockchain confirmation...",
        isSuccess: false,
      })

      const receipt = await tx.wait()

      if (receipt.status === 1) {
        setModalContent({
          title: "Withdrawal Successful!",
          description: `Successfully withdrew ${withdrawAmount} ${pool.asset}`,
          isSuccess: true,
          txHash: tx.hash,
        })

        toast({
          title: "Success!",
          description: `Withdrew ${withdrawAmount} ${pool.asset}`,
        })

        setWithdrawAmount("")
        // Refresh data
        const [stakedBal, totalStakedAmt, tokenBal, tokenAllow] = await Promise.all([
          stakingContract.getStakedBalance(address!),
          stakingContract.totalStaked(),
          stakingTokenContract!.balanceOf(address!),
          stakingTokenContract!.allowance(address!, pool.contractAddress),
        ])
        setStakedBalance(stakedBal)
        setTotalStaked(totalStakedAmt)
        setTokenBalance(tokenBal)
        setTokenAllowance(tokenAllow)
      } else {
        throw new Error("Withdrawal transaction failed")
      }
    } catch (err: any) {
      console.error("Withdrawal error:", err)

      let errorMessage = "Withdrawal transaction failed"
      if (err?.reason) {
        errorMessage = err.reason
      } else if (err?.message) {
        if (err.message.includes("user rejected")) {
          errorMessage = "Transaction was cancelled"
        } else if (err.message.includes("insufficient funds")) {
          errorMessage = "Insufficient funds for gas"
        } else {
          errorMessage = err.message
        }
      }

      setModalContent({
        title: "Withdrawal Failed",
        description: errorMessage,
        isSuccess: false,
      })

      toast({
        title: "Withdrawal Failed",
        description: errorMessage,
        variant: "destructive",
      })
    } finally {
      setIsProcessing(false)
    }
  }

  const formattedStakedBalance = Number(formatUnits(stakedBalance, 18)).toFixed(4)
  const formattedTokenBalance = Number(formatUnits(tokenBalance, 18)).toFixed(4)
  const formattedTotalStaked = Number(formatUnits(totalStaked, 18)).toFixed(4)
  const formattedTokenAllowance = Number(formatUnits(tokenAllowance, 18)).toFixed(4)

  const usagePercentage =
    Number(formatUnits(totalStaked, 18)) > 0
      ? (Number(formatUnits(stakedBalance, 18)) / Number(formatUnits(totalStaked, 18))) * 100
      : 0

  // Render loading state if data is still being fetched or if poolId is invalid
  if (isLoading || !poolId || pool.asset === "Unknown") {
    return (
      <div className="container mx-auto p-4 max-w-2xl flex flex-col items-center justify-center min-h-[60vh]">
        <LoadingSpinner size="lg" />
        <p className="mt-4 text-muted-foreground">
          {pageError || (poolId ? "Loading earn pool data..." : "Invalid pool ID...")}
        </p>
        {pageError && (
          <Button asChild variant="outline" className="mt-6 bg-transparent">
            <Link href="/earn">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Earn Pools
            </Link>
          </Button>
        )}
      </div>
    )
  }

  if (!isConnected) {
    return (
      <div className="container mx-auto p-4 max-w-2xl">
        <Alert variant="destructive" className="mb-4">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>Please connect your wallet to access this earn pool</AlertDescription>
        </Alert>
        <Button asChild variant="outline">
          <Link href="/earn">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Earn Pools
          </Link>
        </Button>
      </div>
    )
  }

  if (!isCorrectNetwork) {
    return (
      <div className="container mx-auto p-4 max-w-2xl">
        <Alert variant="destructive" className="mb-4">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            Please switch to Sepolia testnet to use this earn pool. Current network: {chainId}
          </AlertDescription>
        </Alert>
        <Button asChild variant="outline">
          <Link href="/earn">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Earn Pools
          </Link>
        </Button>
      </div>
    )
  }

  if (pageError) {
    // Display specific page errors
    return (
      <div className="container mx-auto p-4 max-w-2xl">
        <Alert variant="destructive" className="mb-4">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>{pageError}</AlertDescription>
        </Alert>
        <Button asChild variant="outline">
          <Link href="/earn">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Earn Pools
          </Link>
        </Button>
      </div>
    )
  }

  const needsApproval =
    mode === "deposit" && Number.parseFloat(depositAmount) > 0 && parseUnits(depositAmount, 18) > tokenAllowance

  return (
    <div className="container mx-auto p-4 max-w-4xl">
      <Button asChild variant="outline" className="mb-6 bg-transparent">
        <Link href="/earn">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Earn Pools
        </Link>
      </Button>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Earn Card */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <div className="flex items-center gap-4">
                <div
                  className={cn(
                    "w-12 h-12 bg-gradient-to-br text-white rounded-full flex items-center justify-center text-xl font-bold",
                    pool.color,
                  )}
                >
                  {pool.icon}
                </div>
                <div>
                  <CardTitle className="text-2xl">Stake {pool.asset}</CardTitle>
                  <CardDescription>{pool.description}</CardDescription>
                </div>
                <Badge variant="default" className="ml-auto">
                  Sepolia Testnet
                </Badge>
              </div>
            </CardHeader>

            <CardContent className="space-y-6">
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
                  disabled={isLoading || isProcessing}
                >
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
                  disabled={isLoading || isProcessing}
                >
                  Withdraw
                </button>
              </div>

              {/* Input Section */}
              <div className="space-y-4">
                {mode === "deposit" ? (
                  <div className="space-y-2">
                    <Label htmlFor="deposit-amount" className="text-base font-medium">
                      Amount to Deposit
                    </Label>
                    <div className="relative mt-2">
                      <Input
                        id="deposit-amount"
                        type="number"
                        placeholder="0.0"
                        value={depositAmount}
                        onChange={(e) => setDepositAmount(e.target.value)}
                        className="text-lg h-12 pr-20"
                        disabled={isLoading || isProcessing}
                        step="0.01"
                        min="0"
                        max={formattedTokenBalance}
                      />
                      <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-2">
                        <span className="text-muted-foreground font-medium">{pool.asset}</span>
                      </div>
                    </div>
                    <div className="flex justify-between mt-2 text-sm text-muted-foreground">
                      <span>
                        Available: {formattedTokenBalance} {pool.asset}
                      </span>
                      <Button
                        variant="link"
                        size="sm"
                        className="h-auto p-0"
                        onClick={() => setDepositAmount(formattedTokenBalance)}
                        disabled={isLoading || isProcessing || Number(formattedTokenBalance) === 0}
                      >
                        Max
                      </Button>
                    </div>
                    {needsApproval && (
                      <Alert className="mt-4 border-yellow-500/50 text-yellow-600 dark:text-yellow-300 bg-yellow-50 dark:bg-yellow-950/20">
                        <Info className="h-4 w-4" />
                        <AlertDescription>
                          You need to approve the staking pool to spend your {pool.asset} before depositing.
                        </AlertDescription>
                      </Alert>
                    )}
                  </div>
                ) : (
                  <div className="space-y-2">
                    <Label htmlFor="withdraw-amount" className="text-base font-medium">
                      Amount to Withdraw
                    </Label>
                    <div className="relative mt-2">
                      <Input
                        id="withdraw-amount"
                        type="number"
                        placeholder="0.0"
                        value={withdrawAmount}
                        onChange={(e) => setWithdrawAmount(e.target.value)}
                        className="text-lg h-12 pr-20"
                        disabled={isLoading || isProcessing}
                        step="0.01"
                        min="0"
                        max={formattedStakedBalance}
                      />
                      <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-2">
                        <span className="text-muted-foreground font-medium">{pool.asset}</span>
                      </div>
                    </div>
                    <div className="flex justify-between mt-2 text-sm text-muted-foreground">
                      <span>
                        Staked: {formattedStakedBalance} {pool.asset}
                      </span>
                      <Button
                        variant="link"
                        size="sm"
                        className="h-auto p-0"
                        onClick={() => setWithdrawAmount(formattedStakedBalance)}
                        disabled={isLoading || isProcessing || Number(formattedStakedBalance) === 0}
                      >
                        Max
                      </Button>
                    </div>
                  </div>
                )}

                {mode === "deposit" && needsApproval ? (
                  <Button
                    onClick={handleApprove}
                    disabled={
                      !depositAmount ||
                      Number.parseFloat(depositAmount) <= 0 ||
                      isProcessing ||
                      isLoading ||
                      parseUnits(depositAmount, 18) > tokenBalance
                    }
                    className="w-full h-12 text-base"
                    size="lg"
                  >
                    {isProcessing ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Approving...
                      </>
                    ) : (
                      `Approve ${pool.asset}`
                    )}
                  </Button>
                ) : (
                  <Button
                    onClick={mode === "deposit" ? handleDeposit : handleWithdraw}
                    disabled={
                      isProcessing ||
                      isLoading ||
                      (mode === "deposit" &&
                        (!depositAmount ||
                          Number.parseFloat(depositAmount) <= 0 ||
                          parseUnits(depositAmount, 18) > tokenBalance ||
                          parseUnits(depositAmount, 18) > tokenAllowance)) ||
                      (mode === "withdraw" &&
                        (!withdrawAmount ||
                          Number.parseFloat(withdrawAmount) <= 0 ||
                          parseUnits(withdrawAmount, 18) > stakedBalance))
                    }
                    className="w-full h-12 text-base"
                    size="lg"
                  >
                    {isProcessing ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Processing...
                      </>
                    ) : mode === "deposit" ? (
                      `Deposit ${pool.asset}`
                    ) : (
                      `Withdraw ${pool.asset}`
                    )}
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Stats Sidebar */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Your Stats</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {isLoading ? (
                <div className="space-y-3">
                  {[...Array(4)].map((_, i) => (
                    <div key={i} className="space-y-2">
                      <div className="h-3 bg-muted rounded animate-pulse" />
                      <div className="h-4 bg-muted rounded animate-pulse w-2/3" />
                    </div>
                  ))}
                </div>
              ) : (
                <>
                  <div>
                    <p className="text-sm text-muted-foreground">Your Staked Balance</p>
                    <p className="text-lg font-semibold">
                      {formattedStakedBalance} {pool.asset}
                    </p>
                  </div>

                  <div>
                    <p className="text-sm text-muted-foreground">Your Wallet Balance</p>
                    <p className="text-lg font-semibold">
                      {formattedTokenBalance} {pool.asset}
                    </p>
                  </div>

                  <div>
                    <p className="text-sm text-muted-foreground">Approved Allowance</p>
                    <p className="text-lg font-semibold">
                      {formattedTokenAllowance} {pool.asset}
                    </p>
                  </div>

                  <div>
                    <div className="flex justify-between text-sm mb-2">
                      <span className="text-muted-foreground">Your Share of Pool</span>
                      <span className="font-medium">{usagePercentage.toFixed(1)}%</span>
                    </div>
                    <Progress value={usagePercentage} className="h-2" />
                    <p className="text-xs text-muted-foreground mt-1">
                      {formattedStakedBalance} / {formattedTotalStaked} staked
                    </p>
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Pool Info</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Asset</span>
                <span className="font-medium">{pool.asset}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Total Staked</span>
                <span className="font-medium">
                  {formattedTotalStaked} {pool.asset}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Network</span>
                <span className="font-medium">Sepolia Testnet</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Contract</span>
                <span className="font-mono text-xs">
                  {pool.contractAddress.slice(0, 6)}...{pool.contractAddress.slice(-4)}
                </span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <AlertDialog open={showModal} onOpenChange={setShowModal}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{modalContent.title}</AlertDialogTitle>
            <AlertDialogDescription>
              <div className="flex flex-col items-center mt-4 gap-3">
                {!modalContent.isSuccess ? (
                  <Loader2 className="w-10 h-10 animate-spin text-primary" />
                ) : (
                  <CheckCircle2 size={40} className="text-green-500" />
                )}
                <p className="text-center">{modalContent.description}</p>
                {modalContent.isSuccess && modalContent.txHash && (
                  <Button asChild variant="outline" size="sm">
                    <a
                      href={`${explorerUrl}/tx/${modalContent.txHash}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2"
                    >
                      View on Etherscan <ExternalLink size={14} />
                    </a>
                  </Button>
                )}
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          {modalContent.isSuccess && (
            <AlertDialogFooter>
              <AlertDialogAction onClick={() => setShowModal(false)}>Close</AlertDialogAction>
            </AlertDialogFooter>
          )}
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
