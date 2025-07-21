"use client"

import { useEffect, useState } from "react"
import { parseUnits, formatUnits } from "viem"
import { useAccount, useChainId, useWriteContract } from "wagmi"
import { readContract, waitForTransactionReceipt } from "wagmi/actions"
import Link from "next/link"
import { CheckCircle2, ExternalLink, ArrowLeft, Loader2 } from "lucide-react"

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
import { Progress } from "@/components/ui/progress"
import { useToast } from "@/hooks/use-toast"
import assetManagementAbi from "@/abi/assetManagement.json"
import assetAbi from "@/abi/asset.json"
import { config } from "@/lib/wagmiConfig"
import { cn } from "@/lib/utils"
import { CONTRACT_ADDRESSES, EXPLORER_URLS, SUPPORTED_CHAINS } from "@/lib/constants"

type VaultKey = 'doge' | 'litecoin' | 'bitcoin_cash'

const getVaultData = (id: string) => {
  const vaults: Record<VaultKey, {
    asset: string
    icon: string
    contractAddress: string
    assetAddress: string
    color: string
    description: string
  }> = {
    doge: {
      asset: "tDOGE",
      icon: "Ð",
      contractAddress: CONTRACT_ADDRESSES[SUPPORTED_CHAINS.SEPOLIA].TDOGE_ASSET_MANAGEMENT,
      assetAddress: CONTRACT_ADDRESSES[SUPPORTED_CHAINS.SEPOLIA].TDOGE_TOKEN,
      color: "from-yellow-500 to-orange-500",
      description: "Tokenized Dogecoin for DeFi applications",
    },
    litecoin: {
      asset: "tLTC",
      icon: "Ł",
      contractAddress: CONTRACT_ADDRESSES[SUPPORTED_CHAINS.SEPOLIA].TLTC_ASSET_MANAGEMENT,
      assetAddress: CONTRACT_ADDRESSES[SUPPORTED_CHAINS.SEPOLIA].TLTC_TOKEN,
      color: "from-gray-400 to-gray-600",
      description: "Tokenized Litecoin for DeFi applications",
    },
    bitcoin_cash: {
      asset: "tBCH",
      icon: "Ƀ",
      contractAddress: CONTRACT_ADDRESSES[SUPPORTED_CHAINS.SEPOLIA].TBCH_ASSET_MANAGEMENT,
      assetAddress: CONTRACT_ADDRESSES[SUPPORTED_CHAINS.SEPOLIA].TBCH_TOKEN,
      color: "from-green-500 to-emerald-600",
      description: "Tokenized Bitcoin Cash for DeFi applications",
    },
  }

  if (id in vaults) {
    return vaults[id as VaultKey]
  }

  // fallback if id is not valid
  return {
    asset: "Unknown",
    icon: "?",
    contractAddress: "0x0000000000000000000000000000000000000000",
    assetAddress: "0x0000000000000000000000000000000000000000",
    color: "from-gray-400 to-gray-600",
    description: "Unknown asset",
  }
}

