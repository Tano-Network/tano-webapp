"use client"

import { BackButton } from "@/components/BackButton"
import { useUserType } from "@/contexts/UserTypeContexts"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ArrowRight } from "lucide-react"
import { useAccount } from "wagmi"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { LoadingSpinner } from "@/components/LoadingSpinner"

interface MintRecord {
  id: string;
  amount: string;
  status: string;
  createdAt: string;
}

interface RedeemRequest {
  id: string;
  amount: string;
  status: string;
  createdAt: string;
}

export default function RetailDashboardPage() {
  const { userType } = useUserType()
  const router = useRouter()
  const { address, isConnected } = useAccount()

  const [mintRecords, setMintRecords] = useState<MintRecord[]>([])
  const [redeemRequests, setRedeemRequests] = useState<RedeemRequest[]>([])
  const [isLoadingMintRecords, setIsLoadingMintRecords] = useState(true)
  const [isLoadingRedeemRequests, setIsLoadingRedeemRequests] = useState(true)

  useEffect(() => {
    if (userType && userType !== "retail") {
      router.push("/institutional-dashboard")
    } else if (!userType) {
      // Optionally redirect to a user type selection page or home if userType is not set
      // router.push("/")
    }
  }, [userType, router])

  useEffect(() => {
    const fetchMintRecords = async () => {
      if (!address || !isConnected) {
        setIsLoadingMintRecords(false)
        return
      }
      setIsLoadingMintRecords(true)
      try {
        const response = await fetch(`/api/mint-records?address=${address}`)
        if (response.ok) {
          const data = await response.json()
          setMintRecords(data.records || [])
        } else {
          console.error("Failed to fetch mint records:", response.statusText)
          setMintRecords([])
        }
      } catch (error) {
        console.error("Error fetching mint records:", error)
        setMintRecords([])
      } finally {
        setIsLoadingMintRecords(false)
      }
    }

    const fetchRedeemRequests = async () => {
      if (!address || !isConnected) {
        setIsLoadingRedeemRequests(false)
        return
      }
      setIsLoadingRedeemRequests(true)
      try {
        const response = await fetch(`/api/redeem/history?address=${address}`)
        if (response.ok) {
          const data = await response.json()
          setRedeemRequests(data.history || [])
        } else {
          console.error("Failed to fetch redeem requests:", response.statusText)
          setRedeemRequests([])
        }
      } catch (error) {
        console.error("Error fetching redeem requests:", error)
        setRedeemRequests([])
      } finally {
        setIsLoadingRedeemRequests(false)
      }
    }

    fetchMintRecords()
    fetchRedeemRequests()
  }, [address, isConnected])

  if (!userType || userType !== "retail") {
    return <div className="flex items-center justify-center min-h-screen">Redirecting...</div>
  }

  return (
    <div className="container mx-auto py-10">
      <h1 className="text-3xl font-bold mb-6">Retail Dashboard</h1>
      <div className="mb-4">
        <BackButton />
      </div>
      <p className="mb-8">Welcome to your Retail Dashboard! Here you will find functions tailored for retail users and a summary of your activities.</p>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-8">
        <Card className="bg-card p-6 rounded-lg shadow flex flex-col justify-between">
          <div>
            <h2 className="text-xl font-semibold mb-4">Minting</h2>
            <p className="text-muted-foreground">Access minting functionalities.</p>
          </div>
          <Button asChild className="mt-4">
            <Link href="/mint" className="flex items-center gap-2">
              Go to Mint
              <ArrowRight size={16} />
            </Link>
          </Button>
        </Card>
        <Card className="bg-card p-6 rounded-lg shadow flex flex-col justify-between">
          <div>
            <h2 className="text-xl font-semibold mb-4">Redeem</h2>
            <p className="text-muted-foreground">Access redemption functionalities.</p>
          </div>
          <Button asChild className="mt-4">
            <Link href="/redeem" className="flex items-center gap-2">
              Go to Redeem
              <ArrowRight size={16} />
            </Link>
          </Button>
        </Card>
        <Card className="bg-card p-6 rounded-lg shadow flex flex-col justify-between">
          <div>
            <h2 className="text-xl font-semibold mb-4">Earn</h2>
            <p className="text-muted-foreground">Explore earning opportunities.</p>
          </div>
          <Button asChild className="mt-4">
            <Link href="/earn" className="flex items-center gap-2">
              Go to Earn
              <ArrowRight size={16} />
            </Link>
          </Button>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-8">
        <Card>
          <CardHeader>
            <CardTitle>Recent Mint Requests</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoadingMintRecords ? (
              <div className="flex justify-center items-center h-32">
                <LoadingSpinner />
                <span className="ml-2">Loading mint records...</span>
              </div>
            ) : mintRecords.length > 0 ? (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Amount</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Date</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {mintRecords.slice(0, 5).map((record) => (
                      <TableRow key={record.id}>
                        <TableCell>{parseFloat(record.amount).toFixed(2)}</TableCell>
                        <TableCell className="capitalize">{record.status}</TableCell>
                        <TableCell>{new Date(record.createdAt).toLocaleDateString()}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            ) : (
              <p className="text-muted-foreground">No mint records found.</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Recent Redeem Requests</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoadingRedeemRequests ? (
              <div className="flex justify-center items-center h-32">
                <LoadingSpinner />
                <span className="ml-2">Loading redeem requests...</span>
              </div>
            ) : redeemRequests.length > 0 ? (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Amount</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Date</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {redeemRequests.slice(0, 5).map((request) => (
                      <TableRow key={request.id}>
                        <TableCell>{parseFloat(request.amount).toFixed(2)}</TableCell>
                        <TableCell className="capitalize">{request.status}</TableCell>
                        <TableCell>{new Date(request.createdAt).toLocaleDateString()}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            ) : (
              <p className="text-muted-foreground">No redeem requests found.</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}