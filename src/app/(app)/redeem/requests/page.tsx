"use client"

import { useState, useEffect } from "react"
import { useAccount } from "wagmi"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { useToast } from "@/hooks/use-toast"
import { BackButton } from "@/components/BackButton"
import Link from "next/link"
import { RefreshCw, ExternalLink, Clock, CheckCircle, XCircle } from "lucide-react"

interface RedeemRequest {
  id: string
  evmAddress: string
  evmChain: string
  evmChainId: number
  asset: string
  amount: string
  burnTxHash: string
  nativeRecipientAddress: string
  nativeTransactionId?: string
  createdAt: string
  updatedAt: string
  status: "pending" | "processing" | "completed" | "failed"
}

export default function RedeemRequestsPage() {
  const { address, isConnected } = useAccount()
  const [requests, setRequests] = useState<RedeemRequest[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const { toast } = useToast()

  const fetchRequests = async () => {
    if (!address || !isConnected) return

    try {
      setIsLoading(true)
      const response = await fetch(`/api/redeem?address=${address}`)

      if (!response.ok) {
        throw new Error("Failed to fetch redeem requests")
      }

      const data = await response.json()
      setRequests(data.requests || [])
    } catch (error: any) {
      console.error("Error fetching redeem requests:", error)
      toast({
        title: "Error",
        description: "Failed to load redeem requests. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchRequests()
  }, [address, isConnected])

  const formatAmount = (amount: string) => {
    if (!amount.includes(".")) {
      return `${amount}.00`
    }
    const [intPart, decPart] = amount.split(".")
    if (/^0+$/.test(decPart)) {
      return `${intPart}.00`
    }
    return amount
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending":
        return "bg-yellow-100 text-yellow-800 border-yellow-200"
      case "processing":
        return "bg-blue-100 text-blue-800 border-blue-200"
      case "completed":
        return "bg-green-100 text-green-800 border-green-200"
      case "failed":
        return "bg-red-100 text-red-800 border-red-200"
      default:
        return "bg-gray-100 text-gray-800 border-gray-200"
    }
  }

  const getAssetIcon = (asset: string) => {
    switch (asset.toUpperCase()) {
      case "DOGE":
        return "Ð"
      case "LTC":
        return "Ł"
      case "BCH":
        return "₿"
      case "ADA": // Added for Cardano
        return "₳"
      default:
        return asset.charAt(0)
    }
  }

  const getAssetColor = (asset: string) => {
    switch (asset.toUpperCase()) {
      case "DOGE":
        return "from-yellow-500 to-orange-500"
      case "LTC":
        return "from-gray-400 to-gray-600"
      case "BCH":
        return "from-green-500 to-emerald-600"
      case "ADA": // Added for Cardano
        return "from-blue-600 to-purple-600"
      default:
        return "from-gray-400 to-gray-600"
    }
  }

  const getExplorerUrl = (chain: string, txHash: string) => {
    switch (chain.toLowerCase()) {
      case "sepolia":
        return `https://sepolia.etherscan.io/tx/${txHash}`
      case "ethereum":
        return `https://etherscan.io/tx/${txHash}`
      case "polygon":
        return `https://polygonscan.com/tx/${txHash}`
      default:
        return `https://etherscan.io/tx/${txHash}`
    }
  }

  const getNativeExplorerUrl = (asset: string, txId: string) => {
    switch (asset.toUpperCase()) {
      case "DOGE":
        return `https://blockchair.com/dogecoin/transaction/${txId}`
      case "LTC":
        return `https://blockchair.com/litecoin/transaction/${txId}`
      case "BCH":
        return `https://blockchair.com/bitcoin-cash/transaction/${txId}`
      default:
        return `https://blockchair.com/bitcoin/transaction/${txId}`
    }
  }

  const getPendingLabel = (createdAt: string) => {
    const createdDate = new Date(createdAt)
    const now = new Date()
    const diffMs = new Date(createdDate.getTime() + 7 * 24 * 60 * 60 * 1000).getTime() - now.getTime()
    const remainingDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24))
    return remainingDays > 0
      ? `${remainingDays} day${remainingDays !== 1 ? "s" : ""} remaining`
      : "Pending due to technical issue"
  }

  if (!isConnected) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <Card>
          <CardHeader>
            <CardTitle>Redeem Requests</CardTitle>
            <CardDescription>Connect your wallet to view your redeem requests</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground text-center py-8">
              Please connect your wallet to view your redeem request history.
            </p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="mb-6">
        <BackButton href="/redeem">Back to Redeem</BackButton>

        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Your Redeem Requests</h1>
            <p className="text-muted-foreground">Track the status of your token redemption requests</p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={fetchRequests}
            disabled={isLoading}
            className="flex items-center gap-2 bg-transparent"
          >
            <RefreshCw className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`} />
            Refresh
          </Button>
        </div>
      </div>

      {isLoading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <Card key={i}>
              <CardHeader>
                <Skeleton className="h-6 w-1/3" />
                <Skeleton className="h-4 w-1/2" />
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-4 w-1/2" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : requests.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12">
            <RefreshCw className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No Redeem Requests Yet</h3>
            <p className="text-muted-foreground mb-4">
              You haven't submitted any redeem requests yet. Start by redeeming some tokens.
            </p>
            <Button asChild>
              <Link href="/redeem">Start Redeeming</Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {requests.map((request) => (
            <Card key={request.id} className="relative">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-3">
                      <div
                        className={`bg-gradient-to-br ${getAssetColor(request.asset)} text-white rounded-full w-10 h-10 flex items-center justify-center text-lg font-bold shadow-lg`}
                      >
                        {getAssetIcon(request.asset)}
                      </div>
                      <div>
                        <div className="text-xl">
                          {formatAmount(request.amount)} {request.asset}
                        </div>
                        <div className="text-sm font-normal text-muted-foreground">
                          Request #{request.id.slice(-8)}
                        </div>
                      </div>
                      <Badge className={`${getStatusColor(request.status)} flex items-center gap-1`}>
                        {request.status === "pending"
                          ? getPendingLabel(request.createdAt)
                          : request.status.charAt(0).toUpperCase() + request.status.slice(1)}
                      </Badge>
                    </CardTitle>
                  </div>
                  <div className="text-right text-sm text-muted-foreground">
                    <p>Submitted</p>
                    <p>{new Date(request.createdAt).toLocaleDateString()}</p>
                  </div>
                </div>
              </CardHeader>

              <CardContent className="space-y-4">
                {/* request details */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="font-medium text-muted-foreground">EVM Address</p>
                    <p className="font-mono text-xs break-all">{request.evmAddress}</p>
                  </div>
                  <div>
                    <p className="font-medium text-muted-foreground">Native Address</p>
                    <p className="font-mono text-xs break-all">{request.nativeRecipientAddress}</p>
                  </div>
                  <div>
                    <p className="font-medium text-muted-foreground">Chain</p>
                    <p className="capitalize">{request.evmChain}</p>
                  </div>
                  <div>
                    <p className="font-medium text-muted-foreground">Asset</p>
                    <p>{request.asset}</p>
                  </div>
                  <div>
                    <p className="font-medium text-muted-foreground">Burn Transaction</p>
                    <div className="flex items-center gap-2">
                      <p className="font-mono text-xs truncate max-w-[200px]">{request.burnTxHash}</p>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => window.open(getExplorerUrl(request.evmChain, request.burnTxHash), "_blank")}
                      >
                        <ExternalLink className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                  {request.nativeTransactionId && (
                    <div>
                      <p className="font-medium text-muted-foreground">Native Transaction</p>
                      <div className="flex items-center gap-2">
                        <p className="font-mono text-xs truncate max-w-[200px]">{request.nativeTransactionId}</p>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() =>
                            window.open(getNativeExplorerUrl(request.asset, request.nativeTransactionId!), "_blank")
                          }
                        >
                          <ExternalLink className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  )}
                </div>

                {/* status messages */}
                {request.status === "completed" && (
                  <div className="pt-4 border-t bg-green-50 p-3 rounded">
                    <div className="flex items-start gap-3">
                      <CheckCircle className="h-5 w-5 text-green-600 mt-0.5" />
                      <div>
                        <p className="font-medium text-green-800">Redemption Completed!</p>
                        <p className="text-sm text-green-700 mt-1">
                          Your native {request.asset} tokens have been successfully sent to your address.
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {request.status === "processing" && (
                  <div className="pt-4 border-t bg-blue-50 p-3 rounded">
                    <div className="flex items-start gap-3">
                      <RefreshCw className="h-5 w-5 text-blue-600 mt-0.5 animate-spin" />
                      <div>
                        <p className="font-medium text-blue-800">Processing Redemption</p>
                        <p className="text-sm text-blue-700 mt-1">
                          Your redemption request is being processed. Native tokens will be sent soon.
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {request.status === "pending" && (() => {
                  const createdDate = new Date(request.createdAt)
                  const now = new Date()
                  const diffMs =
                    new Date(createdDate.getTime() + 7 * 24 * 60 * 60 * 1000).getTime() - now.getTime()
                  const remainingDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24))

                  return (
                    <div className="pt-4 border-t bg-yellow-50 p-3 rounded">
                      <div className="flex items-start gap-3">
                        <Clock className="h-5 w-5 text-yellow-600 mt-0.5" />
                        <div>
                          <p className="font-medium text-yellow-800">Awaiting Processing</p>
                          {remainingDays > 0 ? (
                            <p className="text-sm text-yellow-700 mt-1">
                              Your redemption request is pending. Estimated approval in{" "}
                              <span className="font-semibold">{remainingDays} day{remainingDays !== 1 ? "s" : ""}</span>.
                            </p>
                          ) : (
                            <p className="text-sm text-yellow-700 mt-1">
                              Your request has passed the standard 7-day processing period and will be approved shortly.
                              Sorry for the delay.
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  )
                })()}

                {request.status === "failed" && (
                  <div className="pt-4 border-t bg-red-50 p-3 rounded">
                    <div className="flex items-start gap-3">
                      <XCircle className="h-5 w-5 text-red-600 mt-0.5" />
                      <div>
                        <p className="font-medium text-red-800">Redemption Failed</p>
                        <p className="text-sm text-red-700 mt-1">
                          Your redemption request has failed. Please contact support for assistance.
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                <div className="pt-2 border-t text-xs text-muted-foreground">
                  <p>Request ID: {request.id}</p>
                  <p>Last Updated: {new Date(request.updatedAt).toLocaleString()}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
