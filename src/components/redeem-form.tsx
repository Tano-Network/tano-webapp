"use client"

import { useState, useTransition, useEffect } from "react"
import { useAccount, usePublicClient } from "wagmi"
import { parseUnits, formatUnits } from "ethers"
import { z } from "zod"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { ArrowRight, Loader2, CheckCircle2 } from "lucide-react"
import { useWriteContract } from "wagmi"
import { waitForTransactionReceipt } from "wagmi/actions"
import { config } from "@/lib/wagmiConfig" // Assuming wagmiConfig is available

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { useToast } from "@/hooks/use-toast"
import type assetAbi from "@/abi/asset.json"
import type assetManagementAbi from "@/abi/assetManagement.json"
import { LoadingSpinner } from "@/components/LoadingSpinner"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"
import { cn } from "@/lib/utils"

// Updated RedeemableAsset type to match VAULTS structure in constants.ts
// export type RedeemableAsset = {
//   id: string
//   name: string // e.g., "tDOGE Vault"
//   icon: string // e.g., "🐕"
//   tokenAddress: `0x${string}` // The ERC20 t-asset token contract address
//   assetManagementAddress: `0x${string}` // The contract that handles burning this specific t-asset
//   nativeChainName: string
//   nativeAddress: string
//   explorerUrl: string
//   decimals: number
//   coinGeckoId: string
//   // Add ABIs here for convenience, though they could be imported directly in component
//   tokenAbi: typeof assetAbi
//   assetManagementAbi: typeof assetManagementAbi
// }

interface RedeemFormProps {
  selectedAsset: any | null
  onClose: () => void
  onRedeemSuccess: () => void
}

const formSchema = z.object({
  amount: z
    .string()
    .min(1, { message: "Amount is required" })
    .regex(/^\d+(\.\d+)?$/, "Invalid amount"),
  burnTxHash: z.string().min(1, { message: "Burn transaction hash is required" }),
})

