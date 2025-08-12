"use client"

import { useState, useEffect } from "react"
import { useAccount } from "wagmi"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { useToast } from "@/hooks/use-toast"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
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
  Plus,
} from "lucide-react"
import { VAULTS } from "@/lib/constants"
import Link from "next/link"
import { UserGuide } from "@/components/UserGuide"

// ⬇ Added imports for dialog & scroll area
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { ScrollArea } from "@/components/ui/scroll-area"


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

export default function MintDashboard() {
  const { address, isConnected } = useAccount()
  const [userRequests, setUserRequests] = useState<MintRequest[]>([])
  const [allRequests, setAllRequests] = useState<MintRequest[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const { toast } = useToast()

  // ⬇ Proof dialog state
  const [selectedProof, setSelectedProof] = useState<any | null>(null)
  const [isProofDialogOpen, setIsProofDialogOpen] = useState(false)

  const fetchRequests = async () => {
    try {
      setIsLoading(true)

      const allResponse = await fetch("/api/mint-requests")
      if (allResponse.ok) {
        const allData = await allResponse.json()
        setAllRequests(allData.requests || [])
      }

      if (address && isConnected) {
        const userResponse = await fetch(`/api/mint-requests?address=${address}`)
        if (userResponse.ok) {
          const userData = await userResponse.json()
          setUserRequests(userData.requests || [])
        }
      }
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

  const getVaultInfo = (vaultId: string) => VAULTS.find((vault) => vault.id === vaultId)

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

  const formatAddress = (address: string) => `${address.slice(0, 6)}...${address.slice(-4)}`
  const formatDate = (dateString: string) => new Date(dateString).toLocaleDateString()
  const formatDateTime = (dateString: string) => new Date(dateString).toLocaleString()


  const MintRequestTable = ({
    requests,
    title,
    isUserTable = false,
  }: { requests: MintRequest[]; title: string; isUserTable?: boolean }) => (
    <Card
      className={isUserTable ? "border-2 border-blue-200 bg-blue-50/30 dark:border-blue-800 dark:bg-blue-950/30" : ""}
    >

      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              {isUserTable && <User className="h-5 w-5 text-blue-600" />}
              {title}
              <Badge variant="secondary">{requests.length}</Badge>
            </CardTitle>
            <CardDescription>
              {isUserTable ? "Your mint requests - highlighted for easy tracking" : "All mint requests in the system"}
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={fetchRequests} disabled={isLoading} className="flex items-center gap-2 bg-transparent">
              <RefreshCw className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`} />
              Refresh
            </Button>
            {isUserTable && (
              <Link href="/mint/new">
                <Button size="sm" className="flex items-center gap-2">
                  <Plus className="h-4 w-4" />
                  Submit Mint Request
                </Button>
              </Link>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex space-x-4">
                <Skeleton className="h-12 w-12 rounded-full" />
                <div className="space-y-2 flex-1">
                  <Skeleton className="h-4 w-1/4" />
                  <Skeleton className="h-4 w-1/2" />
                </div>
              </div>
            ))}
          </div>
        ) : requests.length === 0 ? (
          <div className="text-center py-8">
            <Coins className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">{isUserTable ? "No Mint Requests Yet" : "No Requests Found"}</h3>
            <p className="text-muted-foreground mb-4">
              {isUserTable ? "You haven't submitted any mint requests yet." : "No mint requests found in the system."}
            </p>
            {isUserTable && (
              <Link href="/mint/new">
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Submit Mint Request
                </Button>
              </Link>
            )}
          </div>
        ) : (
          <div className="overflow-auto max-h-96">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Vault</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>EVM Address</TableHead>
                  <TableHead>Native Address</TableHead>
                  <TableHead>Chain</TableHead>
                  <TableHead>Transaction Hash</TableHead>
                  <TableHead>UTXO</TableHead>
                  <TableHead>Admin Approval</TableHead>
                  <TableHead>Request Type</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead>Updated</TableHead>
                  <TableHead>Proof</TableHead>
                  <TableHead>Mint Tx</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {requests.map((request) => {
                  const vault = getVaultInfo(request.vaultId)
                  return (

                    <TableRow key={request.id} className={isUserTable ? "bg-blue-50/50 dark:bg-blue-950/50" : ""}>

                      {/* Vault */}
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <div className={`bg-gradient-to-br ${getVaultIconColor(request.vaultId)} text-white rounded-full w-8 h-8 flex items-center justify-center text-sm font-bold shadow-lg`}>
                            {getVaultIcon(request.vaultId)}
                          </div>
                          <div>
                            <div className="font-medium">{vault?.name || request.vaultId.toUpperCase()}</div>
                            <div className="text-xs text-muted-foreground">{request.vaultChain}</div>
                          </div>
                        </div>
                      </TableCell>
                      {/* Amount */}
                      <TableCell>
                        <div className="font-mono">{request.amount}</div>
                        <div className="text-xs text-muted-foreground">{vault?.nativeChainName || request.vaultChain}</div>
                      </TableCell>
                      {/* Status */}
                      <TableCell>
                        <Badge className={`${getStatusColor(request.status)} flex items-center gap-1 w-fit`}>
                          {getStatusIcon(request.status)}
                          {request.status.charAt(0).toUpperCase() + request.status.slice(1)}
                        </Badge>
                      </TableCell>
                      {/* EVM Address */}
                      <TableCell>
                        <div className="font-mono text-xs">{formatAddress(request.evmAddress)}</div>
                        <div className="text-xs text-muted-foreground">{request.evmChain}</div>
                      </TableCell>
                      {/* Native Address */}
                      <TableCell>
                        <div className="font-mono text-xs">{formatAddress(request.userVaultChainAddress)}</div>
                      </TableCell>
                      {/* Chain */}
                      <TableCell>
                        <div className="capitalize">{request.evmChain}</div>
                        <div className="text-xs text-muted-foreground">ID: {request.evmChainId}</div>
                      </TableCell>
                      {/* Tx Hash */}
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <div className="font-mono text-xs">{formatAddress(request.transactionHash)}</div>
                          {vault?.explorerUrl && (
                            <Button variant="ghost" size="sm" onClick={() => window.open(`${vault.explorerUrl}/tx/${request.transactionHash}`, "_blank")}>
                              <ExternalLink className="h-3 w-3" />
                            </Button>
                          )}
                        </div>
                      </TableCell>
                      {/* UTXO */}
                      <TableCell>
                        <div className="font-mono text-xs">{formatAddress(request.utxo)}</div>
                      </TableCell>
                      {/* Approval */}
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {request.whitelisted ? (
                            <div className="flex items-center gap-1 text-green-600">
                              <CheckCircle className="h-4 w-4" />
                              <span className="text-xs">Approved</span>
                            </div>
                          ) : (
                            <div className="flex items-center gap-1 text-orange-600">
                              <Clock className="h-4 w-4" />
                              <span className="text-xs">Pending</span>
                            </div>
                          )}
                        </div>
                      </TableCell>
                      {/* Request Type */}
                      <TableCell>
                        <Badge variant="outline" className="text-xs">Retail</Badge>
                      </TableCell>
                      {/* Created */}
                      <TableCell>
                        <div className="text-xs">{formatDate(request.createdAt)}</div>
                        <div className="text-xs text-muted-foreground">{formatDateTime(request.createdAt).split(" ")[1]}</div>
                      </TableCell>
                      {/* Updated */}
                      <TableCell>
                        <div className="text-xs">{formatDate(request.updatedAt)}</div>
                        <div className="text-xs text-muted-foreground">{formatDateTime(request.updatedAt).split(" ")[1]}</div>
                      </TableCell>
                      {/* Proof */}
                      <TableCell>
                        {request.proof ? (
                          <div className="flex items-center gap-2">
                            <FileText className="h-4 w-4 text-gray-600" />
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                try {
                                  const parsed = JSON.parse(request.proof)
                                  setSelectedProof(parsed)
                                  setIsProofDialogOpen(true)
                                } catch {
                                  setSelectedProof({ error: "Invalid proof format" })
                                  setIsProofDialogOpen(true)
                                }
                              }}
                              className="text-xs"
                            >
                              View
                            </Button>
                          </div>
                        ) : (
                          <span className="text-xs text-muted-foreground">No proof</span>
                        )}
                      </TableCell>
                      {/* Mint Tx */}
                      <TableCell>
                        {request.mintTxLink ? (
                          <Button variant="ghost" size="sm" onClick={() => window.open(request.mintTxLink, "_blank")} className="text-xs">
                            <ExternalLink className="h-3 w-3 mr-1" />
                            View
                          </Button>
                        ) : (
                          <span className="text-xs text-muted-foreground">
                            {request.status === "minted" ? "Missing" : "Pending"}
                          </span>
                        )}
                      </TableCell>
                      {/* Actions */}
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Link href="/mint/new">
                            <Button variant="outline" size="sm" className="text-xs bg-transparent">
                              <Plus className="h-3 w-3 mr-1" />
                              New
                            </Button>
                          </Link>
                        </div>
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  )

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="max-w-full mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold">Mint Dashboard</h1>
          <p className="text-muted-foreground mt-2">View and manage all mint requests in the system</p>
          <div className="mt-4">
            <Link href="/mint/new">
              <Button size="lg" className="flex items-center gap-2">
                <Plus className="h-5 w-5" />
                Submit New Mint Request
              </Button>
            </Link>
          </div>
        </div>

        <div className="mb-8">
          <UserGuide type="mint" />
        </div>

        <div className="space-y-8">
          {isConnected && address && (
            <MintRequestTable requests={userRequests} title="Your Mint Requests" isUserTable={true} />
          )}
          <MintRequestTable requests={allRequests} title="All Mint Requests" isUserTable={false} />
        </div>
      </div>

      {/* Proof Dialog */}
      <Dialog open={isProofDialogOpen} onOpenChange={setIsProofDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Proof Details</DialogTitle>
            <DialogDescription>
              {selectedProof ? "Below is the proof data for this request:" : "No proof data"}
            </DialogDescription>
          </DialogHeader>
          <ScrollArea className="max-h-[60vh] mt-4 p-2 border rounded">
            <pre className="text-xs whitespace-pre-wrap break-words">
              {selectedProof ? JSON.stringify(selectedProof, null, 2) : "N/A"}
            </pre>
          </ScrollArea>
        </DialogContent>
      </Dialog>
    </div>
  )
}

export interface MintFormData {
  evmAddress: string
  evmChain: string
  evmChainId: number
  vaultId: string
  vaultName: string
  vaultChain: string | undefined
  userVaultChainAddress: string
}
