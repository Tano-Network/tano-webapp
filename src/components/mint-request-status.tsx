"use client"

import { useState, useEffect } from "react"
import { useAccount } from "wagmi"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { useToast } from "@/hooks/use-toast"
import {
  RefreshCw,
  ExternalLink,
  Clock,
  CheckCircle,
  Shield,
  Coins,
  XCircle,
  AlertCircle,
  User,
  FileText,
} from "lucide-react"
import { VAULTS } from "@/lib/constants"

interface MintRequest {
  id: string
  evmAddress: string
  evmChain: string
  evmChainId: number
  vaultId: string
  vaultName: string
  vaultChain: string
  userVaultChainAddress: string
  amount: string
  utxo: string
  transactionHash: string
  whitelisted: boolean
  mintTxLink?: string
  proof: string
  createdAt: string
  updatedAt: string
  status: "pending" | "verified" | "whitelisted" | "minted" | "rejected"
  requestType: string
}

export function MintRequestStatus() {
  const { address, isConnected } = useAccount()
  const [requests, setRequests] = useState<MintRequest[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const { toast } = useToast()

  const fetchRequests = async () => {
    if (!address || !isConnected) return

    try {
      setIsLoading(true)
      const response = await fetch(`/api/mint-requests?address=${address}`)

      if (!response.ok) {
        throw new Error("Failed to fetch mint requests")
      }

      const data = await response.json()
      setRequests(data.requests || [])
    } catch (error: any) {
      console.error("Error fetching mint requests:", error)
      toast({
        title: "Error",
        description: "Failed to load mint requests. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchRequests()
  }, [address, isConnected])

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "pending":
        return <Clock className="h-4 w-4" />
      case "verified":
        return <CheckCircle className="h-4 w-4" />
      case "whitelisted":
        return <Shield className="h-4 w-4" />
      case "minted":
        return <Coins className="h-4 w-4" />
      case "rejected":
        return <XCircle className="h-4 w-4" />
      default:
        return <AlertCircle className="h-4 w-4" />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending":
        return "bg-yellow-100 text-yellow-800 border-yellow-200"
      case "verified":
        return "bg-blue-100 text-blue-800 border-blue-200"
      case "whitelisted":
        return "bg-purple-100 text-purple-800 border-purple-200"
      case "minted":
        return "bg-green-100 text-green-800 border-green-200"
      case "rejected":
        return "bg-red-100 text-red-800 border-red-200"
      default:
        return "bg-gray-100 text-gray-800 border-gray-200"
    }
  }

  const getStatusDescription = (status: string) => {
    switch (status) {
      case "pending":
        return "Transaction submitted, awaiting verification"
      case "verified":
        return "Transaction verified, awaiting admin approval"
      case "whitelisted":
        return "Approved for minting, awaiting admin to mint tokens"
      case "minted":
        return "Tokens successfully minted to your wallet by admin"
      case "rejected":
        return "Request rejected by admin"
      default:
        return "Unknown status"
    }
  }

  const getVaultInfo = (vaultId: string) => {
    return VAULTS.find((vault) => vault.id === vaultId)
  }

  const getVaultIcon = (vaultId: string) => {
    switch (vaultId.toLowerCase()) {
      case "doge":
      case "dogecoin":
        return "Ð"
      case "ltc":
      case "litecoin":
        return "Ł"
      case "bch":
      case "bitcoin-cash":
        return "₿"
      default:
        return vaultId.charAt(0).toUpperCase()
    }
  }

  const getVaultIconColor = (vaultId: string) => {
    switch (vaultId.toLowerCase()) {
      case "doge":
      case "dogecoin":
        return "from-yellow-500 to-orange-500"
      case "ltc":
      case "litecoin":
        return "from-gray-400 to-gray-600"
      case "bch":
      case "bitcoin-cash":
        return "from-green-500 to-emerald-600"
      default:
        return "from-blue-500 to-purple-600"
    }
  }

  if (!isConnected) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Mint Request Status</CardTitle>
          <CardDescription>Connect your wallet to view your mint requests</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-center py-8">
            Please connect your wallet to view your mint request history.
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Your Mint Requests</h2>
          <p className="text-muted-foreground">Track the status of your token mint requests</p>
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
            <Coins className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No Mint Requests Yet</h3>
            <p className="text-muted-foreground mb-4">
              You haven't submitted any mint requests yet. Create your first request to get started.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {requests.map((request) => {
            const vault = getVaultInfo(request.vaultId)
            return (
              <Card key={request.id} className="relative">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="flex items-center gap-2">
                        <div
                          className={`bg-gradient-to-br ${getVaultIconColor(request.vaultId)} text-white rounded-full w-8 h-8 flex items-center justify-center text-sm font-bold shadow-lg`}
                        >
                          {getVaultIcon(request.vaultId)}
                        </div>
                        {vault?.name || `${request.vaultId.toUpperCase()} Vault`}
                        <Badge className={`${getStatusColor(request.status)} flex items-center gap-1`}>
                          {getStatusIcon(request.status)}
                          {request.status.charAt(0).toUpperCase() + request.status.slice(1)}
                        </Badge>
                      </CardTitle>
                      <CardDescription>{getStatusDescription(request.status)}</CardDescription>
                    </div>
                    <div className="text-right text-sm text-muted-foreground">
                      <p>Submitted</p>
                      <p>{new Date(request.createdAt).toLocaleDateString()}</p>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="font-medium text-muted-foreground">Amount</p>
                      <p className="font-mono">
                        {request.amount} {vault?.nativeChainName || request.vaultChain}
                      </p>
                    </div>
                    <div>
                      <p className="font-medium text-muted-foreground">Vault Chain</p>
                      <p className="capitalize">{request.vaultChain}</p>
                    </div>
                    <div>
                      <p className="font-medium text-muted-foreground">Native Address</p>
                      <p className="font-mono text-xs break-all">{request.userVaultChainAddress}</p>
                    </div>
                    <div>
                      <p className="font-medium text-muted-foreground">EVM Address</p>
                      <p className="font-mono text-xs break-all">{request.evmAddress}</p>
                    </div>
                    <div>
                      <p className="font-medium text-muted-foreground">Transaction Hash</p>
                      <div className="flex items-center gap-2">
                        <p className="font-mono text-xs truncate max-w-[200px]">{request.transactionHash}</p>
                        {vault?.explorerUrl && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => window.open(`${vault.explorerUrl}/tx/${request.transactionHash}`, "_blank")}
                          >
                            <ExternalLink className="h-3 w-3" />
                          </Button>
                        )}
                      </div>
                    </div>
                    <div>
                      <p className="font-medium text-muted-foreground">UTXO</p>
                      <p className="font-mono text-xs break-all">{request.utxo}</p>
                    </div>
                    <div>
                      <p className="font-medium text-muted-foreground">Admin Approval</p>
                      <div className="flex items-center gap-2">
                        {request.whitelisted ? (
                          <div className="flex items-center gap-1 text-green-600">
                            <CheckCircle className="h-4 w-4" />
                            <span>Approved</span>
                          </div>
                        ) : (
                          <div className="flex items-center gap-1 text-orange-600">
                            <Clock className="h-4 w-4" />
                            <span>Pending Admin Approval</span>
                          </div>
                        )}
                      </div>
                    </div>
                    <div>
                      <p className="font-medium text-muted-foreground">Request Type</p>
                      <p className="capitalize">Retail</p>
                    </div>
                  </div>

                  {/* Proof Section */}
                  {request.proof && (
                    <div className="pt-4 border-t bg-gray-50 p-4 rounded-lg">
                      <div className="flex items-start gap-3">
                        <div className="bg-gray-100 p-2 rounded-full">
                          <FileText className="h-4 w-4 text-gray-600" />
                        </div>
                        <div className="flex-1">
                          <h4 className="font-medium text-gray-900 mb-2">Transaction Proof</h4>
                          <div className="space-y-2">
                            <div>
                              <p className="text-sm text-gray-600 mb-1">Proof Data:</p>
                              <div className="bg-white p-3 rounded border">
                                <p className="font-mono text-xs break-all text-gray-800">{request.proof}</p>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <p className="text-sm text-gray-600">Proof Link:</p>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                  // For now, keep it empty as requested
                                  // window.open(proofLink, "_blank")
                                }}
                                className="h-7 text-xs"
                                disabled
                              >
                                <ExternalLink className="h-3 w-3 mr-1" />
                                View Proof (Coming Soon)
                              </Button>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Admin Minting Section */}
                  {request.whitelisted && (
                    <div className="pt-4 border-t bg-blue-50 p-4 rounded-lg">
                      <div className="flex items-start gap-3">
                        <div className="bg-blue-100 p-2 rounded-full">
                          <User className="h-4 w-4 text-blue-600" />
                        </div>
                        <div className="flex-1">
                          <h4 className="font-medium text-blue-900 mb-1">Admin Minting Process</h4>
                          {request.status === "minted" && request.mintTxLink ? (
                            <div className="space-y-2">
                              <p className="text-sm text-blue-700">
                                ✅ Tokens have been minted to your wallet by the admin
                              </p>
                              <div className="flex items-center gap-2">
                                <p className="text-sm text-blue-600">Mint Transaction:</p>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => window.open(request.mintTxLink, "_blank")}
                                  className="h-7 text-xs"
                                >
                                  <ExternalLink className="h-3 w-3 mr-1" />
                                  View Transaction
                                </Button>
                              </div>
                            </div>
                          ) : (
                            <div className="space-y-2">
                              <p className="text-sm text-blue-700">
                                Your request has been approved. The admin will now mint t-
                                {request.vaultId.toUpperCase()} tokens to your EVM wallet.
                              </p>
                              <div className="flex items-center gap-2 text-xs text-blue-600">
                                <Clock className="h-3 w-3" />
                                <span>Awaiting admin to complete minting process</span>
                              </div>
                              {request.mintTxLink && (
                                <div className="mt-2">
                                  <p className="text-xs text-blue-600 mb-1">Mint Transaction (Processing):</p>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => window.open(request.mintTxLink, "_blank")}
                                    className="h-7 text-xs"
                                  >
                                    <ExternalLink className="h-3 w-3 mr-1" />
                                    View Transaction
                                  </Button>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Rejection Notice */}
                  {request.status === "rejected" && (
                    <div className="pt-4 border-t border-red-200 bg-red-50 p-3 rounded">
                      <div className="flex items-start gap-3">
                        <XCircle className="h-5 w-5 text-red-600 mt-0.5" />
                        <div>
                          <p className="font-medium text-red-800">Request Rejected by Admin</p>
                          <p className="text-sm text-red-700 mt-1">
                            This mint request was rejected by the admin. Please contact support if you believe this was
                            an error or need clarification on the rejection reason.
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Pending Admin Review */}
                  {!request.whitelisted && request.status !== "rejected" && (
                    <div className="pt-4 border-t bg-yellow-50 p-4 rounded-lg">
                      <div className="flex items-start gap-3">
                        <div className="bg-yellow-100 p-2 rounded-full">
                          <Clock className="h-4 w-4 text-yellow-600" />
                        </div>
                        <div className="flex-1">
                          <h4 className="font-medium text-yellow-900 mb-1">Awaiting Admin Review</h4>
                          <p className="text-sm text-yellow-700">
                            Your mint request is currently under review by our admin team. Once approved, the admin will
                            mint the tokens directly to your EVM wallet.
                          </p>
                          <div className="mt-2 text-xs text-yellow-600">
                            <p>• Admin will verify your transaction</p>
                            <p>• Upon approval, tokens will be minted to: {request.evmAddress}</p>
                            <p>• You will receive t-{request.vaultId.toUpperCase()} tokens</p>
                          </div>
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
            )
          })}
        </div>
      )}
    </div>
  )
}
