"use client"

import { useState } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { CheckCircle, AlertTriangle, Clock, Send, Copy } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface SubmitConfirmationDialogProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: () => void
  isSubmitting: boolean
  formData: {
    vaultName: string
    chainName: string
    amount: string
    txHash: string
    senderAddress: string
    vaultAddress: string
  }
}

export function SubmitConfirmationDialog({
  isOpen,
  onClose,
  onConfirm,
  isSubmitting,
  formData,
}: SubmitConfirmationDialogProps) {
  const { toast } = useToast()
  const [hasConfirmed, setHasConfirmed] = useState(false)

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text)
    toast({
      title: "Copied",
      description: `${label} copied to clipboard.`,
    })
  }

  const handleConfirm = () => {
    setHasConfirmed(true)
    onConfirm()
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Send className="h-5 w-5 text-blue-600" />
            Step 6: Confirm Mint Request Submission
          </DialogTitle>
          <DialogDescription>
            Please review your mint request details before final submission to the admin approval queue.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <Alert className="border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-950">
            <AlertTriangle className="h-4 w-4 text-blue-600" />
            <AlertDescription className="text-blue-800 dark:text-blue-200">
              <strong>Admin-Assisted Process:</strong> After submission, an admin will review and approve your mint
              request. You will receive your tokens once approved.
            </AlertDescription>
          </Alert>

          <div className="space-y-3">
            <h4 className="font-semibold text-sm">Request Summary:</h4>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-muted/50 rounded-lg">
              <div className="space-y-2">
                <div>
                  <label className="text-xs font-medium text-muted-foreground">Vault</label>
                  <p className="text-sm font-mono">{formData.vaultName}</p>
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground">Chain</label>
                  <p className="text-sm">{formData.chainName}</p>
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground">Amount</label>
                  <p className="text-sm font-semibold">
                    {formData.amount} {formData.chainName}
                  </p>
                </div>
              </div>

              <div className="space-y-2">
                <div>
                  <label className="text-xs font-medium text-muted-foreground">Transaction Hash</label>
                  <div className="flex items-center gap-2">
                    <p className="text-xs font-mono break-all">{formData.txHash.slice(0, 20)}...</p>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => copyToClipboard(formData.txHash, "Transaction hash")}
                    >
                      <Copy className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground">Sender Address</label>
                  <div className="flex items-center gap-2">
                    <p className="text-xs font-mono break-all">{formData.senderAddress.slice(0, 20)}...</p>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => copyToClipboard(formData.senderAddress, "Sender address")}
                    >
                      <Copy className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground">Vault Address</label>
                  <div className="flex items-center gap-2">
                    <p className="text-xs font-mono break-all">{formData.vaultAddress.slice(0, 20)}...</p>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => copyToClipboard(formData.vaultAddress, "Vault address")}
                    >
                      <Copy className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <Separator />

          <div className="space-y-3">
            <h4 className="font-semibold text-sm">What happens next:</h4>
            <div className="space-y-2">
              <div className="flex items-start gap-3">
                <Badge className="bg-blue-100 text-blue-800 border-blue-200 mt-0.5">1</Badge>
                <div>
                  <p className="text-sm font-medium">Request Submitted</p>
                  <p className="text-xs text-muted-foreground">
                    Your mint request is added to the admin approval queue
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Badge className="bg-orange-100 text-orange-800 border-orange-200 mt-0.5">2</Badge>
                <div>
                  <p className="text-sm font-medium">Admin Review</p>
                  <p className="text-xs text-muted-foreground">
                    An admin will verify your transaction and approve the mint
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Badge className="bg-green-100 text-green-800 border-green-200 mt-0.5">3</Badge>
                <div>
                  <p className="text-sm font-medium">Tokens Minted</p>
                  <p className="text-xs text-muted-foreground">
                    You'll receive your tokens in your connected EVM wallet
                  </p>
                </div>
              </div>
            </div>
          </div>

          <Alert>
            <Clock className="h-4 w-4" />
            <AlertDescription>
              <strong>Processing Time:</strong> Admin approval typically takes 1-24 hours during business hours. You can
              track your request status in the mint dashboard.
            </AlertDescription>
          </Alert>
        </div>

        <DialogFooter className="flex flex-col sm:flex-row gap-2">
          <Button variant="outline" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button onClick={handleConfirm} disabled={isSubmitting} className="bg-green-600 hover:bg-green-700">
            {isSubmitting ? (
              <>
                <Clock className="h-4 w-4 mr-2 animate-spin" />
                Submitting Request...
              </>
            ) : (
              <>
                <CheckCircle className="h-4 w-4 mr-2" />
                Confirm & Submit Request
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
