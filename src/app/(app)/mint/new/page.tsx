"use client"
import { useRouter } from "next/navigation"
import { Suspense } from "react"
import { Button } from "@/components/ui/button"
import { BackButton } from "@/components/BackButton"
import Link from "next/link"
import { AdminAssistedMintWizard } from "@/components/AdminAssistedMintWizard"
import { Wallet, FileText, QrCode, Clock, CheckCircle, Send } from "lucide-react"
 
function MintWizardLoading() {
  return (
    <div className="flex items-center justify-center py-12">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      <span className="ml-2 text-muted-foreground">Loading mint wizard...</span>
    </div>
  )
}

function MintWizardWrapper({ onComplete }: { onComplete: () => void }) {
  return (
    <Suspense fallback={<MintWizardLoading />}>
      <AdminAssistedMintWizard onComplete={onComplete} />
    </Suspense>
  )
}

export default function NewMintRequest() {
  const router = useRouter()

  const handleComplete = () => {
    router.push("/mint")
  }

  const handleBack = () => {
    router.push("/mint")
  }

  const steps = [
    { number: 1, title: "Connect Wallet", icon: Wallet, description: "Connect your EVM wallet" },
    { number: 2, title: "Fill Form", icon: FileText, description: "Select vault and fill details" },
    { number: 3, title: "Send Token", icon: QrCode, description: "Send to vault address via QR or copy" },
    { number: 4, title: "Wait & Copy", icon: Clock, description: "Wait for confirmation and copy tx hash" },
    { number: 5, title: "Validate", icon: CheckCircle, description: "Validate transaction details" },

    { number: 6, title: "Submit", icon: Send, description: "Mint" },

  ]

  return (
    <div className="container mx-auto p-6 max-w-5xl">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <BackButton href="/mint">Back to Dashboard</BackButton>
        <div>

          <h1 className="text-3xl font-bold">Retail Mint Request</h1>

          <p className="text-muted-foreground">Follow the 6-step process to submit your retail mint request</p>
        </div>
      </div>

      {/* 6-Step Progress Indicator */}
      <div className="flex items-center justify-center mb-8 overflow-x-auto">
        <div className="flex items-center space-x-2 min-w-max px-4">
          {steps.map((step, index) => (
            <div key={step.number} className="flex items-center">
              <div className="flex flex-col items-center">
                <div className="flex items-center justify-center w-10 h-10 rounded-full bg-muted text-muted-foreground border-2">
                  <step.icon className="h-4 w-4" />
                </div>
                <div className="text-xs mt-1 text-center max-w-16">
                  <div className="font-medium">{step.title}</div>
                </div>
              </div>
              {index < steps.length - 1 && <div className="h-1 w-8 bg-muted mx-2" />}
            </div>
          ))}
        </div>
      </div>

      <MintWizardWrapper onComplete={handleComplete} />

      {/* Navigation Footer */}
      <div className="flex justify-between items-center mt-6">

        <BackButton href="/mint">Back to Dashboard</BackButton>

        <div className="text-sm text-muted-foreground">Retail Mint Flow</div>

      </div>
    </div>
  )
}
