"use client"

import { useMemo, useState } from "react"
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
import { SubmitConfirmationDialog } from "@/components/SubmitConfirmationDialog"
import { SubmitSuccessDialog } from "@/components/SubmitSuccessDialog"
import { ValidationLoadingModal } from "@/components/ValidationLoadingModal"
import { ValidationStepGuide } from "@/components/ValidationStepsGuide"
import { useAccount } from "wagmi"
interface Props {
  formData: MintFormData
  onBack: () => void
  onComplete: () => void
}

export function MintStepTwo({ formData, onBack, onComplete }: Props) {
  const { toast } = useToast()
  const vault = useMemo(() => VAULTS.find((v) => v.id === formData.vaultId), [formData.vaultId])

  // State variables declaration
  const { address, isConnected } = useAccount()
  const [showConfirmDialog, setShowConfirmDialog] = useState(false)
  const [showSuccessDialog, setShowSuccessDialog] = useState(false)
  const [submitResult, setSubmitResult] = useState<any>(null)
  const [txHash, setTxHash] = useState("")
  const [validationResult, setValidationResult] = useState<any>(null)
  const [detectedSender, setDetectedSender] = useState("")
  const [dogeProof, setDogeProof] = useState<any>(null)
  const [amount, setAmount] = useState("")
  const [isValidating, setIsValidating] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [canSubmit, setCanSubmit] = useState(false)

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
    setCanSubmit(false)

    try {
      // First check if transaction hash already exists in database
      const duplicateCheckResponse = await fetch(`/api/mint-requests?address=${address}`, {
        method: "GET",
        headers: { "Content-Type": "application/json" },
      })

      if (duplicateCheckResponse.ok) {
        const { requests } = await duplicateCheckResponse.json()
        const existingRequest = requests.find((req: any) => req.transactionHash === txHash.trim())

        if (existingRequest) {
          throw new Error(
            "This transaction hash has already been used for a mint request. Each transaction can only be used once.",
          )
        }
      }

      // Generate proof using prove-doge-transaction API
      const response = await fetch("/api/prove-doge-transaction", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          txHash: txHash.trim(),
          proofSystem: "plonk",
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data?.error || "Failed to generate proof")
      }

      // Handle the new API response format
      if (data.totalDoge && data.senderAddress && data.proof) {
        setValidationResult(data)
        setDogeProof(data)
        setDetectedSender(data.senderAddress)
        // Convert satoshis to DOGE
        setAmount((data.totalDoge / 100000000).toString())
        setCanSubmit(true)

        toast({
          title: "Proof Generated Successfully",
          description: `Dogecoin transaction proof generated! Amount: ${(data.totalDoge / 100000000).toFixed(8)} DOGE`,
        })
      } else {
        throw new Error("Invalid proof response format")
      }
    } catch (error: any) {
      setValidationResult({ error: error.message })
      setCanSubmit(false)
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

  async function submitMintRequest() {
    if (!canSubmit) return
    try {
      setIsSubmitting(true)

      const response = await fetch("/api/mint", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          evmAddress: formData.evmAddress,
          evmChain: formData.evmChain,
          evmChainId: formData.evmChainId,
          vaultId: formData.vaultId,
          vaultChain: formData.vaultChain,
          userVaultChainAddress: detectedSender,
          transactionHash: txHash,
          amount: amount,
          utxo: txHash, // Use txHash as UTXO identifier
          proof: JSON.stringify(dogeProof), // Store the complete proof object
          requestType: "retail",
        }),
      })

      const data = await response.json()
      if (!response.ok) {
        throw new Error(data?.message || data?.error || "Failed to create mint request")
      }

      setSubmitResult(data)
      setShowConfirmDialog(false)
      setShowSuccessDialog(true)

      toast({
        title: "Mint Request Submitted",
        description: "Your admin-assisted mint request has been successfully submitted for approval.",
      })

      // Reset form
      setTxHash("")
      setValidationResult(null)
      setDetectedSender("")
      setDogeProof(null)
      setAmount("")
      setCanSubmit(false)
    } catch (err: any) {
      toast({
        title: "Submission Error",
        description: err?.message || "Failed to submit mint request. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleSubmitClick = () => {
    if (canSubmit) {
      setShowConfirmDialog(true)
    }
  }

  const handleGoToDashboard = () => {
    setShowSuccessDialog(false)
    onComplete()
  }

  return (
    <div className="space-y-6">
      <Card className="border-2 border-blue-200 bg-blue-50/30 dark:border-blue-800 dark:bg-blue-950/30">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <QrCode className="h-5 w-5 text-blue-600" />
            Step 3: Send Tokens & Add Transaction Hash
          </CardTitle>
          <CardDescription>
            First send your tokens using the QR code below, then add your transaction hash
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
                placeholder="Enter your Dogecoin transaction hash..."
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
          chainName={vault?.nativeChainName || "Dogecoin"}
          isValidating={isValidating}
          validationResult={validationResult}
          txHash={txHash}
          explorerUrl={vault?.explorerUrl}
        />
      )}

      <div className="flex flex-col sm:flex-row gap-2">
        <Button variant="outline" onClick={onBack} disabled={isValidating || isSubmitting}>
          Back to Form
        </Button>
        <Button onClick={validateHash} disabled={!txHash || isValidating || isSubmitting} className="flex-1">
          {isValidating && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
          Step 4: Validate Transaction
        </Button>
        <Button
          onClick={handleSubmitClick}
          disabled={!canSubmit || isSubmitting}
          className="flex-1 bg-green-600 hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isSubmitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
          Step 5: Submit Request
          {!canSubmit && !isValidating && " (Validate First)"}
        </Button>
      </div>

      {validationResult && !isValidating && (
        <Alert
          className={
            validationResult.totalDoge || validationResult.proof
              ? "border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-950"
              : "border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-950"
          }
        >
          {validationResult.totalDoge || validationResult.proof ? (
            <CheckCircle className="h-4 w-4 text-green-600" />
          ) : (
            <AlertTriangle className="h-4 w-4 text-red-600" />
          )}
          <AlertDescription
            className={
              validationResult.totalDoge || validationResult.proof
                ? "text-green-800 dark:text-green-200"
                : "text-red-800 dark:text-red-200"
            }
          >
            <strong>
              {validationResult.totalDoge || validationResult.proof
                ? "Dogecoin Proof Generated!"
                : "Proof Generation Failed"}
            </strong>
            {validationResult.totalDoge || validationResult.proof
              ? ` Your Dogecoin transaction (${(validationResult.totalDoge / 100000000).toFixed(8)} DOGE) has been cryptographically proven and is ready for submission.`
              : ` ${validationResult.error || "Please check your transaction hash and try again."}`}
          </AlertDescription>
        </Alert>
      )}

      <ValidationLoadingModal
        isOpen={isValidating}
        onClose={() => {}} // Prevent manual closing during validation
      />

      <SubmitConfirmationDialog
        isOpen={showConfirmDialog}
        onClose={() => setShowConfirmDialog(false)}
        onConfirm={submitMintRequest}
        isSubmitting={isSubmitting}
        formData={{
          vaultName: vault?.name || formData.vaultId,
          chainName: vault?.nativeChainName || formData.vaultChain || "",
          amount: amount,
          txHash: txHash,
          senderAddress: detectedSender,
          vaultAddress: vault?.nativeAddress || "",
        }}
      />

      <SubmitSuccessDialog
        isOpen={showSuccessDialog}
        onClose={() => setShowSuccessDialog(false)}
        onGoToDashboard={handleGoToDashboard}
        requestData={{
          requestId: submitResult?.request?.id || "",
          amount: amount,
          chainName: vault?.nativeChainName || formData.vaultChain || "",
          vaultName: vault?.name || formData.vaultId,
          recordedAt: submitResult?.request?.createdAt || new Date().toISOString(),
        }}
      />
    </div>
  )
}
