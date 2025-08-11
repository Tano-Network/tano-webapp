"use client"

import { useMemo, useState } from "react"
import type { MintFormData } from "@/app/(app)/mint/page"
import { QRCodeSVG } from "qrcode.react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useToast } from "@/hooks/use-toast"
import { Copy, ExternalLink, Loader2, CheckCircle, XCircle } from 'lucide-react'
import { VAULTS } from "@/lib/constants"

type DogeProofResponse = {
totalDoge: number
senderAddress: string
vkey: string
publicValues: string
proof: string
}

type ValidateResponse = {
isValid?: boolean
message?: string
transactionDetails?: {
  amount?: string
  fromAddress?: string
  toAddress?: string
  confirmations?: number
  utxo?: string
}
error?: string
[key: string]: any
}

interface Props {
formData: MintFormData
onBack: () => void
onComplete: () => void
}

export function MintStepTwo({ formData, onBack, onComplete }: Props) {
const { toast } = useToast()
const vault = useMemo(() => VAULTS.find((v) => v.id === formData.vaultId), [formData.vaultId])

const isDogecoinVault =
  (vault?.id?.toLowerCase?.() || "").includes("doge") ||
  (vault?.nativeChainName?.toLowerCase?.() || "").includes("doge")

const [txHash, setTxHash] = useState("")
const [isValidating, setIsValidating] = useState(false)
const [isSubmitting, setIsSubmitting] = useState(false)
const [validationResult, setValidationResult] = useState<ValidateResponse | null>(null)
const [dogeProof, setDogeProof] = useState<DogeProofResponse | null>(null)
const [detectedSender, setDetectedSender] = useState<string>("")
const [amount, setAmount] = useState<string>("")

const canSubmit =
  !!vault && !!txHash && !!detectedSender && !!amount && !isValidating && !isSubmitting

if (!vault) {
  return (
    <Card>
      <CardContent className="p-6">
        <p className="text-red-600">Vault not found. Go back and select a vault.</p>
        <div className="mt-4">
          <Button variant="outline" onClick={onBack}>
            Back
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

async function validateHash() {
  if (!txHash) {
    toast({
      title: "Missing transaction hash",
      description: "Enter a transaction hash first.",
      variant: "destructive",
    })
    return
  }

  setIsValidating(true)
  setValidationResult(null)
  setDetectedSender("")
  setDogeProof(null)
  setAmount("")

  try {
    if (isDogecoinVault) {
      // Prove and derive for Dogecoin
      const res = await fetch("/api/prove-doge-transaction", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ txHash, proofSystem: "plonk" }),
      })
      const data = (await res.json()) as DogeProofResponse & { error?: string }

      if (!res.ok) {
        throw new Error(data?.error || "Failed to generate Dogecoin proof")
      }

      setDogeProof(data)
      setDetectedSender(data.senderAddress || "")
      const derivedAmt = typeof data.totalDoge === "number" ? (data.totalDoge / 1e8).toString() : ""
      setAmount(derivedAmt)

      setValidationResult({
        isValid: true,
        message: "Dogecoin transaction validated via proof service.",
        transactionDetails: {
          amount: derivedAmt,
          fromAddress: data.senderAddress,
        },
      })

      toast({
        title: "Validated",
        description: "Dogecoin transaction proven and sender detected.",
      })
    } else {
      // Generic validation for non-DOGE vaults
      const res = await fetch("/api/validate-transaction", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          transactionHash: txHash,
          vaultId: vault?.id,
          vaultChain: vault?.nativeChainName,
          depositAddress: vault?.nativeAddress,
        }),
      })
      const data = (await res.json()) as ValidateResponse

      if (!res.ok || data?.isValid === false) {
        throw new Error(data?.message || data?.error || "Validation failed")
      }

      setValidationResult(data)
      const sender = data.transactionDetails?.fromAddress || ""
      setDetectedSender(sender)
      if (data.transactionDetails?.amount) setAmount(data.transactionDetails.amount)

      toast({
        title: "Validated",
        description: "Transaction validated and sender detected.",
      })
    }
  } catch (err: any) {
    toast({
      title: "Validation Error",
      description: err?.message || "Failed to validate transaction.",
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

    const proofPayload = {
      validator: validationResult?.transactionDetails || null,
      dogeProof: dogeProof || null,
    }

    const response = await fetch("/api/mint", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        evmAddress: formData.evmAddress,
        evmChain: formData.evmChain,
        evmChainId: formData.evmChainId,
        vaultId: formData.vaultId,
        vaultChain: formData.vaultChain,
        userVaultChainAddress: detectedSender, // derived from tx/proof
        transactionHash: txHash,
        amount,
        utxo: validationResult?.transactionDetails?.utxo || txHash,
        proof: JSON.stringify(proofPayload),
        requestType: "retail",
      }),
    })

    const data = await response.json()
    if (!response.ok) {
      throw new Error(data?.message || data?.error || "Failed to create mint request")
    }

    toast({
      title: "Mint Request Submitted",
      description: "Your mint request has been recorded and is pending approval.",
    })
    onComplete()
    // Reset local state
    setTxHash("")
    setValidationResult(null)
    setDetectedSender("")
    setDogeProof(null)
    setAmount("")
  } catch (err: any) {
    toast({
      title: "Submission Error",
      description: err?.message || "Failed to submit mint request.",
      variant: "destructive",
    })
  } finally {
    setIsSubmitting(false)
  }
}

