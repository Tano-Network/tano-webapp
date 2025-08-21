"use client"

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
import { CheckCircle, Clock, Bell, ArrowRight, Copy } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface SubmitSuccessDialogProps {
  isOpen: boolean
  onClose: () => void
  onGoToDashboard: () => void
  requestData: {
    requestId: string
    amount: string
    chainName: string
    vaultName: string
    recordedAt: string
  }
}

export function SubmitSuccessDialog({ isOpen, onClose, onGoToDashboard, requestData }: SubmitSuccessDialogProps) {
  const { toast } = useToast()

  const copyRequestId = () => {
    navigator.clipboard.writeText(requestData.requestId)
    toast({
      title: "Copied",
      description: "Request ID copied to clipboard.",
    })
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-green-700">
            <CheckCircle className="h-6 w-6 text-green-600" />
            Mint Request Submitted Successfully!
          </DialogTitle>
          <DialogDescription>
            Your retail mint request has been successfully submitted and is now in the approval queue.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <Alert className="border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-950">
            <CheckCircle className="h-4 w-4 text-green-600" />
            <AlertDescription className="text-green-800 dark:text-green-200">
              <strong>Success!</strong> Your mint request for {requestData.amount} {requestData.chainName} from{" "}
              {requestData.vaultName}
              has been recorded and is pending admin approval.
            </AlertDescription>
          </Alert>

          <div className="space-y-3 p-4 bg-muted/50 rounded-lg">
            <h4 className="font-semibold text-sm">Request Details:</h4>
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Request ID:</span>
                <div className="flex items-center gap-2">
                  <Badge variant="secondary" className="font-mono text-xs">
                    {requestData.requestId.slice(0, 8)}...
                  </Badge>
                  <Button variant="ghost" size="sm" onClick={copyRequestId}>
                    <Copy className="h-3 w-3" />
                  </Button>
                </div>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Amount:</span>
                <span className="text-sm font-semibold">
                  {requestData.amount} {requestData.chainName}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Vault:</span>
                <span className="text-sm">{requestData.vaultName}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Submitted:</span>
                <span className="text-sm">{new Date(requestData.recordedAt).toLocaleString()}</span>
              </div>
            </div>
          </div>

          <Alert className="border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-950">
            <Clock className="h-4 w-4 text-blue-600" />
            <AlertDescription className="text-blue-800 dark:text-blue-200">
              <strong>Next Steps:</strong>
              <ul className="list-disc list-inside mt-2 space-y-1 text-sm">
                <li>An admin will review your transaction within 1-24 hours</li>
                <li>You'll be notified when your request is approved</li>
                <li>Tokens will be minted to your connected EVM wallet</li>
                <li>Track your request status in the mint dashboard</li>
              </ul>
            </AlertDescription>
          </Alert>

          <Alert>
            <Bell className="h-4 w-4" />
            <AlertDescription>
              <strong>Stay Updated:</strong> Check the mint dashboard regularly for status updates on your request. You
              can also bookmark this page to track your mint request progress.
            </AlertDescription>
          </Alert>
        </div>

        <DialogFooter className="flex flex-col sm:flex-row gap-2">
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
          <Button onClick={onGoToDashboard} className="bg-blue-600 hover:bg-blue-700">
            <ArrowRight className="h-4 w-4 mr-2" />
            Go to Mint Dashboard
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
