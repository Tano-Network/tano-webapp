'use client'

import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Loader2, CheckCircle, AlertTriangle } from "lucide-react"
import { Progress } from "@/components/ui/progress"
import { useEffect, useState } from "react"
import { VAULTS } from "../lib/constants"

interface ValidationLoadingModalProps {
  isOpen: boolean
  onClose?: () => void
  vaultId: string
  isValidating: boolean
  validationResult: any
}

export function ValidationLoadingModal({
  isOpen,
  onClose,
  vaultId,
  isValidating,
  validationResult,
}: ValidationLoadingModalProps) {
  const [startTime, setStartTime] = useState<number | null>(null)
  const [elapsedTime, setElapsedTime] = useState(0)

  const vault = VAULTS.find((v) => v.id === vaultId)

  useEffect(() => {
    let timer: NodeJS.Timeout | undefined

    if (isOpen && isValidating) {
      if (!startTime) {
        setStartTime(Date.now())
      }
      timer = setInterval(() => {
        if (startTime) {
          setElapsedTime(Date.now() - startTime)
        }
      }, 1000)
    } else if (!isValidating && startTime) {
      setElapsedTime(Date.now() - startTime)
      setStartTime(null) // Reset for next time
    }

    if (!isOpen) {
      setStartTime(null)
      setElapsedTime(0)
    }

    return () => {
      if (timer) {
        clearInterval(timer)
      }
    }
  }, [isOpen, isValidating, startTime])

  const formatTime = (ms: number) => {
    const minutes = Math.floor(ms / 60000)
    const seconds = ((ms % 60000) / 1000).toFixed(0)
    return `${minutes}m ${seconds}s`
  }

  const hasError = validationResult && validationResult.error

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-center">
            {isValidating ? (
              <Loader2 className="h-5 w-5 animate-spin text-blue-600" />
            ) : hasError ? (
              <AlertTriangle className="h-5 w-5 text-red-600" />
            ) : (
              <CheckCircle className="h-5 w-5 text-green-600" />
            )}
            {isValidating ? "Waiting for Verifier" : hasError ? "Verification Failed" : "Verification Done"}
          </DialogTitle>
          <DialogDescription className="text-center">
            {isValidating
              ? `Please wait till we get a response from the verifier.`
              : hasError
              ? `Validation failed: ${validationResult.error}`
              : `Validation completed in ${formatTime(elapsedTime)}`}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {isValidating ? (
            <div className="space-y-2">
              <Progress value={undefined} className="h-2 w-full animate-pulse" />
              <p className="text-sm text-muted-foreground text-center">Generating cryptographic proof...</p>
            </div>
          ) : (
            <div className="text-center">
              <p className="text-sm text-muted-foreground">
                {hasError
                  ? "There was an issue validating your transaction."
                  : "Your transaction has been successfully validated."}
              </p>
            </div>
          )}

          <div className="text-center space-y-2">
            <p className="text-xs text-muted-foreground">
              {isValidating
                ? "Request sent. Please wait while it is being validated by the server. Do not close this window."
                : hasError
                ? "You can close this window and try again."
                : "Validation done successfully."}
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
