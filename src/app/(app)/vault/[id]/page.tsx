"use client"
import { use, useEffect, useState } from "react"
import { Contract, BrowserProvider, parseUnits, formatUnits } from "ethers"
import Link from "next/link"
import { CheckCircle2, ExternalLink, ArrowLeft, Loader2, AlertTriangle } from "lucide-react"
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
import assetManagementAbi from "@/abi/assetManagement.json"
import assetAbi from "@/abi/asset.json"
import { cn } from "@/lib/utils"
import { useAccount, useChainId } from "wagmi"
import { CONTRACT_ADDRESSES, EXPLORER_URLS, SUPPORTED_CHAINS } from "@/lib/constants"

interface VaultParams {
  id: string
}

const getVaultData = (id: string) => {
  const vaults: Record<
    string,
    {
      asset: string
      icon: string
      contractAddress: string
      assetAddress: string
      color: string
      description: string
    }
  > = {
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
  return (
    vaults[id] || {
      asset: "Unknown",
      icon: "?",
      contractAddress: "0x0000000000000000000000000000000000000000",
      assetAddress: "0x0000000000000000000000000000000000000000",
      color: "from-gray-400 to-gray-600",
      description: "Unknown asset",
    }
  )
}

export default function VaultDepositPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const vault = getVaultData(id)
  const { address, isConnected } = useAccount()
  const chainId = useChainId()
  const { toast } = useToast()

  const [amount, setAmount] = useState("")
  const [contract, setContract] = useState<Contract | null>(null)
  const [assetContract, setAssetContract] = useState<Contract | null>(null)

  const [isWhitelisted, setIsWhitelisted] = useState(false)
  const [mintableAmount, setMintableAmount] = useState<number>(0)
  const [mintedAmount, setMintedAmount] = useState<number>(0)
  const [allowance, setAllowance] = useState<number>(0)
  const [currentAssetBalance, setCurrentAssetBalance] = useState<number>(0)

  const [isProcessing, setIsProcessing] = useState(false)
  const [showModal, setShowModal] = useState(false)
  const [modalContent, setModalContent] = useState<{
    title: string
    description: string
    isSuccess: boolean
    txHash?: string
  }>({ title: "", description: "", isSuccess: false })

  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Check if we're on Sepolia testnet
  const isCorrectNetwork = chainId === SUPPORTED_CHAINS.SEPOLIA
  const explorerUrl = EXPLORER_URLS[chainId as keyof typeof EXPLORER_URLS] || EXPLORER_URLS[SUPPORTED_CHAINS.SEPOLIA]

  useEffect(() => {
    const connect = async () => {
      try {
        if (!window.ethereum) {
          setError("Please install MetaMask or another Web3 wallet")
          return
        }

        if (!isConnected || !address) {
          setError("Please connect your wallet")
          return
        }

        if (!isCorrectNetwork) {
          setError("Please switch to Sepolia testnet")
          return
        }

        const provider = new BrowserProvider(window.ethereum)
        const signer = await provider.getSigner()

        const contractInstance = new Contract(vault.contractAddress, assetManagementAbi, signer)
        const assetInstance = new Contract(vault.assetAddress, assetAbi, signer)
        setContract(contractInstance)
        setAssetContract(assetInstance)
        setError(null)
      } catch (err) {
        console.error("Connection error:", err)
        setError("Failed to connect to contracts")
      }
    }
    connect()
  }, [vault.contractAddress, vault.assetAddress, isConnected, address, isCorrectNetwork])

  useEffect(() => {
    const fetchState = async () => {
      if (!contract || !assetContract || !address || !isCorrectNetwork) return

      setIsLoading(true)
      try {
        const [whitelisted, mintable, allowanceAmt, mintedAmt, curBal] = await Promise.all([
          contract.isWhitelisted(address),
          contract.getMintableAmount(address),
          contract.getAllowance(address),
          contract.getMintedAmount(address),
          assetContract.balanceOf(address),
        ])

        setIsWhitelisted(whitelisted)
        setMintableAmount(mintable)
        setAllowance(allowanceAmt)
        setMintedAmount(mintedAmt)
        setCurrentAssetBalance(curBal)
        setError(null)
      } catch (err) {
        console.error("Fetch error:", err)
        setError("Failed to fetch vault data. Please ensure you're on Sepolia testnet.")
      } finally {
        setIsLoading(false)
      }
    }
    fetchState()
  }, [contract, assetContract, address, isCorrectNetwork])

  const handleMint = async () => {
    if (!contract || !amount || Number.parseFloat(amount) <= 0) {
      toast({
        title: "Invalid Amount",
        description: "Please enter a valid amount to mint",
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
      title: "Preparing Transaction",
      description: "Please confirm the transaction in your wallet...",
      isSuccess: false,
    })

    try {
      const amountBigInt = parseUnits(amount, 18)

      // Check if amount exceeds mintable amount
      if (amountBigInt > mintableAmount) {
        throw new Error(`Amount exceeds your mintable limit of ${formatUnits(mintableAmount, 18)} ${vault.asset}`)
      }

      setModalContent({
        title: "Transaction Pending",
        description: "Confirm the transaction in your wallet...",
        isSuccess: false,
      })

      const tx = await contract.mint(amountBigInt)

      setModalContent({
        title: "Transaction Submitted",
        description: "Waiting for blockchain confirmation...",
        isSuccess: false,
      })

      const receipt = await tx.wait()

      if (receipt.status === 1) {
        setModalContent({
          title: "Mint Successful!",
          description: `Successfully minted ${amount} ${vault.asset}`,
          isSuccess: true,
          txHash: tx.hash,
        })

        toast({
          title: "Success!",
          description: `Minted ${amount} ${vault.asset}`,
        })

        setAmount("")

        // Refresh data
        const [mintable, mintedAmt, curBal] = await Promise.all([
          contract.getMintableAmount(address!),
          contract.getMintedAmount(address!),
          assetContract!.balanceOf(address!),
        ])
        setMintableAmount(mintable)
        setMintedAmount(mintedAmt)
        setCurrentAssetBalance(curBal)
      } else {
        throw new Error("Transaction failed")
      }
    } catch (err: any) {
      console.error("Mint error:", err)

      let errorMessage = "Transaction failed"
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
        title: "Transaction Failed",
        description: errorMessage,
        isSuccess: false,
      })

      toast({
        title: "Transaction Failed",
        description: errorMessage,
        variant: "destructive",
      })
    } finally {
      setIsProcessing(false)
    }
  }

  const maxMintable = Number(formatUnits(mintableAmount, 18))
  const usagePercentage =
    allowance > 0 ? (Number(formatUnits(mintedAmount, 18)) / Number(formatUnits(allowance, 18))) * 100 : 0

  if (!isConnected) {
    return (
      <div className="container mx-auto p-4 max-w-2xl">
        <Alert variant="destructive" className="mb-4">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>Please connect your wallet to access this vault</AlertDescription>
        </Alert>
        <Button asChild variant="outline">
          <Link href="/vault">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Vaults
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
            Please switch to Sepolia testnet to use this vault. Current network: {chainId}
          </AlertDescription>
        </Alert>
        <Button asChild variant="outline">
          <Link href="/vault">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Vaults
          </Link>
        </Button>
      </div>
    )
  }

  if (error) {
    return (
      <div className="container mx-auto p-4 max-w-2xl">
        <Alert variant="destructive" className="mb-4">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
        <Button asChild variant="outline">
          <Link href="/vault">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Vaults
          </Link>
        </Button>
      </div>
    )
  }

  if (!isWhitelisted && !isLoading) {
    return (
      <div className="container mx-auto p-4 max-w-2xl">
        <Button asChild variant="outline" className="mb-6 bg-transparent">
          <Link href="/vault">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Vaults
          </Link>
        </Button>

        <Card className="text-center">
          <CardHeader>
            <div
              className={cn(
                "mx-auto w-16 h-16 bg-gradient-to-br text-white rounded-full flex items-center justify-center text-2xl font-bold mb-4",
                vault.color,
              )}
            >
              {vault.icon}
            </div>
            <CardTitle className="text-2xl">Access Restricted</CardTitle>
            <CardDescription>
              You are not whitelisted to mint {vault.asset}. Please contact support for access.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button variant="outline">Contact Support</Button>
          </CardContent>
        </Card>
      </div>
    )
  }

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
                    vault.color,
                  )}
                >
                  {vault.icon}
                </div>
                <div>
                  <CardTitle className="text-2xl">Mint {vault.asset}</CardTitle>
                  <CardDescription>{vault.description}</CardDescription>
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
                    max={maxMintable.toString()}
                  />
                  <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-2">
                    <span className="text-muted-foreground font-medium">{vault.asset}</span>
                  </div>
                </div>
                <div className="flex justify-between mt-2 text-sm text-muted-foreground">
                  <span>
                    Available: {maxMintable.toFixed(4)} {vault.asset}
                  </span>
                  <Button
                    variant="link"
                    size="sm"
                    className="h-auto p-0"
                    onClick={() => setAmount(maxMintable.toString())}
                    disabled={isLoading || isProcessing || maxMintable === 0}
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
                  Number.parseFloat(amount) > maxMintable ||
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
                  `Mint ${vault.asset}`
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
                    <p className="text-sm text-muted-foreground">Current Balance</p>
                    <p className="text-lg font-semibold">
                      {Number(formatUnits(currentAssetBalance, 18)).toFixed(4)} {vault.asset}
                    </p>
                  </div>

                  <div>
                    <p className="text-sm text-muted-foreground">Mintable Amount</p>
                    <p className="text-lg font-semibold">
                      {Number(formatUnits(mintableAmount, 18)).toFixed(4)} {vault.asset}
                    </p>
                  </div>

                  <div>
                    <p className="text-sm text-muted-foreground">Total Allowance</p>
                    <p className="text-lg font-semibold">
                      {Number(formatUnits(allowance, 18)).toFixed(4)} {vault.asset}
                    </p>
                  </div>

                  <div>
                    <div className="flex justify-between text-sm mb-2">
                      <span className="text-muted-foreground">Usage</span>
                      <span className="font-medium">{usagePercentage.toFixed(1)}%</span>
                    </div>
                    <Progress value={usagePercentage} className="h-2" />
                    <p className="text-xs text-muted-foreground mt-1">
                      {Number(formatUnits(mintedAmount, 18)).toFixed(4)} /{" "}
                      {Number(formatUnits(allowance, 18)).toFixed(4)} used
                    </p>
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
                <span className="font-medium">{vault.asset}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Status</span>
                <Badge variant="default" >
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
                  {vault.contractAddress.slice(0, 6)}...{vault.contractAddress.slice(-4)}
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
