"use client"

import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Loader2, Shield, Clock, Zap } from "lucide-react"
import { Progress } from "@/components/ui/progress"
import { useEffect, useState } from "react"

interface ValidationLoadingModalProps {
  isOpen: boolean
  onClose?: () => void
}

export function ValidationLoadingModal({ isOpen, onClose }: ValidationLoadingModalProps) {
  const [progress, setProgress] = useState(0)
  const [currentStep, setCurrentStep] = useState(0)

  const steps = [
    { icon: Shield, label: "Verifying transaction on blockchain", duration: 3000 },
    { icon: Zap, label: "Generating cryptographic proof", duration: 4000 },
    { icon: Clock, label: "Finalizing validation", duration: 2000 },
  ]

  useEffect(() => {
    if (!isOpen) {
      setProgress(0)
      setCurrentStep(0)
      return
    }

    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 90) return prev // Stop at 90% until actual completion
        return prev + 2
      })
    }, 100)

    const stepInterval = setInterval(() => {
      setCurrentStep((prev) => (prev + 1) % steps.length)
    }, 3000)

    return () => {
      clearInterval(interval)
      clearInterval(stepInterval)
    }
  }, [isOpen])

  const CurrentIcon = steps[currentStep]?.icon || Shield

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-center">
            <Loader2 className="h-5 w-5 animate-spin text-blue-600" />
            Validating Transaction
          </DialogTitle>
          <DialogDescription className="text-center">
            Please wait while we validate your Dogecoin transaction. This process may take 1-3 minutes.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Progress Bar */}
          <div className="space-y-2">
            <Progress value={progress} className="h-2" />
            <p className="text-sm text-muted-foreground text-center">{progress}% complete</p>
          </div>

          {/* Current Step */}
          <div className="flex items-center gap-3 p-4 bg-blue-50 dark:bg-blue-950/30 rounded-lg">
            <CurrentIcon className="h-5 w-5 text-blue-600 animate-pulse" />
            <span className="text-sm font-medium">{steps[currentStep]?.label}</span>
          </div>

          {/* Info Message */}
          <div className="text-center space-y-2">
            <p className="text-sm text-muted-foreground">
              We're generating a cryptographic proof of your Dogecoin transaction using advanced zero-knowledge
              technology.
            </p>
            <p className="text-xs text-muted-foreground">Please keep this window open and do not refresh the page.</p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
