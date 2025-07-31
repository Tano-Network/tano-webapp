"use client"

import { use, useEffect, useState } from "react"
import Link from "next/link"
import { useAccount, useChainId, useWriteContract } from "wagmi"
import { formatUnits, parseUnits } from "viem"
import { readContract } from "wagmi/actions"
import { waitForTransactionReceipt } from "@wagmi/core"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useToast } from "@/hooks/use-toast"
import { ArrowLeft } from "lucide-react"
import { cn } from "@/lib/utils"
import { CONTRACT_ADDRESSES, SUPPORTED_CHAINS, EXPLORER_URLS } from "@/lib/constants"
import assetAbi from "@/abi/asset.json"
import vaultManagerAbi from "@/abi/assetManagement.json"
import { Label } from "@/components/ui/label"
import { config } from "@/lib/wagmiConfig"
import axios from "axios"

const getVaultData = (id: string) => {
  if (id === "tdoge") {
    return {
      asset: "tDOGE",
      icon: "Ð",
      tokenContract: CONTRACT_ADDRESSES[SUPPORTED_CHAINS.SEPOLIA].TDOGE_TOKEN,
      assetManagementContract: CONTRACT_ADDRESSES[SUPPORTED_CHAINS.SEPOLIA].TDOGE_ASSET_MANAGEMENT,
      color: "from-yellow-500 to-orange-500",
      description: "Redeem your tDOGE tokens",
    }
  } else if (id === "tltc") {
    return {
      asset: "tLTC",
      icon: "Ł",
      tokenContract: CONTRACT_ADDRESSES[SUPPORTED_CHAINS.SEPOLIA].TLTC_TOKEN,
      assetManagementContract: CONTRACT_ADDRESSES[SUPPORTED_CHAINS.SEPOLIA].TLTC_ASSET_MANAGEMENT,
      color: "from-gray-400 to-gray-600",
      description: "Redeem your tLTC tokens",
    }
  } else if (id === "tbch") {
    return {
      asset: "tBCH",
      icon: "₿",
      tokenContract: CONTRACT_ADDRESSES[SUPPORTED_CHAINS.SEPOLIA].TBCH_TOKEN,
      assetManagementContract: CONTRACT_ADDRESSES[SUPPORTED_CHAINS.SEPOLIA].TBCH_ASSET_MANAGEMENT,
      color: "from-green-500 to-emerald-600",
      description: "Redeem your tBCH tokens",
    }
  } else {
    return {
      asset: "Unknown",
      icon: "?",
      tokenContract: "0x0000000000000000000000000000000000000000",
      assetManagementContract: "0x0000000000000000000000000000000000000000",
      color: "from-gray-400 to-gray-600",
      description: "Unknown asset",
    }
  }
}

