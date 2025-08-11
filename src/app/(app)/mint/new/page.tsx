"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ArrowLeft } from 'lucide-react'
import Link from "next/link"
import { MintStepOne } from "@/components/mint-step-one"
import { MintStepTwo } from "@/components/mint-step-two"

export default function NewMintRequest() {
const router = useRouter()
const [currentStep, setCurrentStep] = useState(1)
const [stepOneData, setStepOneData] = useState<any>(null)

const handleStepOneComplete = (data: any) => {
  setStepOneData(data)
  setCurrentStep(2)
}

const handleStepTwoComplete = () => {
  // Redirect to dashboard after successful submission
  router.push("/mint")
}

const handleBack = () => {
  if (currentStep === 2) {
    setCurrentStep(1)
  } else {
    router.push("/mint")
  }
}

return (
  <div className="container mx-auto p-6 max-w-4xl">
    {/* Header */}
    <div className="flex items-center gap-4 mb-6">
      <Button onClick={handleBack} variant="outline" size="sm" className="gap-2 bg-transparent">
        <ArrowLeft className="h-4 w-4" />
        {currentStep === 1 ? "Back to Dashboard" : "Previous Step"}
      </Button>
      <div>
        <h1 className="text-3xl font-bold">Submit Mint Request</h1>
        <p className="text-muted-foreground">Create a new mint request for your vault deposit</p>
      </div>
    </div>

    {/* Progress Indicator */}
    <div className="flex items-center justify-center mb-8">
      <div className="flex items-center space-x-4">
        <div
          className={`flex items-center justify-center w-8 h-8 rounded-full ${
            currentStep >= 1 ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
          }`}
        >
          1
        </div>
        <div className={`h-1 w-16 ${currentStep >= 2 ? "bg-primary" : "bg-muted"}`} />
        <div
          className={`flex items-center justify-center w-8 h-8 rounded-full ${
            currentStep >= 2 ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
          }`}
        >
          2
        </div>
      </div>
    </div>

    {/* Step Content */}
    <Card>
      <CardHeader>
        <CardTitle>
          {currentStep === 1 ? "Step 1: Vault Selection & Transaction" : "Step 2: Request Submission"}
        </CardTitle>
        <CardDescription>
          {currentStep === 1
            ? "Select your vault and provide transaction details"
            : "Review and submit your mint request"}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {currentStep === 1 ? (
          <MintStepOne onComplete={handleStepOneComplete} />
        ) : (
          <MintStepTwo
            formData={stepOneData}
            onComplete={handleStepTwoComplete}
            onBack={() => setCurrentStep(1)}
          />
        )}
      </CardContent>
    </Card>

    {/* Navigation Footer */}
    <div className="flex justify-between items-center mt-6">
      <Link href="/mint">
        <Button variant="outline" className="gap-2 bg-transparent">
          <ArrowLeft className="h-4 w-4" />
          Back to Dashboard
        </Button>
      </Link>
      <div className="text-sm text-muted-foreground">Step {currentStep} of 2</div>
    </div>
  </div>
)
}
