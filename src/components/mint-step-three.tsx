"use client"

import { useState } from "react"
import type { MintFormData } from "@/app/(app)/mint/page"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { useToast } from "@/hooks/use-toast"
import { Loader2, QrCode, Hash, CheckCircle, AlertTriangle } from "lucide-react"
import { VAULTS } from "@/lib/constants"
import { EnhancedQRCode } from "@/components/QRCode"
import { ValidationLoadingModal } from "@/components/ValidationLoadingModal"
import { ValidationStepGuide } from "@/components/ValidationStepsGuide"
import { useAccount } from "wagmi"

interface Props {
  formData: MintFormData
  onBack: () => void
  onComplete: (validationData: any) => void
}

export function MintStepThree({ formData, onBack, onComplete }: Props) {
  const { toast } = useToast()
  const vault = VAULTS.find((v) => v.id === formData.vaultId)
  const { address } = useAccount()
  const [txHash, setTxHash] = useState("")
  const [validationResult, setValidationResult] = useState<any>(null)
  const [isValidating, setIsValidating] = useState(false)

  const validateHash = async () => {
    if (!txHash.trim()) {
      toast({
        title: "Transaction Hash Required",
        description: "Please enter your transaction hash first.",
        variant: "destructive",
      })
      return
    }

    setIsValidating(true)
    setValidationResult(null)

    try {
      const duplicateCheckResponse = await fetch("/api/mint-records", {
        method: "GET",
        headers: { "Content-Type": "application/json" },
      })

      if (duplicateCheckResponse.ok) {
        const { records } = await duplicateCheckResponse.json()
        const existingRecord = records.find((record: any) => record.native_hash === txHash.trim())
        console.log("Existing record:", existingRecord)
        if (existingRecord) {
          throw new Error(
            "This transaction hash has already been used for minting. Each transaction can only be used once.",
          )
        }
      }

      let proveApiEndpoint = ""
      switch (vault?.id) {
        case "tdoge":
          proveApiEndpoint = "/api/prove-doge-transaction"
          break
        case "txrp":
          proveApiEndpoint = "/api/prove-xrp-transaction"
          break
        default:
          throw new Error(`Unsupported vault selected: ${vault?.name}`)
      }

      const response = await fetch(proveApiEndpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ownerAddress: address,
          txHash: txHash.trim(),
          proofSystem: "plonk",
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data?.error || "Failed to generate proof")
      }

      const totalAmount = data.totalDoge || data.totalXrp
      const coinSymbol = vault?.coin || ""
      const decimals = coinSymbol === "DOGE" ? 100000000 : 1000000 

      if (totalAmount && data.senderAddress && data.proof) {
        setValidationResult(data)

        toast({
          title: "Validation Complete",
          description: `Transaction validated! Amount: ${(totalAmount / decimals).toFixed(8)} ${coinSymbol}`,
        })

        onComplete({
          ...data,
          txHash: txHash.trim(),
          amount: (totalAmount / decimals).toString(),
        })
      } else {
        throw new Error("Invalid proof response format")
      }
    } catch (error: any) {
      setValidationResult({ error: error.message })
      toast({
        title: "Validation Failed",
        description:
          error.message || "Failed to validate transaction. Please check your transaction hash and try again.",
        variant: "destructive",
      })
    } finally {
      setIsValidating(false)
    }
  }

  return (
    <div className="space-y-6">
      <Card className="border-2 border-blue-200 bg-blue-50/30 dark:border-blue-800 dark:bg-blue-950/30">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <QrCode className="h-5 w-5 text-blue-600" />
            Step 3: Send Tokens & Validate Transaction
          </CardTitle>
          <CardDescription>
            Send your tokens using the QR code below, then add your transaction hash for validation
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {vault && (
            <EnhancedQRCode
              address={vault.nativeAddress}
              chainName={vault.nativeChainName}
              explorerUrl={vault.explorerUrl}
              isAdminAssisted={true}
            />
          )}

          <div className="space-y-4">
            <Alert className="border-orange-200 bg-orange-50 dark:border-orange-800 dark:bg-orange-950">
              <Hash className="h-4 w-4 text-orange-600" />
              <AlertDescription className="text-orange-800 dark:text-orange-200">
                <strong>After sending tokens:</strong> Copy the transaction hash from your wallet confirmation and paste
                it below. Each transaction hash can only be used once.
              </AlertDescription>
            </Alert>

            <div className="space-y-2">
              <Label htmlFor="txHash">Transaction Hash</Label>
              <Input
                id="txHash"
                placeholder={`Enter your ${vault?.coin || ""} transaction hash...`}
                value={txHash}
                onChange={(e) => setTxHash(e.target.value)}
                className="font-mono text-sm"
              />
              <p className="text-xs text-muted-foreground">Find this in your wallet after confirming the transaction</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {(isValidating || validationResult) && (
        <ValidationStepGuide
          chainName={vault?.nativeChainName || ""}
          isValidating={isValidating}
          validationResult={validationResult}
          txHash={txHash}
          explorerUrl={vault?.explorerUrl}
        />
      )}

      <div className="flex flex-col sm:flex-row gap-2">
        <Button variant="outline" onClick={onBack} disabled={isValidating}>
          Back to Form
        </Button>
        <Button onClick={validateHash} disabled={!txHash || isValidating} className="flex-1">
          {isValidating && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
          Validate & Continue
        </Button>
      </div>

      {validationResult && !isValidating && (
        <Alert
          className={
            validationResult.proof
              ? "border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-950"
              : "border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-950"
          }
        >
          {validationResult.proof ? (
            <CheckCircle className="h-4 w-4 text-green-600" />
          ) : (
            <AlertTriangle className="h-4 w-4 text-red-600" />
          )}
          <AlertDescription
            className={
              validationResult.proof
                ? "text-green-800 dark:text-green-200"
                : "text-red-800 dark:text-red-200"
            }
          >
            <strong>
              {validationResult.proof ? "Validation Complete!" : "Validation Failed"}
            </strong>
            {validationResult.proof
              ? ` Your transaction (${( (validationResult.totalDoge || validationResult.totalXrp) / (vault?.coin === "DOGE" ? 100000000 : 10000000) ).toFixed(8)} ${vault?.coin}) has been validated and is ready for minting.`
              : ` ${validationResult.error || "Please check your transaction hash and try again."}`}
          </AlertDescription>
        </Alert>
      )}

      <ValidationLoadingModal isOpen={isValidating} onClose={() => {}} />
    </div>
  )
}