export function RedeemForm({ selectedAsset, onClose, onRedeemSuccess }: RedeemFormProps) {
  const { writeContractAsync } = useWriteContract()
  const { address, isConnected } = useAccount()
  const publicClient = usePublicClient()
  const { toast } = useToast()
  const [isPending, startTransition] = useTransition()
  const [userBalance, setUserBalance] = useState<string | null>(null)
  const [isFetchingBalance, setIsFetchingBalance] = useState(true)
  const [burnTxHash, setBurnTxHash] = useState<string | null>(null)
  const [isBurning, setIsBurning] = useState(false)

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      amount: "",
      burnTxHash: "",
    },
  })

  const fetchUserBalance = async () => {
    if (!isConnected || !address || !publicClient || !selectedAsset) {
      setUserBalance(null)
      setIsFetchingBalance(false)
      return
    }

    setIsFetchingBalance(true)
    try {
      const balance = await publicClient.readContract({
        address: selectedAsset.tokenAddress, // Use tokenAddress
        abi: selectedAsset.tokenAbi,
        functionName: "balanceOf",
        args: [address],
      })
      setUserBalance(formatUnits(balance as bigint, selectedAsset.decimals))
    } catch (error) {
      console.error("Error fetching user balance:", error)
      toast({
        title: "Error",
        description: `Failed to fetch ${selectedAsset.name} balance.`,
        variant: "destructive",
      })
      setUserBalance(null)
    } finally {
      setIsFetchingBalance(false)
    }
  }

  useEffect(() => {
    if (selectedAsset) {
      fetchUserBalance()
      // Reset form and state when a new asset is selected or dialog opens
      form.reset({ amount: "", burnTxHash: "" })
      setBurnTxHash(null)
      setIsBurning(false)
    }
  }, [selectedAsset, isConnected, address, publicClient])

  const handleBurnTokens = async (values: z.infer<typeof formSchema>) => {
    if (!isConnected || !publicClient || !address || !selectedAsset) {
      toast({
        title: "Wallet Not Connected",
        description: "Please connect your wallet to burn tokens.",
        variant: "destructive",
      })
      return
    }

    setIsBurning(true)
    setBurnTxHash(null)

    try {
      const amountBigInt = parseUnits(values.amount, selectedAsset.decimals)

      // Step 1: Approve (if needed)
      // Only approve if the token contract is different from the asset management contract
      // and the asset management contract needs approval to spend the token.
      if (selectedAsset.tokenAddress.toLowerCase() !== selectedAsset.assetManagementAddress.toLowerCase()) {
        const allowance = (await publicClient.readContract({
          address: selectedAsset.tokenAddress, // Use tokenAddress
          abi: selectedAsset.tokenAbi,
          functionName: "allowance",
          args: [address, selectedAsset.assetManagementAddress], // Use assetManagementAddress
        })) as bigint

        if (allowance < amountBigInt) {
          const approveHash = await writeContractAsync({
            address: selectedAsset.tokenAddress, // Use tokenAddress
            abi: selectedAsset.tokenAbi,
            functionName: "approve",
            args: [selectedAsset.assetManagementAddress, amountBigInt], // Use assetManagementAddress
          })

          toast({
            title: "Approval Sent",
            description: "Waiting for approval confirmation...",
          })

          await waitForTransactionReceipt(config, { hash: approveHash })
          toast({
            title: "Approval Confirmed",
            description: "You can now proceed to burn your tokens.",
          })
        }
      }

      // Step 2: Burn
      // The burn function on the AssetManagement contract takes only the amount.
      // It's assumed to know which specific t-asset to burn based on its internal logic
      // or the context of the call (e.g., if it's a dedicated burn contract for this token).
      const burnHash = await writeContractAsync({
        address: selectedAsset.assetManagementAddress, // Use assetManagementAddress
        abi: selectedAsset.assetManagementAbi,
        functionName: "burn",
        args: [amountBigInt],
      })

      setBurnTxHash(burnHash)

      toast({
        title: "Burn Transaction Sent",
        description: `Waiting for confirmation of ${values.amount} ${selectedAsset.name} burn...`,
      })

      const receipt = await waitForTransactionReceipt(config, { hash: burnHash })

      if (receipt.status === "success") {
        toast({
          title: "Burn Successful!",
          description: `Successfully burned ${values.amount} ${selectedAsset.name}. Now submit for native redemption.`,
        })
        form.setValue("burnTxHash", burnHash)
        form.clearErrors("burnTxHash")
        fetchUserBalance() // Re-fetch balance after burn
      } else {
        throw new Error("Burn transaction failed on-chain.")
      }
    } catch (err: any) {
      console.error("Burn failed:", err)
      toast({
        title: "Error",
        description: err.message || "Burn failed",
        variant: "destructive",
      })
      setBurnTxHash(null)
    } finally {
      setIsBurning(false)
    }
  }

  const handleSubmitRedemption = async (values: z.infer<typeof formSchema>) => {
    startTransition(async () => {
      if (!isConnected || !address || !publicClient || !selectedAsset) {
        toast({
          title: "Wallet Not Connected",
          description: "Please connect your wallet.",
          variant: "destructive",
        })
        return
      }

      if (!values.burnTxHash) {
        toast({
          title: "Missing Burn Transaction",
          description: "Please complete the burn transaction first.",
          variant: "destructive",
        })
        return
      }

      try {
        const chainId = await publicClient.getChainId()

        const response = await fetch("/api/redeem", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            evmAddress: address,
            evmChain: publicClient.chain.name, // Use publicClient.chain.name for chain name
            evmChainId: chainId,
            asset: selectedAsset.id, // Use selectedAsset.id (e.g., "tdoge")
            amount: values.amount,
            burnTxHash: values.burnTxHash,
          }),
        })

        const data = await response.json()

        if (response.ok) {
          toast({
            title: "Redemption Request Submitted",
            description: data.message || "Your redemption request has been submitted successfully.",
          })
          onRedeemSuccess()
          onClose()
        } else {
          toast({
            title: "Redemption Failed",
            description: data.error || "Failed to submit redemption request.",
            variant: "destructive",
          })
        }
      } catch (error) {
        console.error("Redemption submission error:", error)
        toast({
          title: "Error",
          description: "An unexpected error occurred. Please try again.",
          variant: "destructive",
        })
      }
    })
  }

  if (!selectedAsset) return null

  const currentBalance = userBalance ? Number.parseFloat(userBalance) : 0
  const inputAmount = form.watch("amount") ? Number.parseFloat(form.watch("amount")) : 0
  const isAmountValid = inputAmount > 0 && inputAmount <= currentBalance

  return (
    <Dialog open={!!selectedAsset} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <div
              className={cn(
                "bg-gradient-to-br text-white rounded-full h-8 w-8 flex items-center justify-center text-md font-bold shadow-lg",
                // selectedAsset.color, // Assuming color is part of RedeemableAsset or derived
              )}
            >
              {selectedAsset.icon}
            </div>
            Redeem {selectedAsset.name}
          </DialogTitle>
          <DialogDescription>
            Burn your {selectedAsset.name} tokens to initiate the redemption of native {selectedAsset.nativeChainName}.
            The native recipient address will be fetched from your original mint request.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleBurnTokens)} className="space-y-4">
            <FormField
              control={form.control}
              name="amount"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Amount to Burn</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <Input
                        type="number"
                        step="any"
                        placeholder={`0.00 ${selectedAsset.name}`}
                        {...field}
                        disabled={!isConnected || isBurning || isPending || !!burnTxHash}
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="absolute right-0 top-0 h-full px-3 py-1 text-xs text-muted-foreground hover:bg-transparent"
                        onClick={() => field.onChange(userBalance || "0")}
                        disabled={!isConnected || isBurning || isPending || !userBalance || !!burnTxHash}
                      >
                        Max
                      </Button>
                    </div>
                  </FormControl>
                  <FormMessage />
                  <div className="text-sm text-muted-foreground flex justify-between">
                    <span>Your Balance:</span>
                    {isFetchingBalance ? (
                      <LoadingSpinner size="sm" className="text-muted-foreground" />
                    ) : (
                      <span className="font-medium">
                        {userBalance || "0.00"} {selectedAsset.name}
                      </span>
                    )}
                  </div>
                </FormItem>
              )}
            />

            <Button
              type="submit"
              className="w-full"
              disabled={!isConnected || isBurning || isPending || !isAmountValid || !!burnTxHash}
            >
              {isBurning ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Burning...
                </>
              ) : (
                <>
                  Burn {selectedAsset.name} <ArrowRight className="ml-2 h-4 w-4" />
                </>
              )}
            </Button>
          </form>

          {burnTxHash && (
            <div className="mt-6 space-y-4">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <CheckCircle2 className="h-4 w-4 text-green-500" />
                <span>Burn transaction confirmed!</span>
              </div>
              <FormField
                control={form.control}
                name="burnTxHash"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Burn Transaction Hash</FormLabel>
                    <FormControl>
                      <Input value={field.value || burnTxHash} readOnly className="font-mono text-xs" />
                    </FormControl>
                    <FormMessage />
                    <p className="text-xs text-muted-foreground">
                      This hash will be used to verify your burn and fetch your native recipient address.
                    </p>
                  </FormItem>
                )}
              />
              <Button
                onClick={form.handleSubmit(handleSubmitRedemption)}
                className="w-full"
                disabled={isPending || !burnTxHash}
              >
                {isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Submitting Request...
                  </>
                ) : (
                  <>
                    Submit Redemption Request <ArrowRight className="ml-2 h-4 w-4" />
                  </>
                )}
              </Button>
            </div>
          )}
        </Form>
        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isBurning || isPending}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
