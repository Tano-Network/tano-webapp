"use client"

import { useState, useEffect } from "react"
import { useAccount, useWriteContract, useWaitForTransactionReceipt } from "wagmi"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/hooks/use-toast"
import { Vault, Loader2, CheckCircle, Shield, Coins, ExternalLink, Copy, ArrowLeft } from "lucide-react"
import { VAULTS } from "@/lib/constants"
import type { MintFormData } from "@/app/(app)/mint/page"

interface Props {
  formData: MintFormData
  validationResult: any
  onBack: () => void
  onComplete: () => void
}

export function MintVault({ formData, validationResult, onBack, onComplete }: Props) {
  const { address, isConnected } = useAccount()
  const { toast } = useToast()
  const [isMinting, setIsMinting] = useState(false)
  const [mintTxHash, setMintTxHash] = useState<string>("")

  const { writeContract, data: hash, error, isPending } = useWriteContract()
  const { isLoading: isConfirming, isSuccess: isConfirmed } = useWaitForTransactionReceipt({
    hash,
  })

  const vault = VAULTS.find((v) => v.id === formData.vaultId)

  useEffect(() => {
    if (isConfirmed && hash) {
      setMintTxHash(hash)
      setIsMinting(false)
      toast({
        title: "Mint Successful!",
        description: "Your tokens have been minted successfully.",
      })
    }
  }, [isConfirmed, hash, toast])

  useEffect(() => {
    if (error) {
      setIsMinting(false)
      toast({
        title: "Mint Failed",
        description: error.message || "Failed to mint tokens. Please try again.",
        variant: "destructive",
      })
    }
  }, [error, toast])

  const handleMint = async () => {
    if (!validationResult?.proof || !validationResult?.publicValues) {
      toast({
        title: "Missing Proof Data",
        description: "Proof or public values are missing. Please go back and validate again.",
        variant: "destructive",
      })
      return
    }

    try {
      setIsMinting(true)

      const proofBytes = `0x${validationResult.proof}` as `0x${string}`
      const publicValues = (`0x${validationResult.publicValues || ""}`) as `0x${string}`

      writeContract({
        address: vault?.assetManagementAddress as `0x${string}`, // Assuming vault has contract address
        abi: [
          {
            name: "mintWithZk",
            type: "function",
            stateMutability: "nonpayable",
            inputs: [
              { name: "_proofBytes", type: "bytes" },
              { name: "_publicValues", type: "bytes" },
            ],
            outputs: [],
          },
        ],
        functionName: "mintWithZk",
        args: [proofBytes, publicValues],
      })
    } catch (err: any) {
      setIsMinting(false)
      toast({
        title: "Mint Error",
        description: err?.message || "Failed to initiate mint transaction.",
        variant: "destructive",
      })
    }
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    toast({
      title: "Copied",
      description: "Address copied to clipboard",
    })
  }

  const formatAddress = (address: string) => `${address.slice(0, 6)}...${address.slice(-4)}`

  return (
    <div className="space-y-6">
      <Card className="border-2 border-purple-200 bg-purple-50/30 dark:border-purple-800 dark:bg-purple-950/30">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Vault className="h-5 w-5 text-purple-600" />
            Mint Vault - Zero-Knowledge Minting
          </CardTitle>
          <CardDescription>Use your validated proof to mint tokens directly from the smart contract</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Vault Information */}
          {vault && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <div className={`h-10 w-10 rounded-full bg-gradient-to-r ${vault.color}`} />
                  <div>
                    <div className="font-medium">{vault.name}</div>
                    <div className="text-sm text-muted-foreground">{vault.nativeChainName}</div>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Contract Address:</span>
                    <div className="flex items-center gap-1">
                      <span className="font-mono text-sm">
                        {formatAddress(vault.assetManagementAddress )}
                      </span>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => copyToClipboard(vault.assetManagementAddress )}
                        className="h-6 w-6 p-0"
                      >
                        <Copy className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>

                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Amount to Mint:</span>
                    <span className="font-mono text-sm">
                      {validationResult.totalDoge ? (validationResult.totalDoge / 100000000).toFixed(8) : "0"}{" "}
                      {vault.nativeChainName}
                    </span>
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <h4 className="font-medium text-sm">Proof Verification Status</h4>
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <span className="text-sm">Transaction Verified</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <span className="text-sm">Cryptographic Proof Generated</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Shield className="h-4 w-4 text-blue-600" />
                    <span className="text-sm">Zero-Knowledge Proof Ready</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Proof Details */}
          <div className="p-4 border rounded-lg bg-green-50 dark:bg-green-950/20 border-green-200 dark:border-green-800">
            <h4 className="font-medium text-sm mb-3 text-green-800 dark:text-green-200">Ready for Minting</h4>
            <div className="space-y-2 text-xs">
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Sender Address:</span>
                <span className="font-mono">{formatAddress(validationResult.senderAddress || "")}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Proof Size:</span>
                <span className="font-mono">
                  {validationResult.proof ? Math.round(validationResult.proof.length / 2) : 0} bytes
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Status:</span>
                <Badge className="bg-green-100 text-green-800 border-green-200">
                  <CheckCircle className="h-3 w-3 mr-1" />
                  Verified & Ready
                </Badge>
              </div>
            </div>
          </div>

          {/* Minting Actions */}
          <div className="space-y-4">
            {!mintTxHash ? (
              <div className="space-y-3">
                <Alert className="border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-950">
                  <Shield className="h-4 w-4 text-blue-600" />
                  <AlertDescription className="text-blue-800 dark:text-blue-200">
                    <strong>Ready to Mint:</strong> Your zero-knowledge proof has been validated. Click the button below
                    to mint your tokens directly from the smart contract.
                  </AlertDescription>
                </Alert>

                <Button
                  onClick={handleMint}
                  disabled={isMinting || isPending || isConfirming || !isConnected}
                  className="w-full bg-purple-600 hover:bg-purple-700"
                  size="lg"
                >
                  {(isMinting || isPending || isConfirming) && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                  <Coins className="h-4 w-4 mr-2" />
                  {isPending
                    ? "Confirming Transaction..."
                    : isConfirming
                      ? "Minting Tokens..."
                      : "Mint Tokens with ZK Proof"}
                </Button>
              </div>
            ) : (
              <div className="space-y-3">
                <Alert className="border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-950">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <AlertDescription className="text-green-800 dark:text-green-200">
                    <strong>Mint Successful!</strong> Your tokens have been minted successfully.
                  </AlertDescription>
                </Alert>

                <div className="flex items-center gap-2 p-3 border rounded-lg bg-card">
                  <span className="text-sm text-muted-foreground">Transaction Hash:</span>
                  <span className="font-mono text-sm flex-1">{formatAddress(mintTxHash)}</span>
                  <Button variant="ghost" size="sm" onClick={() => copyToClipboard(mintTxHash)} className="h-6 w-6 p-0">
                    <Copy className="h-3 w-3" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => window.open(`${vault?.explorerUrl}/tx/${mintTxHash}`, "_blank")}
                    className="h-6 w-6 p-0"
                  >
                    <ExternalLink className="h-3 w-3" />
                  </Button>
                </div>

                <Button onClick={onComplete} className="w-full" size="lg">
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Complete & Return to Dashboard
                </Button>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Navigation */}
      <div className="flex justify-between items-center">
        <Button variant="outline" onClick={onBack} disabled={isMinting || isPending || isConfirming}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Validation
        </Button>

        <div className="text-sm text-muted-foreground">Zero-Knowledge Minting Process</div>
      </div>
    </div>
  )
}