export default function RedeemPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const vault = getVaultData(id)
  const { address, isConnected } = useAccount()
  const chainId = useChainId()
  const { toast } = useToast()
  const { writeContractAsync } = useWriteContract()

  const [redeemAmount, setRedeemAmount] = useState("")
  const [tokenBalance, setTokenBalance] = useState<bigint>(BigInt(0))
  const [allowance, setAllowance] = useState<bigint>(BigInt(0))
  const [nativeRecipientAddress, setNativeRecipientAddress] = useState<string>("")
  const [redeemHistory, setRedeemHistory] = useState<any[]>([])
  const [isProcessing, setIsProcessing] = useState(false)
  const [showModal, setShowModal] = useState(false)
  const [modalContent, setModalContent] = useState<{
    title: string
    description: string
    isSuccess: boolean
    txHash?: string
  }>({ title: "", description: "", isSuccess: false })

  const isCorrectNetwork = chainId === SUPPORTED_CHAINS.SEPOLIA
  const explorerUrl = EXPLORER_URLS[SUPPORTED_CHAINS.SEPOLIA]

  useEffect(() => {
    if (!isConnected || !isCorrectNetwork || !address) return
    ;(async () => {
      try {
        const [balance, allowed] = await Promise.all([
          readContract(config, {
            address: vault.tokenContract as `0x${string}`,
            abi: assetAbi,
            functionName: "balanceOf",
            args: [address],
          }),
          readContract(config, {
            address: vault.tokenContract as `0x${string}`,
            abi: assetAbi,
            functionName: "allowance",
            args: [address, vault.assetManagementContract],
          }),
        ])
        setTokenBalance(balance as bigint)
        setAllowance(allowed as bigint)
      } catch (err) {
        console.error("Error fetching token state", err)
      }
    })()

    // Fetch native address from latest mint request
    axios.get(`/api/mint/latest?address=${address}&vaultId=${id}`).then((res) => {
      if (res.data?.userVaultChainAddress) setNativeRecipientAddress(res.data.userVaultChainAddress)
    })

    // Fetch redeem history
    axios.get(`/api/redeem/history?address=${address}&vaultId=${id}`).then((res) => setRedeemHistory(res.data || []))
  }, [address, isConnected, isCorrectNetwork, vault])

  const needsApproval = redeemAmount && parseUnits(redeemAmount, 18) > allowance
  const formattedBalance = Number(formatUnits(tokenBalance, 18)).toFixed(4)
  const formattedAllowance = Number(formatUnits(allowance, 18)).toFixed(4)

  const handleApprove = async () => {
    try {
      const amt = parseUnits(redeemAmount, 18)
      setIsProcessing(true)
      setShowModal(true)
      setModalContent({ title: "Approving...", description: "Confirm in wallet", isSuccess: false })

      const hash = await writeContractAsync({
        address: vault.tokenContract as `0x${string}`,
        abi: assetAbi,
        functionName: "approve",
        args: [vault.assetManagementContract, amt],
      })

      await waitForTransactionReceipt(config, { hash })
      toast({ title: "Approved", description: `Approved ${redeemAmount} ${vault.asset}` })
      setModalContent({
        title: "Approval Successful",
        description: `Approved ${redeemAmount}`,
        isSuccess: true,
        txHash: hash,
      })
    } catch (err) {
      toast({ title: "Approval failed", description: String(err), variant: "destructive" })
    } finally {
      setIsProcessing(false)
    }
  }

  const handleRedeem = async () => {
    try {
      const amt = parseUnits(redeemAmount, 18)
      setIsProcessing(true)
      setShowModal(true)
      setModalContent({ title: "Redeeming...", description: "Confirm burn in wallet", isSuccess: false })

      const hash = await writeContractAsync({
        address: vault.assetManagementContract as `0x${string}`,
        abi: vaultManagerAbi,
        functionName: "burn",
        args: [amt],
      })

      await waitForTransactionReceipt(config, { hash })

      await axios.post("/api/redeem", {
        evmAddress: address,
        evmChain: "sepolia",
        evmChainId: chainId,
        asset: vault?.asset?.replace("t", ""),
        amount: redeemAmount,
        burnTxHash: hash,
        nativeRecipientAddress,
        status: "pending",
      })

      toast({ title: "Burn successful", description: `Burned ${redeemAmount} ${vault.asset}` })
      setModalContent({
        title: "Redeem Successful",
        description: `Burned ${redeemAmount}`,
        isSuccess: true,
        txHash: hash,
      })
      setRedeemAmount("")
    } catch (err) {
      toast({ title: "Redeem failed", description: String(err), variant: "destructive" })
    } finally {
      setIsProcessing(false)
    }
  }

  return (
    <div className="container max-w-2xl mx-auto p-4 space-y-8">
      <Button asChild variant="outline">
        <Link href="/redeem">
          <ArrowLeft className="w-4 h-4 mr-2" /> Back
        </Link>
      </Button>

      <Card>
        <CardHeader>
          <CardTitle className="text-2xl flex items-center gap-3">
            <div
              className={cn(
                "bg-gradient-to-br text-white rounded-full w-12 h-12 flex items-center justify-center text-xl font-bold shadow-lg",
                vault.color,
              )}
            >
              {vault.icon}
            </div>
            Redeem {vault.asset}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div>
            <Label htmlFor="amount">Amount</Label>
            <Input
              id="amount"
              type="number"
              value={redeemAmount}
              onChange={(e) => setRedeemAmount(e.target.value)}
              placeholder="0.0"
              className="h-12 text-lg"
              disabled={isProcessing}
              step="0.01"
              min="0"
              max={formattedBalance}
            />
            <div className="text-sm text-muted-foreground mt-1">
              Balance: {formattedBalance} {vault.asset}
              <br />
              Approved: {formattedAllowance} {vault.asset}
              <br />
              Native Address: {nativeRecipientAddress || "(fetching...)"}
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              ⏳ Native {vault?.asset?.replace("t", "")} will be sent to your original address within 7 days after
              redeem request is submitted.
            </p>
          </div>

          <Button
            onClick={needsApproval ? handleApprove : handleRedeem}
            disabled={
              !redeemAmount || Number(redeemAmount) <= 0 || parseUnits(redeemAmount, 18) > tokenBalance || isProcessing
            }
          >
            {needsApproval ? "Approve" : "Redeem"}
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
