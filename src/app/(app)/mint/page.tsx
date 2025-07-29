"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { MintStepOne } from "@/components/mint-step-one"
import { MintStepTwo } from "@/components/mint-step-two"
import { MintRequestStatus } from "@/components/mint-request-status"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

export interface MintFormData {
  evmAddress: string
  evmChain: string
  evmChainId: number
  vaultId: string
  vaultName: string
  vaultChain: string
  userVaultChainAddress: string
}

export default function MintPage() {
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
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold">Mint (Retail)</h1>
          <p className="text-muted-foreground mt-2">
            Deposit native currency to mint corresponding t-assets on the EVM chain
          </p>
        </div>

        <Tabs defaultValue="mint" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="mint">New Mint Request</TabsTrigger>
            <TabsTrigger value="status">Request Status</TabsTrigger>
          </TabsList>

          <TabsContent value="mint" className="space-y-6">
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
          </TabsContent>

          <TabsContent value="status" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-xl">Mint Request Status</CardTitle>
                <CardDescription>View the status of your mint requests for the connected wallet</CardDescription>
              </CardHeader>
              <CardContent>
                <MintRequestStatus />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
