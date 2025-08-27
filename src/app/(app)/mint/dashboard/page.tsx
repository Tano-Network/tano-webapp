"use client"

import { useState, useEffect ,Suspense} from "react"
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
import { BackButton } from "@/components/BackButton"

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

  const fetchRequests = async () => {
    try {
      setIsLoading(true)

      // Fetch all requests
      const allResponse = await fetch("/api/mint-records")
      if (allResponse.ok) {
        const allData = await allResponse.json()
        setAllRequests(allData.requests || [])
      }

      // Fetch user requests if connected
      if (address && isConnected) {
        const userResponse = await fetch(`/api/mint-records?address=${address}`)
        if (userResponse.ok) {
          const userData = await userResponse.json()
          setUserRequests(userData.requests || [])
        }
      }
    } catch (error: any) {
      console.error("Error fetching mint records:", error)
      toast({
        title: "Error",
        description: "Failed to load mint records. Please try again.",
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

  const formatAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString()
  }

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString()
  }

  const MintRecordTable = ({
    requests,
    title,
    isUserTable = false,
  }: {
    requests: MintRequest[]
    title: string
    isUserTable?: boolean
  }) => (
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
              {isUserTable ? "Your mint records - highlighted for easy tracking" : "All mint records in the system"}
            </CardDescription>
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
            <h3 className="text-lg font-semibold mb-2">{isUserTable ? "No Mint Records Yet" : "No Requests Found"}</h3>
            <p className="text-muted-foreground mb-4">
              {isUserTable ? "You haven't submitted any mint records yet." : "No mint records found in the system."}
            </p>
            {isUserTable && (
              <Link href="/mint">
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Create Mint Record
                </Button>
              </Link>
            )}
          </div>
        ) : (
          <div className="overflow-auto max-h-96">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="min-w-[100px]">Vault</TableHead>
                  <TableHead className="min-w-[120px]">Amount</TableHead>
                  <TableHead className="min-w-[100px]">Status</TableHead>
                  <TableHead className="min-w-[140px]">EVM Address</TableHead>
                  <TableHead className="min-w-[140px]">Native Address</TableHead>
                  <TableHead className="min-w-[120px]">Chain</TableHead>
                  <TableHead className="min-w-[160px]">Transaction Hash</TableHead>
                  <TableHead className="min-w-[120px]">UTXO</TableHead>
                  <TableHead className="min-w-[120px]">Created</TableHead>
                  <TableHead className="min-w-[120px]">Updated</TableHead>
                  <TableHead className="min-w-[100px]">Proof</TableHead>
                  <TableHead className="min-w-[120px]">Mint Tx</TableHead>
                  <TableHead className="min-w-[100px]">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {requests.map((request) => {
                  const vault = getVaultInfo(request.vaultId)
                  return (
                    <TableRow key={request.id} className={isUserTable ? "bg-blue-50/50 dark:bg-blue-950/50" : ""}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <div
                            className={`bg-gradient-to-br ${getVaultIconColor(request.vaultId)} text-white rounded-full w-8 h-8 flex items-center justify-center text-sm font-bold shadow-lg`}
                          >
                            {getVaultIcon(request.vaultId)}
                          </div>
                          <div>
                            <div className="font-medium">{vault?.name || `${request.vaultId.toUpperCase()}`}</div>
                            <div className="text-xs text-muted-foreground">{request.vaultChain}</div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="font-mono">{request.amount}</div>
                        <div className="text-xs text-muted-foreground">
                          {vault?.nativeChainName || request.vaultChain}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge className={`${getStatusColor(request.status)} flex items-center gap-1 w-fit`}>
                          {getStatusIcon(request.status)}
                          {request.status.charAt(0).toUpperCase() + request.status.slice(1)}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="font-mono text-xs">{formatAddress(request.evmAddress)}</div>
                        <div className="text-xs text-muted-foreground">{request.evmChain}</div>
                      </TableCell>
                      <TableCell>
                        <div className="font-mono text-xs">{formatAddress(request.userVaultChainAddress)}</div>
                      </TableCell>
                      <TableCell>
                        <div className="capitalize">{request.evmChain}</div>
                        <div className="text-xs text-muted-foreground">ID: {request.evmChainId}</div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <div className="font-mono text-xs">{formatAddress(request.transactionHash)}</div>
                          {vault?.explorerUrl && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() =>
                                window.open(`${vault.explorerUrl}/tx/${request.transactionHash}`, "_blank")
                              }
                            >
                              <ExternalLink className="h-3 w-3" />
                            </Button>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="font-mono text-xs">{formatAddress(request.utxo)}</div>
                      </TableCell>
                      <TableCell>
                        <div className="text-xs">{formatDate(request.createdAt)}</div>
                        <div className="text-xs text-muted-foreground">
                          {formatDateTime(request.createdAt).split(" ")[1]}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-xs">{formatDate(request.updatedAt)}</div>
                        <div className="text-xs text-muted-foreground">
                          {formatDateTime(request.updatedAt).split(" ")[1]}
                        </div>
                      </TableCell>
                      <TableCell>
                        {request.proof ? (
                          <div className="flex items-center gap-2">
                            <FileText className="h-4 w-4 text-gray-600" />
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                // For now, keep it empty as requested
                              }}
                              disabled
                              className="text-xs"
                            >
                              View
                            </Button>
                          </div>
                        ) : (
                          <span className="text-xs text-muted-foreground">No proof</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {request.mintTxLink ? (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => window.open(request.mintTxLink, "_blank")}
                            className="text-xs"
                          >
                            <ExternalLink className="h-3 w-3 mr-1" />
                            View
                          </Button>
                        ) : (
                          <span className="text-xs text-muted-foreground">
                            {request.status === "minted" ? "Missing" : "Pending"}
                          </span>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Link href="/mint">
                            <Button variant="outline" size="sm" className="text-xs bg-transparent">
                              <Plus className="h-3 w-3 mr-1" />
                              Mint
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
          <div className="mb-4">
            <BackButton />
          </div>
          <p className="text-muted-foreground mt-2">View and manage all mint records in the system</p>
        </div>

        <div className="space-y-8">
          {/* User Requests Table (if connected) */}
          {isConnected && address && (
            <MintRecordTable requests={userRequests} title="Your Mint Records" isUserTable={true} />
          )}

          {/* All Requests Table */}
          <MintRecordTable requests={allRequests} title="All Mint Records" isUserTable={false} />
        </div>
      </div>
    </div>
  )
}
