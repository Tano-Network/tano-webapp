"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { MintStepOne } from "@/components/mint-step-one"
import { MintStepTwo } from "@/components/mint-step-two"
import { Button } from "@/components/ui/button"
import { ArrowLeft } from "lucide-react"
import Link from "next/link"

export interface MintFormData {
  evmAddress: string
  evmChain: string
  evmChainId: number
  vaultId: string
  vaultName: string
  vaultChain: string
  userVaultChainAddress: string
}

export default function NewMintRequestPage() {
  const [currentStep, setCurrentStep] = useState(1)
  const [formData, setFormData] = useState<MintFormData | null>(null)

  const handleStepOneComplete = (data: MintFormData) => {
    setFormData(data)
    setCurrentStep(2)
  }

  const handleBackToStepOne = () => {
    setCurrentStep(1)
  }

  const handleMintComplete = () => {
    // Reset form and go back to step 1
    setCurrentStep(1)
    setFormData(null)
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="mb-6">
          <Link href="/mint">
            <Button variant="ghost" className="flex items-center gap-2">
              <ArrowLeft className="h-4 w-4" />
              Back to Dashboard
            </Button>
          </Link>
        </div>

        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold">New Mint Request (Retail)</h1>
          <p className="text-muted-foreground mt-2">
            Deposit native currency to mint corresponding t-assets on the EVM chain
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-xl">Create Mint Request</CardTitle>
            <CardDescription>
              Step {currentStep} of 2: {currentStep === 1 ? "Basic Information" : "Transaction Verification"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {currentStep === 1 ? (
              <MintStepOne onComplete={handleStepOneComplete} />
            ) : (
              <MintStepTwo formData={formData!} onBack={handleBackToStepOne} onComplete={handleMintComplete} />
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
