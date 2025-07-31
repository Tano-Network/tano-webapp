"use client"

import type React from "react"
import { useState } from "react"
import { QRCodeSVG } from "qrcode.react"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { VAULTS } from "@/lib/constants"
import { useToast } from "@/hooks/use-toast"
import { Loader2, ExternalLink, CheckCircle, XCircle, ArrowLeft } from "lucide-react"
import type { MintFormData } from "@/app/(app)/mint/page"

interface MintStepTwoProps {
  formData: MintFormData
  onBack: () => void
  onComplete: () => void
}

interface ValidationResult {
  isValid: boolean
  message: string
  transactionDetails?: {
    amount: string
    fromAddress: string
    toAddress: string
    confirmations: number
    utxo: string
  }
}

export function MintStepTwo({ formData, onBack, onComplete }: MintStepTwoProps) {
  const [transactionHash, setTransactionHash] = useState<string>("")
  const [isValidating, setIsValidating] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [validationResult, setValidationResult] = useState<ValidationResult | null>(null)
  const [isValidated, setIsValidated] = useState(false)
  const { toast } = useToast()

  const selectedVault = VAULTS.find((vault) => vault.id === formData.vaultId)!

  const handleValidate = async () => {
    if (!transactionHash) {
      toast({
        title: "Missing Information",
        description: "Please enter the transaction hash.",
        variant: "destructive",
      })
      return
    }

    setIsValidating(true)
    setValidationResult(null)
    setIsValidated(false)

    try {
      const response = await fetch("/api/validate-transaction", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          transactionHash,
          userVaultChainAddress: formData.userVaultChainAddress,
          vaultId: formData.vaultId,
          vaultChain: formData.vaultChain,
          depositAddress: selectedVault.nativeAddress,
        }),
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.message || "Validation failed")
      }

      setValidationResult(result)
      setIsValidated(result.isValid)

      if (result.isValid) {
        toast({
          title: "Transaction Validated",
          description: "Your transaction has been successfully validated. You can now submit your mint request.",
        })
      } else {
        toast({
          title: "Validation Failed",
          description: result.message,
          variant: "destructive",
        })
      }
    } catch (error: any) {
      toast({
        title: "Validation Error",
        description: error.message || "An error occurred during validation.",
        variant: "destructive",
      })
      setValidationResult({
        isValid: false,
        message: error.message || "Validation failed",
      })
    } finally {
      setIsValidating(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!isValidated || !validationResult?.transactionDetails) {
      toast({
        title: "Cannot Submit",
        description: "Please validate your transaction first.",
        variant: "destructive",
      })
      return
    }

    setIsSubmitting(true)
    try {
      const response = await fetch("/api/mint", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...formData,
          transactionHash,
          amount: validationResult.transactionDetails.amount,
          utxo: validationResult.transactionDetails.utxo,
          proof: JSON.stringify(validationResult.transactionDetails),
          requestType: "retail",
        }),
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.message || "Mint request failed")
      }

      toast({
        title: "Mint Request Submitted",
        description: "Your mint request has been recorded and is pending admin approval for token minting.",
      })

      // Reset form and complete
      setTransactionHash("")
      setValidationResult(null)
      setIsValidated(false)
      onComplete()
    } catch (error: any) {
      toast({
        title: "Mint Request Failed",
        description: error.message || "An unexpected error occurred.",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4 mb-6">
        <Button variant="outline" size="sm" onClick={onBack}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>
        <div>
          <h3 className="font-semibold">Transaction Verification</h3>
          <p className="text-sm text-muted-foreground">
            Vault: {selectedVault.name} | Chain: {selectedVault.nativeChainName}
          </p>
        </div>
      </div>

      <Card className="border-dashed border-2 p-4 text-center space-y-4">
        <CardHeader className="p-0">
          <CardTitle className="text-xl">Deposit to {selectedVault.nativeChainName}</CardTitle>
          <CardDescription>
            Send your {selectedVault.nativeChainName} to the address below, then provide the transaction hash.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col items-center justify-center p-0">
          <div className="p-2 bg-white rounded-lg">
            <QRCodeSVG value={selectedVault.nativeAddress} size={180} level="H" />
          </div>
          <p className="mt-4 text-sm font-mono break-all bg-gray-100 p-2 rounded">{selectedVault.nativeAddress}</p>
          <div className="flex gap-2 mt-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                navigator.clipboard.writeText(selectedVault.nativeAddress)
                toast({ title: "Address Copied", description: "Deposit address copied to clipboard." })
              }}
            >
              Copy Address
            </Button>
            <Button variant="outline" size="sm" onClick={() => window.open(selectedVault.explorerUrl, "_blank")}>
              <ExternalLink className="h-4 w-4 mr-1" />
              Explorer
            </Button>
          </div>
        </CardContent>
        <CardFooter className="p-0">
          <p className="text-xs text-muted-foreground">
            Note: This is a testnet address. Send only testnet coins to this address.
          </p>
        </CardFooter>
      </Card>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="space-y-2">
          <Label htmlFor="transactionHash">Transaction Hash</Label>
          <Input
            id="transactionHash"
            placeholder="Enter the transaction hash from your deposit"
            value={transactionHash}
            onChange={(e) => setTransactionHash(e.target.value)}
            disabled={isValidating || isSubmitting}
            required
          />
          <p className="text-xs text-muted-foreground">
            The transaction hash (TXID) from your {selectedVault.nativeChainName} deposit.
          </p>
        </div>

        <div className="flex gap-4">
          <Button
            type="button"
            variant="outline"
            onClick={handleValidate}
            disabled={!transactionHash || isValidating || isSubmitting}
            className="flex-1 bg-transparent"
          >
            {isValidating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Validate Transaction
          </Button>

          <Button type="submit" disabled={!isValidated || isSubmitting} className="flex-1">
            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Submit Mint Request
          </Button>
        </div>

        {validationResult && (
          <Card
            className={`p-4 ${validationResult.isValid ? "border-green-200 bg-green-50" : "border-red-200 bg-red-50"}`}
          >
            <div className="flex items-center gap-2">
              {validationResult.isValid ? (
                <CheckCircle className="h-5 w-5 text-green-600" />
              ) : (
                <XCircle className="h-5 w-5 text-red-600" />
              )}
              <span className={`font-medium ${validationResult.isValid ? "text-green-800" : "text-red-800"}`}>
                {validationResult.isValid ? "Transaction Validated" : "Validation Failed"}
              </span>
            </div>
            <p className={`mt-2 text-sm ${validationResult.isValid ? "text-green-700" : "text-red-700"}`}>
              {validationResult.message}
            </p>
            {validationResult.transactionDetails && (
              <div className="mt-3 text-xs space-y-1 text-green-700">
                <p>
                  <strong>Amount:</strong> {validationResult.transactionDetails.amount}
                </p>
                <p>
                  <strong>From:</strong> {validationResult.transactionDetails.fromAddress}
                </p>
                <p>
                  <strong>To:</strong> {validationResult.transactionDetails.toAddress}
                </p>
                <p>
                  <strong>Confirmations:</strong> {validationResult.transactionDetails.confirmations}
                </p>
                <p>
                  <strong>UTXO:</strong> {validationResult.transactionDetails.utxo}
                </p>
              </div>
            )}
          </Card>
        )}

        <div className="text-xs text-muted-foreground space-y-1">
          <p>
            <strong>Process:</strong>
          </p>
          <p>1. Send {selectedVault.nativeChainName} to the address above</p>
          <p>2. Enter the transaction hash and click "Validate Transaction"</p>
          <p>3. Once validated, click "Submit Mint Request"</p>
          <p>4. Wait for admin approval</p>
          <p>5. t-{selectedVault.id.toUpperCase()} tokens will be minted to your EVM address</p>
        </div>
      </form>
    </div>
  )
}
