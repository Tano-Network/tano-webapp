"use client"

import { useState, useEffect } from "react"
import { useAccount } from "wagmi"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Progress } from "@/components/ui/progress"
import { Wallet, FileText, QrCode, Vault, ArrowRight, ArrowLeft, Info, AlertTriangle, Check } from "lucide-react"
import { MintStepOne } from "@/components/mint-step-one"
import { MintStepThree } from "@/components/mint-step-three"
import { MintStepFour } from "@/components/mint-step-four"

interface Props {
  onComplete: () => void
}

interface StepData {
  number: number
  title: string
  icon: any
  description: string
  status: "completed" | "current" | "pending" | "disabled"
  isValid: boolean
  canProceed: boolean
}

export function AdminAssistedMintWizard({ onComplete }: Props) {
  const { isConnected } = useAccount()
  const [currentStep, setCurrentStep] = useState(1)
  const [stepOneData, setStepOneData] = useState<any>(null)
  const [validationData, setValidationData] = useState<any>(null)
  const [completedSteps, setCompletedSteps] = useState<Set<number>>(new Set())

  const [steps, setSteps] = useState<StepData[]>([
    {
      number: 1,
      title: "Connect Wallet",
      icon: Wallet,
      description: "Connect your EVM wallet to begin",
      status: "current",
      isValid: false,
      canProceed: false,
    },
    {
      number: 2,
      title: "Fill Form",
      icon: FileText,
      description: "Select vault and provide details",
      status: "pending",
      isValid: false,
      canProceed: false,
    },
    {
      number: 3,
      title: "Validate Transaction",
      icon: QrCode,
      description: "Send tokens and validate transaction",
      status: "pending",
      isValid: false,
      canProceed: false,
    },
    {
      number: 4,
      title: "Mint Tokens",
      icon: Vault,
      description: "Execute smart contract minting",
      status: "pending",
      isValid: false,
      canProceed: false,
    },
  ])

  useEffect(() => {
    setSteps((prevSteps) =>
      prevSteps.map((step) => {
        switch (step.number) {
          case 1:
            return {
              ...step,
              status: isConnected ? "completed" : currentStep === 1 ? "current" : "pending",
              isValid: isConnected,
              canProceed: isConnected,
            }
          case 2:
            return {
              ...step,
              status: stepOneData ? "completed" : currentStep === 2 ? "current" : isConnected ? "pending" : "disabled",
              isValid: !!stepOneData,
              canProceed: !!stepOneData,
            }
          case 3:
            return {
              ...step,
              status: validationData
                ? "completed"
                : currentStep === 3
                  ? "current"
                  : stepOneData
                    ? "pending"
                    : "disabled",
              isValid: !!validationData,
              canProceed: !!validationData,
            }
          case 4:
            return {
              ...step,
              status: currentStep === 4 ? "current" : validationData ? "pending" : "disabled",
              isValid: completedSteps.has(4),
              canProceed: !!validationData,
            }
          default:
            return step
        }
      }),
    )
  }, [isConnected, stepOneData, validationData, currentStep, completedSteps])

  const handleStepOneComplete = (data: any) => {
    setStepOneData(data)
    setCompletedSteps((prev) => new Set([...prev, 2]))
    setCurrentStep(3)
  }

  const handleValidationComplete = (data: any) => {
    setValidationData(data)
    setCompletedSteps((prev) => new Set([...prev, 3]))
    setCurrentStep(4)
  }

  const handleStepClick = (stepNumber: number) => {
    const targetStep = steps.find((s) => s.number === stepNumber)
    if (targetStep && (targetStep.canProceed || targetStep.status === "completed")) {
      setCurrentStep(stepNumber)
    }
  }

  const getStepStatus = (step: StepData) => {
    switch (step.status) {
      case "completed":
        return "bg-green-100 text-green-800 border-green-200 hover:bg-green-200"
      case "current":
        return "bg-blue-100 text-blue-800 border-blue-200 hover:bg-blue-200"
      case "pending":
        return "bg-gray-100 text-gray-600 border-gray-200 hover:bg-gray-200"
      case "disabled":
        return "bg-gray-50 text-gray-400 border-gray-100 cursor-not-allowed"
      default:
        return "bg-gray-100 text-gray-600 border-gray-200"
    }
  }

  const getProgressPercentage = () => {
    const completedCount = steps.filter((s) => s.status === "completed").length
    return (completedCount / steps.length) * 100
  }

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Wallet className="h-5 w-5" />
                Step 1: Connect Your Wallet
              </CardTitle>
              <CardDescription>Connect your EVM wallet to begin the mint process</CardDescription>
            </CardHeader>
            <CardContent>
              <Alert className="mb-4">
                <Info className="h-4 w-4" />
                <AlertDescription>Connect your wallet to start the zero-knowledge minting process.</AlertDescription>
              </Alert>

              {isConnected ? (
                <div className="text-center py-8">
                  <Check className="h-12 w-12 mx-auto text-green-600 mb-4" />
                  <h3 className="text-lg font-semibold mb-2">Wallet Connected!</h3>
                  <p className="text-muted-foreground mb-4">Your wallet is successfully connected.</p>
                  <Button onClick={() => setCurrentStep(2)}>
                    Continue to Form
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </Button>
                </div>
              ) : (
                <div className="text-center py-8">
                  <Wallet className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <h3 className="text-lg font-semibold mb-2">Connect Your Wallet</h3>
                  <p className="text-muted-foreground mb-4">Please connect your EVM wallet to continue.</p>
                  <p className="text-sm text-muted-foreground">
                    Use the "Connect Wallet" button in the top navigation.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        )

      case 2:
        return (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Step 2: Fill Form Details
              </CardTitle>
              <CardDescription>Select your vault and provide the necessary details</CardDescription>
            </CardHeader>
            <CardContent>
              <MintStepOne onComplete={handleStepOneComplete} />
            </CardContent>
          </Card>
        )

      case 3:
        return stepOneData ? (
          <MintStepThree
            formData={stepOneData}
            onComplete={handleValidationComplete}
            onBack={() => setCurrentStep(2)}
          />
        ) : (
          <div className="text-center py-8">
            <AlertTriangle className="h-12 w-12 mx-auto text-orange-500 mb-4" />
            <h3 className="text-lg font-semibold mb-2">Form Data Missing</h3>
            <p className="text-muted-foreground mb-4">Please go back and complete the form first.</p>
            <Button variant="outline" onClick={() => setCurrentStep(2)}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Form
            </Button>
          </div>
        )

      case 4:
        return stepOneData && validationData ? (
          <MintStepFour
            formData={stepOneData}
            validationData={validationData}
            onBack={() => setCurrentStep(3)}
            onComplete={onComplete}
          />
        ) : (
          <div className="text-center py-8">
            <AlertTriangle className="h-12 w-12 mx-auto text-orange-500 mb-4" />
            <h3 className="text-lg font-semibold mb-2">Validation Required</h3>
            <p className="text-muted-foreground mb-4">Please complete validation first.</p>
            <Button variant="outline" onClick={() => setCurrentStep(3)}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Validation
            </Button>
          </div>
        )

      default:
        return null
    }
  }

  return (
    <div className="space-y-6">
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold">Progress</h3>
          <span className="text-sm text-muted-foreground">{Math.round(getProgressPercentage())}% Complete</span>
        </div>
        <Progress value={getProgressPercentage()} className="h-2" />
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {steps.map((step) => (
          <div key={step.number} className="text-center">
            <Button
              variant="outline"
              className={`${getStepStatus(step)} flex items-center gap-1 w-full justify-center py-3 h-auto flex-col`}
              onClick={() => handleStepClick(step.number)}
              disabled={step.status === "disabled"}
            >
              <div className="flex items-center gap-1">
                {step.status === "completed" ? <Check className="h-3 w-3" /> : <step.icon className="h-3 w-3" />}
                <span className="font-medium">{step.number}</span>
              </div>
              <span className="text-xs">{step.title}</span>
            </Button>
            <p className="text-xs text-muted-foreground mt-1">{step.description}</p>
          </div>
        ))}
      </div>

      {renderStepContent()}

      <div className="text-center text-sm text-muted-foreground">
        <p>
          Completed: {steps.filter((s) => s.status === "completed").length} of {steps.length} steps
        </p>
      </div>
    </div>
  )
}