export default function VaultDepositPage({ params }: { params: Promise<{ id: string }> }) {
  const [vaultId, setVaultId] = useState<string | null>(null)
  const [vault, setVault] = useState<ReturnType<typeof getVaultData> | null>(null)
  const { address, isConnected } = useAccount()
  const chainId = useChainId()
  const { toast } = useToast()
  const { writeContractAsync } = useWriteContract()

  const [amount, setAmount] = useState("")
  const [isWhitelisted, setIsWhitelisted] = useState(false)
  const [mintableAmount, setMintableAmount] = useState<bigint>(BigInt(0))
  const [mintedAmount, setMintedAmount] = useState<bigint>(BigInt(0))
  const [allowance, setAllowance] = useState<bigint>(BigInt(0))
  const [currentAssetBalance, setCurrentAssetBalance] = useState<bigint>(BigInt(0))
  const [isProcessing, setIsProcessing] = useState(false)
  const [showModal, setShowModal] = useState(false)
  const [modalContent, setModalContent] = useState({
    title: "",
    description: "",
    isSuccess: false,
    txHash: undefined as string | undefined,
  })
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const isCorrectNetwork = chainId === SUPPORTED_CHAINS.SEPOLIA
  const explorerUrl =
    EXPLORER_URLS[chainId as keyof typeof EXPLORER_URLS] || EXPLORER_URLS[SUPPORTED_CHAINS.SEPOLIA]

  useEffect(() => {
    let mounted = true

    const initialize = async () => {
      // Resolve params and set vaultId
      const { id } = await params
      if (!mounted) return
      setVaultId(id)
      const vaultData = getVaultData(id)
      setVault(vaultData)

      if (!isConnected || !address || !isCorrectNetwork || vaultData.asset === "Unknown") {
        setError(vaultData.asset === "Unknown" ? "Vault not found" : null)
        setIsLoading(false)
        return
      }

      setIsLoading(true)
      try {
        const [whitelisted, mintable, allowanceAmt, mintedAmt, curBal, totalSupply] = await Promise.all([
          readContract(config, {
            address: vaultData.contractAddress as `0x${string}`,
            abi: assetManagementAbi,
            functionName: "isWhitelisted",
            args: [address],
          }),
          readContract(config, {
            address: vaultData.contractAddress as `0x${string}`,
            abi: assetManagementAbi,
            functionName: "getMintableAmount",
            args: [address],
          }),
          readContract(config, {
            address: vaultData.contractAddress as `0x${string}`,
            abi: assetManagementAbi,
            functionName: "getAllowance",
            args: [address],
          }),
          readContract(config, {
            address: vaultData.contractAddress as `0x${string}`,
            abi: assetManagementAbi,
            functionName: "getMintedAmount",
            args: [address],
          }),
          readContract(config, {
            address: vaultData.assetAddress as `0x${string}`,
            abi: assetAbi,
            functionName: "balanceOf",
            args: [address],
          }),
          readContract(config, {
            address: vaultData.assetAddress as `0x${string}`,
            abi: assetAbi,
            functionName: "totalSupply",
          }),
        ])

        if (!mounted) return
        setIsWhitelisted(whitelisted as boolean)
        setMintableAmount(mintable as bigint)
        setAllowance(allowanceAmt as bigint)
        setMintedAmount(mintedAmt as bigint)
        setCurrentAssetBalance(curBal as bigint)
        setError(null)
      } catch (err) {
        console.error("Data fetch error:", err)
        if (!mounted) return
        setError("Could not fetch vault data")
      } finally {
        if (mounted) setIsLoading(false)
      }
    }

    initialize()

    return () => {
      mounted = false
    }
  }, [params, isConnected, address, isCorrectNetwork])

  const handleMint = async () => {
    if (!isConnected || !address || !isCorrectNetwork || !vault) {
      toast({ title: "Error", description: "Connect wallet and switch to Sepolia", variant: "destructive" })
      return
    }
    if (!amount || parseFloat(amount) <= 0) {
      toast({ title: "Invalid", description: "Enter a valid amount", variant: "destructive" })
      return
    }

    if (!isCorrectNetwork) {
      toast({ title: "Wrong Network", description: "Switch to Sepolia", variant: "destructive" })
      return
    }

    setIsProcessing(true)
    setShowModal(true)
    setModalContent({ title: "Preparing Transaction", description: "Please confirm in your wallet...", isSuccess: false, txHash: undefined })

    try {
      const amountBigInt = parseUnits(amount, 18)
      if (amountBigInt > mintableAmount) {
        throw new Error(`Amount exceeds mintable limit of ${formatUnits(mintableAmount, 18)} ${vault.asset}`)
      }

      const hash = await writeContractAsync({
        address: vault.contractAddress as `0x${string}`,
        abi: assetManagementAbi,
        functionName: "mint",
        args: [amountBigInt],
      })

      setModalContent({ title: "Transaction Submitted", description: "Waiting for confirmation...", isSuccess: false, txHash: hash })

      await waitForTransactionReceipt(config, { hash })

      toast({ title: "Success", description: `Minted ${amount} ${vault.asset}` })

      setModalContent({ title: "Mint Successful!", description: `Successfully minted ${amount} ${vault.asset}`, isSuccess: true, txHash: hash })
      setAmount("")

      // Refresh state
      if (!address || !isCorrectNetwork) return
      try {
        const [mintable, minted, balance] = await Promise.all([
          readContract(config, {
            address: vault.contractAddress as `0x${string}`,
            abi: assetManagementAbi,
            functionName: "getMintableAmount",
            args: [address],
          }),
          readContract(config, {
            address: vault.contractAddress as `0x${string}`,
            abi: assetManagementAbi,
            functionName: "getMintedAmount",
            args: [address],
          }),
          readContract(config, {
            address: vault.assetAddress as `0x${string}`,
            abi: assetAbi,
            functionName: "balanceOf",
            args: [address],
          }),
        ])
        setMintableAmount(mintable as bigint)
        setMintedAmount(minted as bigint)
        setCurrentAssetBalance(balance as bigint)
      } catch (err) {
        console.error("Refresh state error:", err)
      }
    } catch (err: any) {
      console.error("Mint error:", err)
      const message =
        err?.message?.includes("user rejected")
          ? "Transaction cancelled"
          : err?.message || "Mint failed"
      setModalContent({ title: "Failed", description: message, isSuccess: false, txHash: undefined })
    } finally {
      setIsProcessing(false)
    }
  }

  const usagePercentage =
    allowance > BigInt(0)
      ? (Number(formatUnits(mintedAmount, 18)) / Number(formatUnits(allowance, 18))) * 100
      : 0

  return (
    <div className="container mx-auto p-4 max-w-4xl">
      <Button asChild variant="outline" className="mb-6 bg-transparent">
        <Link href="/vault">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Vaults
        </Link>
      </Button>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Mint Card */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <div className="flex items-center gap-4">
                <div
                  className={cn(
                    "w-12 h-12 bg-gradient-to-br text-white rounded-full flex items-center justify-center text-xl font-bold",
                    vault?.color,
                  )}
                >
                  {vault?.icon}
                </div>
                <div>
                  <CardTitle className="text-2xl">Mint {vault?.asset}</CardTitle>
                  <CardDescription>{vault?.description}</CardDescription>
                </div>
                <Badge variant="default" className="ml-auto">
                  Sepolia Testnet
                </Badge>
              </div>
            </CardHeader>

            <CardContent className="space-y-6">
              <div>
                <Label htmlFor="amount" className="text-base font-medium">
                  Amount to Mint
                </Label>
                <div className="relative mt-2">
                  <Input
                    id="amount"
                    type="number"
                    placeholder="0.0"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    className="text-lg h-12 pr-20"
                    disabled={isLoading || isProcessing}
                    step="0.01"
                    min="0"
                    max={formatUnits(mintableAmount, 18)}
                  />
                  <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-2">
                    <span className="text-muted-foreground font-medium">{vault?.asset}</span>
                  </div>
                </div>
                <div className="flex justify-between mt-2 text-sm text-muted-foreground">
                  <span>
                    Available: {Number(formatUnits(mintableAmount, 18)).toFixed(4)} {vault?.asset}
                  </span>
                  <Button
                    variant="link"
                    size="sm"
                    className="h-auto p-0"
                    onClick={() => setAmount(formatUnits(mintableAmount, 18))}
                    disabled={isLoading || isProcessing || mintableAmount === BigInt(0)}
                  >
                    Max
                  </Button>
                </div>
              </div>

              <Button
                onClick={handleMint}
                disabled={
                  !amount ||
                  Number.parseFloat(amount) <= 0 ||
                  Number.parseFloat(amount) > Number(formatUnits(mintableAmount, 18)) ||
                  isProcessing ||
                  isLoading ||
                  !isWhitelisted
                }
                className="w-full h-12 text-base"
                size="lg"
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Processing...
                  </>
                ) : (
                  `Mint ${vault?.asset}`
                )}
              </Button>
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
                    <div className="text-sm text-muted-foreground">Current Balance</div>
                    <div className="text-lg font-semibold">
                      {Number(formatUnits(currentAssetBalance, 18)).toFixed(4)} {vault?.asset}
                    </div>
                  </div>

                  <div>
                    <div className="text-sm text-muted-foreground">Mintable Amount</div>
                    <div className="text-lg font-semibold">
                      {Number(formatUnits(mintableAmount, 18)).toFixed(4)} {vault?.asset}
                    </div>
                  </div>

                  <div>
                    <div className="text-sm text-muted-foreground">Total Allowance</div>
                    <div className="text-lg font-semibold">
                      {Number(formatUnits(allowance, 18)).toFixed(4)} {vault?.asset}
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between text-sm mb-2">
                      <span className="text-muted-foreground">Usage</span>
                      <span className="font-medium">{usagePercentage.toFixed(1)}%</span>
                    </div>
                    <Progress value={usagePercentage} className="h-2" />
                    <div className="text-xs text-muted-foreground mt-1">
                      {Number(formatUnits(mintedAmount, 18)).toFixed(4)} /{" "}
                      {Number(formatUnits(allowance, 18)).toFixed(4)} used
                    </div>
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Vault Info</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Asset</span>
                <span className="font-medium">{vault?.asset}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Status</span>
                <Badge variant="default">
                  {isWhitelisted ? "Active" : "Restricted"}
                </Badge>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Network</span>
                <span className="font-medium">Sepolia Testnet</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Contract</span>
                <span className="font-mono text-xs">
                  {vault?.contractAddress.slice(0, 6)}...{vault?.contractAddress.slice(-4)}
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
        <span className="flex flex-col items-center mt-4 gap-3 max-w-full">
          {!modalContent.isSuccess ? (
            <Loader2 className="w-10 h-10 animate-spin text-primary" />
          ) : (
            <CheckCircle2 size={40} className="text-green-500" />
          )}
          <span className="text-center break-words overflow-hidden">
            {modalContent.description}
          </span>
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
        </span>
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