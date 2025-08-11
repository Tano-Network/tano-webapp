"use client"

import { useState } from "react"
import { QRCodeSVG } from "qrcode.react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { useToast } from "@/hooks/use-toast"
import { Copy, ExternalLink, Smartphone, Wallet, QrCode, CheckCircle, AlertTriangle, Info } from "lucide-react"

interface EnhancedQRCodeProps {
  address: string
  chainName: string
  explorerUrl?: string
  amount?: string
  isAdminAssisted?: boolean
}

export function EnhancedQRCode({
  address,
  chainName,
  explorerUrl,
  amount,
  isAdminAssisted = false,
}: EnhancedQRCodeProps) {
  const { toast } = useToast()
  const [qrSize, setQrSize] = useState(200)

  const copyAddress = () => {
    navigator.clipboard.writeText(address)
    toast({
      title: "Address Copied",
      description: "Deposit address copied to clipboard.",
    })
  }

  const openExplorer = () => {
    if (explorerUrl) {
      window.open(explorerUrl, "_blank")
    }
  }

  return (
    <div className="space-y-4">
      {isAdminAssisted && (
        <Alert className="border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-950">
          <Info className="h-4 w-4 text-blue-600" />
          <AlertDescription className="text-blue-800 dark:text-blue-200">
            <strong>Step 3: Send Token to Vault Address</strong>
            <br />
            Use the QR code below or copy the address to send your {chainName} tokens.
          </AlertDescription>
        </Alert>
      )}

      <Card className="border-2 border-dashed border-primary/20 bg-gradient-to-br from-blue-50/50 to-purple-50/50 dark:from-blue-950/20 dark:to-purple-950/20">
        <CardHeader className="text-center pb-4">
          <div className="flex items-center justify-center gap-2 mb-2">
            <QrCode className="h-5 w-5 text-primary" />
            <CardTitle className="text-xl">Send {chainName} Here</CardTitle>
          </div>
          <CardDescription className="text-base">
            Scan the QR code or copy the address below to send your tokens
          </CardDescription>
          {amount && (
            <Badge variant="secondary" className="mx-auto w-fit">
              Amount: {amount} {chainName}
            </Badge>
          )}
        </CardHeader>

        <CardContent className="space-y-6">
          {/* QR Code Display */}
          <div className="flex flex-col items-center space-y-4">
            <div className="relative">
              <div className="p-4 bg-white rounded-xl shadow-lg border-2 border-gray-100">
                <QRCodeSVG
                  value={address}
                  size={qrSize}
                  level="H"
                  includeMargin={true}
                  bgColor="#ffffff"
                  fgColor="#000000"
                />
              </div>
              <div className="absolute -top-2 -right-2">
                <Badge className="bg-green-100 text-green-800 border-green-200">
                  <CheckCircle className="h-3 w-3 mr-1" />
                  Ready to Scan
                </Badge>
              </div>
            </div>

            {/* QR Size Controls */}
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setQrSize(Math.max(150, qrSize - 25))}
                disabled={qrSize <= 150}
              >
                Smaller
              </Button>
              <span className="text-sm text-muted-foreground px-2">{qrSize}px</span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setQrSize(Math.min(300, qrSize + 25))}
                disabled={qrSize >= 300}
              >
                Larger
              </Button>
            </div>
          </div>

          {/* Address Display */}
          <div className="space-y-3">
            <div className="text-center">
              <p className="text-sm font-medium text-muted-foreground mb-2">Deposit Address:</p>
              <div className="bg-card border rounded-lg p-3">
                <p className="font-mono text-sm break-all select-all">{address}</p>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-2">
              <Button onClick={copyAddress} className="flex-1 gap-2">
                <Copy className="h-4 w-4" />
                Copy Address
              </Button>
              {explorerUrl && (
                <Button variant="outline" onClick={openExplorer} className="flex-1 gap-2 bg-transparent">
                  <ExternalLink className="h-4 w-4" />
                  View Explorer
                </Button>
              )}
            </div>
          </div>

          {/* Instructions */}
          <div className="space-y-3">
            <Alert className="border-orange-200 bg-orange-50 dark:border-orange-800 dark:bg-orange-950">
              <AlertTriangle className="h-4 w-4 text-orange-600" />
              <AlertDescription className="text-orange-800 dark:text-orange-200">
                <div className="space-y-2">
                  <p className="font-medium">How to send tokens:</p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                    <div className="flex items-start gap-2">
                      <Smartphone className="h-4 w-4 mt-0.5 flex-shrink-0" />
                      <div>
                        <p className="font-medium">Mobile Wallet:</p>
                        <p>Open your wallet app and scan the QR code</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-2">
                      <Wallet className="h-4 w-4 mt-0.5 flex-shrink-0" />
                      <div>
                        <p className="font-medium">Desktop Wallet:</p>
                        <p>Copy the address and paste it in your wallet</p>
                      </div>
                    </div>
                  </div>
                </div>
              </AlertDescription>
            </Alert>

            <Alert>
              <Info className="h-4 w-4" />
              <AlertDescription>
                <strong>Important:</strong> Only send {chainName} tokens to this address. Sending other tokens may
                result in permanent loss.
              </AlertDescription>
            </Alert>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