return (
  <div className="space-y-6">
    {/* Deposit card with QR, copy, explorer */}
    <Card className="border-dashed border-2 p-4 text-center space-y-4">
      <CardHeader className="p-0">
        <CardTitle className="text-xl">Deposit to {vault.nativeChainName}</CardTitle>
        <CardDescription>
          Send your {vault.nativeChainName} to the address below, then provide the transaction hash.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col items-center justify-center p-0">
        <div className="p-2 bg-white rounded-lg">
          <QRCodeSVG value={vault.nativeAddress} size={180} level="H" />
        </div>
        <p className="mt-4 text-sm font-mono break-all bg-card p-2 rounded">
          {vault.nativeAddress}
        </p>
        <div className="flex gap-2 mt-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              navigator.clipboard.writeText(vault.nativeAddress)
              toast({ title: "Address Copied", description: "Deposit address copied to clipboard." })
            }}
          >
            <Copy className="h-4 w-4 mr-2" />
            Copy Address
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => window.open(vault.explorerUrl, "_blank")}
          >
            <ExternalLink className="h-4 w-4 mr-2" />
            Explorer
          </Button>
        </div>
      </CardContent>
      <CardFooter className="p-0">
        <p className="text-xs text-muted-foreground">
          Only send {vault.nativeChainName} on the correct network to this address.
        </p>
      </CardFooter>
    </Card>

    {/* Hash input and actions */}
    <Card>
      <CardHeader>
        <CardTitle>Transaction</CardTitle>
        <CardDescription>We will derive the sender address from your transaction.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="txHash">Transaction Hash</Label>
          <Input
            id="txHash"
            placeholder={`Paste ${vault.nativeChainName} transaction hash`}
            value={txHash}
            onChange={(e) => setTxHash(e.target.value.trim())}
            disabled={isValidating || isSubmitting}
          />
        </div>

        <div className="flex gap-2">
          <Button variant="outline" onClick={onBack} disabled={isValidating || isSubmitting}>
            Back
          </Button>
          <Button onClick={validateHash} disabled={!txHash || isValidating || isSubmitting}>
            {isValidating && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            Validate
          </Button>
          <Button onClick={submitMintRequest} disabled={!canSubmit}>
            {isSubmitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            Submit Mint Request
          </Button>
        </div>
        {isValidating && (
          <div
            role="status"
            aria-live="polite"
            className="mt-2 flex items-center text-sm text-muted-foreground"
          >
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            {"Please wait. validating tx takes some time."}
          </div>
        )}
      </CardContent>
    </Card>

    {/* Validation result */}
    {validationResult && (
      <Card
        className={`p-4 ${
          validationResult.isValid ? "border-green-200 bg-green-50" : "border-red-200 bg-red-50"
        }`}
      >
        <div className="flex items-center gap-2">
          {validationResult.isValid ? (
            <CheckCircle className="h-5 w-5 text-green-600" />
          ) : (
            <XCircle className="h-5 w-5 text-red-600" />
          )}
          <span
            className={`font-medium ${
              validationResult.isValid ? "text-green-800" : "text-red-800"
            }`}
          >
            {validationResult.isValid ? "Transaction Validated" : "Validation Failed"}
          </span>
        </div>
        <p
          className={`mt-2 text-sm ${
            validationResult.isValid ? "text-green-700" : "text-red-700"
          }`}
        >
          {validationResult.message}
        </p>
        {validationResult.transactionDetails && (
          <div className="mt-3 text-xs space-y-1">
            {validationResult.transactionDetails.amount && (
              <p>
                <strong>Amount:</strong> {validationResult.transactionDetails.amount}
              </p>
            )}
            {validationResult.transactionDetails.fromAddress && (
              <p className="break-all">
                <strong>From:</strong> {validationResult.transactionDetails.fromAddress}
              </p>
            )}
            {validationResult.transactionDetails.toAddress && (
              <p className="break-all">
                <strong>To:</strong> {validationResult.transactionDetails.toAddress}
              </p>
            )}
            {typeof validationResult.transactionDetails.confirmations === "number" && (
              <p>
                <strong>Confirmations:</strong>{" "}
                {validationResult.transactionDetails.confirmations}
              </p>
            )}
            {validationResult.transactionDetails.utxo && (
              <p className="break-all">
                <strong>UTXO:</strong> {validationResult.transactionDetails.utxo}
              </p>
            )}
          </div>
        )}
      </Card>
    )}

    {/* Detected sender and DOGE proof details */}
    {detectedSender && (
      <Card className="p-4">
        <CardTitle className="text-base">Detected Sender Address</CardTitle>
        <CardContent className="p-0 mt-2 flex items-center justify-between gap-3">
          <div className="text-sm font-mono break-all">{detectedSender}</div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => {
              navigator.clipboard.writeText(detectedSender)
              toast({ title: "Copied", description: "Sender address copied to clipboard." })
            }}
          >
            <Copy className="h-4 w-4 mr-2" />
            Copy
          </Button>
        </CardContent>
      </Card>
    )}

    {dogeProof && (
      <Card className="p-4">
        <CardTitle className="text-base">Dogecoin Proof</CardTitle>
        <CardContent className="p-0 mt-2 space-y-2 text-sm">
          <div>
            <strong>Total:</strong>{" "}
            {typeof dogeProof.totalDoge === "number" ? dogeProof.totalDoge / 1e8 : "-"} DOGE
          </div>
          <div className="break-all">
            <strong>vkey:</strong> {dogeProof.vkey}
          </div>
          <div className="break-all">
            <strong>publicValues:</strong> {dogeProof.publicValues}
          </div>
          <div className="break-all">
            <strong>proof:</strong> {dogeProof.proof}
          </div>
          <div className="pt-2 flex flex-wrap gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => navigator.clipboard.writeText(dogeProof.vkey)}
            >
              <Copy className="h-4 w-4 mr-2" />
              Copy vkey
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => navigator.clipboard.writeText(dogeProof.publicValues)}
            >
              <Copy className="h-4 w-4 mr-2" />
              Copy publicValues
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => navigator.clipboard.writeText(dogeProof.proof)}
            >
              <Copy className="h-4 w-4 mr-2" />
              Copy proof
            </Button>
          </div>
        </CardContent>
      </Card>
    )}
  </div>
)
}
