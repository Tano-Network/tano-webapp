"use client"

import { useState } from "react"
import type { MintFormData } from "@/app/(app)/mint/page"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { useToast } from "@/hooks/use-toast"
import { Loader2, Vault, CheckCircle, AlertTriangle, ExternalLink } from "lucide-react"
import { VAULTS } from "@/lib/constants"
import { useAccount, useWriteContract, useWaitForTransactionReceipt } from "wagmi"
import Testabi from  "@/abi/test.json";
interface Props {
  formData: MintFormData
  validationData: any
  onBack: () => void
  onComplete: () => void
}

export function MintStepFour({ formData, validationData, onBack, onComplete }: Props) {
  const assetManagementAddress = "0x6538cE279184142B72A057cAe5e5b2D475Da0551";
  const { toast } = useToast()
  const { address } = useAccount()
  const vault = VAULTS.find((v) => v.id === formData.vaultId)

  const [isMinting, setIsMinting] = useState(false)
  const [mintTxHash, setMintTxHash] = useState<string>("")

  const { writeContractAsync, data: hash, error, isPending } = useWriteContract()

  const { isLoading: isConfirming, isSuccess: isConfirmed } = useWaitForTransactionReceipt({
    hash,
  })

  const handleMint = async () => {
    if (!assetManagementAddress || !validationData?.proof || !address) {
      toast({
        title: "Missing Data",
        description: "Required minting data is missing. Please go back and validate again.",
        variant: "destructive",
      })
      return
    }

    setIsMinting(true)

    try {
      console.log("Minting with proof:", validationData);
      await writeContractAsync({
        address: assetManagementAddress as `0x${string}`,
        abi: Testabi,
        functionName: "mintWithZk",
        args: [validationData.proof|| "0x", validationData.publicValues || "0x"],
      })

      toast({
        title: "Minting Transaction Submitted",
        description: "Your minting transaction has been submitted to the blockchain.",
      })
    } catch (error: any) {
      console.error("Minting error:", error)
      toast({
        title: "Minting Failed",
        description: error.message || "Failed to submit minting transaction.",
        variant: "destructive",
      })
      setIsMinting(false)
    }
  }

  const handleMintSuccess = async () => {
    if (!hash) return

    try {
      // Create mint record with both native tx hash and minting tx hash
      const response = await fetch("/api/mint-records", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          evmChainId: vault?.evmChainId,
          evmChain: vault?.evmChain,
          vaultId: formData.vaultId,
          vaultName: vault?.coinGeckoId,
          userAddress: address,
          userAddressNative: validationData.senderAddress,
          nativeTxHash: validationData.txHash,
          mintTxHash: hash,
          amount: validationData.amount,
          status: "completed",
          proofData: validationData.proof,
        }),
      })

      if (response.ok) {
        toast({
          title: "Mint Record Created",
          description: "Your mint has been successfully recorded.",
        })
        onComplete()
      } else {
        throw new Error("Failed to create mint record")
      }
    } catch (error: any) {
      toast({
        title: "Record Creation Failed",
        description: error.message || "Failed to create mint record.",
        variant: "destructive",
      })
    } finally {
      setIsMinting(false)
    }
  }

  // Monitor transaction confirmation
  if (isConfirmed && hash && !mintTxHash) {
    setMintTxHash(hash)
    handleMintSuccess()
  }

  return (
    <div className="space-y-6">
      <Card className="border-2 border-purple-200 bg-purple-50/30 dark:border-purple-800 dark:bg-purple-950/30">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Vault className="h-5 w-5 text-purple-600" />
            Step 4: Mint Tokens
          </CardTitle>
          <CardDescription>Execute the smart contract minting with your validated proof</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <h4 className="font-medium">Vault Details</h4>
              <p className="text-sm text-muted-foreground">Name: {vault?.name}</p>
              <p className="text-sm text-muted-foreground">Chain: {vault?.evmChain}</p>
              <p className="text-sm text-muted-foreground">Contract: {assetManagementAddress}</p>
            </div>
            <div className="space-y-2">
              <h4 className="font-medium">Mint Details</h4>
              <p className="text-sm text-muted-foreground">Amount: {validationData.amount} DOGE</p>
              <p className="text-sm text-muted-foreground">Native Tx: {validationData.txHash.slice(0, 10)}...</p>
              <p className="text-sm text-muted-foreground">Sender: {validationData.senderAddress}</p>
            </div>
          </div>

          <Alert className="border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-950">
            <CheckCircle className="h-4 w-4 text-blue-600" />
            <AlertDescription className="text-blue-800 dark:text-blue-200">
              <strong>Ready to Mint:</strong> Your transaction has been validated and the zero-knowledge proof is ready.
              Click the button below to execute the minting smart contract.
            </AlertDescription>
          </Alert>

          {error && (
            <Alert className="border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-950">
              <AlertTriangle className="h-4 w-4 text-red-600" />
              <AlertDescription className="text-red-800 dark:text-red-200">
                <strong>Minting Error:</strong> {error.message}
              </AlertDescription>
            </Alert>
          )}

          {hash && (
            <Alert className="border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-950">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <AlertDescription className="text-green-800 dark:text-green-200">
                <strong>Transaction Submitted:</strong> Your minting transaction has been submitted.
                <br />
                <a
                  href={`${vault?.evmExplorerUrl}/tx/${hash}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 underline hover:no-underline"
                >
                  View on Explorer <ExternalLink className="h-3 w-3" />
                </a>
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      <div className="flex flex-col sm:flex-row gap-2">
        <Button variant="outline" onClick={onBack} disabled={isMinting || isPending || isConfirming}>
          Back
        </Button>
        <Button
          onClick={handleMint}
          disabled={isMinting || isPending || isConfirming || isConfirmed}
          className="flex-1 bg-purple-600 hover:bg-purple-700"
        >
          {(isPending || isConfirming) && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
          {isPending
            ? "Confirm in Wallet..."
            : isConfirming
              ? "Confirming..."
              : isConfirmed
                ? "Completed!"
                : "Mint Tokens"}
        </Button>
      </div>
    </div>
  )
}
