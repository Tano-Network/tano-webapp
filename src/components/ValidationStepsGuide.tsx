"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { CheckCircle, Clock, AlertTriangle, Info, Eye, EyeOff, ExternalLink, Loader2, Copy } from "lucide-react"

interface ValidationStepGuideProps {
  chainName: string
  isValidating: boolean
  validationResult: any
  txHash: string
  explorerUrl?: string
}

export function ValidationStepGuide({
  chainName,
  isValidating,
  validationResult,
  txHash,
  explorerUrl,
}: ValidationStepGuideProps) {
  const [showTechnicalDetails, setShowTechnicalDetails] = useState(false)

  const getValidationSteps = () => [
    {
      step: 1,
      title: "Duplicate Transaction Check",
      description: "Checking if this transaction hash has been used before",
      status: isValidating ? "in-progress" : validationResult ? "completed" : "pending",
      details: "We verify that this transaction hash hasn't been used for a previous mint request.",
    },
    {
      step: 2,
      title: "Blockchain Transaction Verification",
      description: `Verifying transaction exists on ${chainName} blockchain`,
      status: isValidating ? "in-progress" : validationResult ? "completed" : "pending",
      details: "We confirm the transaction exists and retrieve transaction details from the blockchain.",
    },
    {
      step: 3,
      title: "Cryptographic Proof Generation",
      description: "Generating zero-knowledge proof using PLONK system",
      status: isValidating ? "in-progress" : validationResult ? "completed" : "pending",
      details: `We generate a cryptographic proof of your ${chainName} transaction using the PLONK proving system.`,
    },
    {
      step: 4,
      title: "Proof Verification & Finalization",
      description: "Verifying the generated proof and extracting transaction data",
      status: isValidating ? "in-progress" : validationResult ? "completed" : "pending",
      details: "We verify the proof is valid and extract sender address, amount, and verification key.",
    },
  ]

  const getStepIcon = (status: string) => {
    switch (status) {
      case "completed":
        return <CheckCircle className="h-4 w-4 text-green-600" />
      case "in-progress":
        return <Loader2 className="h-4 w-4 text-blue-600 animate-spin" />
      default:
        return <Clock className="h-4 w-4 text-gray-400" />
    }
  }

  const getStepBadge = (status: string) => {
    switch (status) {
      case "completed":
        return "bg-green-100 text-green-800 border-green-200"
      case "in-progress":
        return "bg-blue-100 text-blue-800 border-blue-200"
      default:
        return "bg-gray-100 text-gray-600 border-gray-200"
    }
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
  }

  const formatHexString = (hex: string, maxLength = 20) => {
    if (!hex) return ""
    if (hex.length <= maxLength) return hex
    return `${hex.slice(0, maxLength)}...${hex.slice(-8)}`
  }

  return (
    <div className="space-y-4">
      <Card className="border-blue-200 bg-blue-50/50 dark:border-blue-800 dark:bg-blue-950/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Info className="h-5 w-5 text-blue-600" />
            Step 4: Admin-Assisted Validation Process
          </CardTitle>
          <CardDescription>
            We're validating your {chainName} transaction through multiple security checks
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Validation Steps */}
          <div className="space-y-3">
            {getValidationSteps().map((step) => (
              <div key={step.step} className="flex items-start gap-3 p-3 rounded-lg border bg-card">
                <div className="flex-shrink-0 mt-0.5">{getStepIcon(step.status)}</div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h4 className="font-medium text-sm">{step.title}</h4>
                    <Badge className={`${getStepBadge(step.status)} text-xs`}>
                      {step.status === "in-progress"
                        ? "Checking..."
                        : step.status === "completed"
                          ? "Complete"
                          : "Pending"}
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground mb-1">{step.description}</p>
                  {showTechnicalDetails && <p className="text-xs text-muted-foreground italic">{step.details}</p>}
                </div>
              </div>
            ))}
          </div>

          {/* Proof Details Display */}
          {validationResult && (validationResult.totalDoge || validationResult.proof) && (
            <div className="mt-4 p-4 border rounded-lg bg-green-50 dark:bg-green-950/20 border-green-200 dark:border-green-800">
              <h4 className="font-medium text-sm mb-3 text-green-800 dark:text-green-200">Proof Details</h4>
              <div className="space-y-2 text-xs">
                {validationResult.totalDoge && (
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">DOGE Amount:</span>
                    <span className="font-mono">{(validationResult.totalDoge / 100000000).toFixed(8)} DOGE</span>
                  </div>
                )}
                {validationResult.senderAddress && (
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">Sender Address:</span>
                    <div className="flex items-center gap-1">
                      <span className="font-mono">{formatHexString(validationResult.senderAddress, 16)}</span>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => copyToClipboard(validationResult.senderAddress)}
                        className="h-4 w-4 p-0"
                      >
                        <Copy className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                )}
                {validationResult.vkey && (
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">Verification Key:</span>
                    <div className="flex items-center gap-1">
                      <span className="font-mono">{formatHexString(validationResult.vkey)}</span>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => copyToClipboard(validationResult.vkey)}
                        className="h-4 w-4 p-0"
                      >
                        <Copy className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                )}
                {validationResult.proof && (
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">Proof Size:</span>
                    <span className="font-mono">{Math.round(validationResult.proof.length / 2)} bytes</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Technical Details Toggle */}
          <div className="flex items-center justify-between pt-2 border-t">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowTechnicalDetails(!showTechnicalDetails)}
              className="text-xs"
            >
              {showTechnicalDetails ? <EyeOff className="h-3 w-3 mr-1" /> : <Eye className="h-3 w-3 mr-1" />}
              {showTechnicalDetails ? "Hide" : "Show"} Technical Details
            </Button>

            {txHash && explorerUrl && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => window.open(`${explorerUrl}/tx/${txHash}`, "_blank")}
                className="text-xs"
              >
                <ExternalLink className="h-3 w-3 mr-1" />
                View on Explorer
              </Button>
            )}
          </div>

          {/* Current Status */}
          {isValidating && (
            <Alert className="border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-950">
              <Loader2 className="h-4 w-4 animate-spin text-blue-600" />
              <AlertDescription className="text-blue-800 dark:text-blue-200">
                <strong>Generating Proof:</strong> Please wait while we generate a cryptographic proof of your
                transaction. This process may take 1-3 minutes.
              </AlertDescription>
            </Alert>
          )}

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
                    ? "Proof Generated Successfully!"
                    : "Proof Generation Failed"}
                </strong>
                <br />
                {validationResult.error || "Cryptographic proof has been generated for your Dogecoin transaction."}
                {(validationResult.totalDoge || validationResult.proof) && (
                  <span className="block mt-1 text-sm">
                    Your {chainName} transaction proof has been verified and you can now proceed to submit your mint
                    request.
                  </span>
                )}
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
