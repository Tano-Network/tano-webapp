"use client"

import { useState, useEffect } from "react"
import { useAccount, usePublicClient } from "wagmi"
import { formatUnits } from "viem"
import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { ArrowRight } from "lucide-react"
import { VAULTS, SUPPORTED_CHAINS } from "@/lib/constants"
import { cn } from "@/lib/utils"
import { formatAddress } from "@/lib/web3"
import assetAbi from "@/abi/asset.json"
import assetManagementAbi from "@/abi/assetManagement.json"
import { getCoinPrices } from "@/app/actions/get-prices"
import { LoadingSpinner } from "@/components/LoadingSpinner"

// Extend Vault with ABIs and price ID
const REDEEMABLE_VAULTS = VAULTS.map((vault) => ({
  ...vault,
  coinGeckoId: vault.id === "tdoge" ? "dogecoin" : "litecoin",
  decimals: 18,
  tokenAbi: assetAbi,
  assetManagementAbi: assetManagementAbi,
}))

export default function RedeemDashboardPage() {
  const { address, isConnected, chain } = useAccount()
  const publicClient = usePublicClient()

  const [balances, setBalances] = useState<Record<string, string>>({})
  const [usdValues, setUsdValues] = useState<Record<string, string>>({})
  const [totalTAssetsHeld, setTotalTAssetsHeld] = useState("0.00")
  const [totalTAssetsUsd, setTotalTAssetsUsd] = useState("0.00")
  const [loading, setLoading] = useState(false)

  const fetchAllBalances = async () => {
    if (!isConnected || !address || !publicClient) return

    setLoading(true)
    try {
      const prices = await getCoinPrices()

      const calls = REDEEMABLE_VAULTS.map((vault) => ({
        address: vault.tokenAddress as `0x${string}`,
        abi: assetAbi,
        functionName: "balanceOf",
        args: [address],
      }))

      const results = await publicClient.multicall({
        contracts: calls as any,
        allowFailure: true,
      })

      const newBalances: Record<string, string> = {}
      const newUsdValues: Record<string, string> = {}

      let total = 0
      let totalUsd = 0

      for (let i = 0; i < REDEEMABLE_VAULTS.length; i++) {
        const vault = REDEEMABLE_VAULTS[i]
        const result = results[i]

        if (result.status === "success") {
          const raw = result.result as bigint
          const formatted = formatUnits(raw, vault.decimals)
          newBalances[vault.id] = formatted

          const price =
            vault.coinGeckoId === "dogecoin"
              ? prices.dogecoin
              : vault.coinGeckoId === "litecoin"
                ? prices.litecoin
                : vault.coinGeckoId === "bitcoin-cash"
                  ? prices.bitcoin_cash
                  : 0

          const usd = Number.parseFloat(formatted) * price
          newUsdValues[vault.id] = usd.toFixed(2)

          total += Number.parseFloat(formatted)
          totalUsd += usd
        } else {
          newBalances[vault.id] = "0.00"
          newUsdValues[vault.id] = "0.00"
        }
      }

      setBalances(newBalances)
      setUsdValues(newUsdValues)
      setTotalTAssetsHeld(total.toFixed(2))
      setTotalTAssetsUsd(totalUsd.toFixed(2))
    } catch (err) {
      console.error("Error fetching balances:", err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchAllBalances()
  }, [address, publicClient])

  const isSepolia = chain?.id === SUPPORTED_CHAINS.SEPOLIA

  return (
    <div className="flex flex-col gap-4 p-4 lg:gap-6 lg:p-6">
      <h1 className="text-lg font-semibold md:text-2xl">Redeem Dashboard</h1>

      {!isConnected ? (
        <Card className="text-center py-8">
          <CardHeader>
            <CardTitle>Connect Wallet</CardTitle>
            <CardDescription>Please connect your wallet to continue.</CardDescription>
          </CardHeader>
        </Card>
      ) : !isSepolia ? (
        <Card className="text-center py-8 bg-orange-100 border-orange-500">
          <CardHeader>
            <CardTitle>Wrong Network</CardTitle>
            <CardDescription>Please switch to Sepolia Testnet.</CardDescription>
          </CardHeader>
        </Card>
      ) : (
        <>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader>
                <CardTitle>Wallet</CardTitle>
                <CardDescription>{chain?.name}</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-xl font-semibold">{formatAddress(address!)}</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Total tAssets</CardTitle>
                <CardDescription>USD Estimated</CardDescription>
              </CardHeader>
              <CardContent>
                {loading ? <LoadingSpinner /> : <p className="text-xl font-bold">${totalTAssetsUsd}</p>}
              </CardContent>
            </Card>
          </div>

          <Separator className="my-4" />

          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold mb-4 text-foreground">Your Redeemable Assets</h2>
            <Button asChild variant="outline">
              <Link href="/redeem/requests">View Requests</Link>
            </Button>
          </div>

          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {REDEEMABLE_VAULTS.map((vault) => (
              <Card key={vault.id} className="hover:shadow-md transition-shadow border border-muted">
                <CardHeader className="flex items-center gap-4 pb-2">
                  <div
                    className={cn(
                      "bg-gradient-to-br text-white rounded-full h-12 w-12 flex items-center justify-center text-xl font-bold shadow-lg transition-all duration-300",
                      vault.color,
                    )}
                  >
                    {vault.id === "tdoge" ? "Ð" : vault.id === "tltc" ? "Ł" : "₿"}
                  </div>
                  <div>
                    <CardTitle className="text-lg font-semibold">{vault.name}</CardTitle>
                    <CardDescription className="text-muted-foreground text-sm">{vault.description}</CardDescription>
                  </div>
                </CardHeader>

                <CardContent className="space-y-3 pt-0">
                  <div className="flex justify-between text-sm text-muted-foreground">
                    <span>Balance</span>
                    <span className="text-foreground font-medium">
                      {balances[vault.id] ?? "0.00"} {vault.asset}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm text-muted-foreground">
                    <span>USD Value</span>
                    <span className="text-foreground font-medium">${usdValues[vault.id] ?? "0.00"}</span>
                  </div>
                  <Button className="w-full mt-2 bg-transparent" asChild variant="outline">
                    <Link href={`/redeem/${vault.id}`}>
                      Redeem <ArrowRight className="ml-2 h-4 w-4" />
                    </Link>
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </>
      )}
    </div>
  )
}
