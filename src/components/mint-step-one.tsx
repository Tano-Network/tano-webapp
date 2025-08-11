"use client"

import type React from "react"
import { useState, useMemo } from "react"
import { useAccount } from "wagmi"
import { VAULTS } from "@/lib/constants"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent } from "@/components/ui/card"
import { useToast } from "@/hooks/use-toast"
import type { MintFormData } from "@/app/(app)/mint/page"

interface MintStepOneProps {
  onComplete: (data: MintFormData) => void
}

export function MintStepOne({ onComplete }: MintStepOneProps) {
  const { address, isConnected, chain } = useAccount()
  const { toast } = useToast()
  const [selectedVaultId, setSelectedVaultId] = useState<string | undefined>(undefined)

  const selectedVault = useMemo(() => VAULTS.find((v) => v.id === selectedVaultId), [selectedVaultId])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    if (!isConnected || !address || !chain || !selectedVault) {
      toast({
        title: "Missing Information",
        description: "Please connect your wallet and select a vault.",
        variant: "destructive",
      })
      return
    }

    const formData: MintFormData = {
      evmAddress: address,
      evmChain: chain.name ?? "",
      evmChainId: chain.id ?? 0,
      vaultId: selectedVault.id,
      vaultName: selectedVault.name,
      vaultChain: selectedVault.nativeChainName,
      userVaultChainAddress: "",
    }

    onComplete(formData)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-2">
        <Label htmlFor="walletAddress">Connected EVM Wallet Address</Label>
        <Input
          id="walletAddress"
          value={isConnected && address ? `${address.slice(0, 6)}...${address.slice(-4)}` : "Wallet not connected"}
          readOnly
          disabled={!isConnected}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="network">Connected EVM Network</Label>
        <Input id="network" value={isConnected ? chain?.name : "N/A"} readOnly disabled={!isConnected} />
      </div>

      <div className="space-y-2">
        <Label htmlFor="vault">Select Vault</Label>
        <Select onValueChange={setSelectedVaultId} value={selectedVaultId}>
          <SelectTrigger id="vault">
            <SelectValue placeholder="Select a vault" />
          </SelectTrigger>
          <SelectContent>
            {VAULTS.map((vault) => (
              <SelectItem key={vault.id} value={vault.id}>
                <div className="flex items-center gap-2">
                  {vault.icon ? (
                    <img
                      src={vault.icon || "/placeholder.svg"}
                      alt={`${vault.name} icon`}
                      className="h-5 w-5 rounded object-cover"
                      referrerPolicy="no-referrer"
                    />
                  ) : (
                    <div className="h-5 w-5 rounded bg-muted" />
                  )}
                  <span>{vault.name}</span>
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {selectedVault && (
        <Card className="border bg-muted/40">
          <CardContent className="p-4 flex items-center gap-3">
            <div className={`h-10 w-10 rounded-full bg-gradient-to-r ${selectedVault.color}`} />
            <div className="text-sm">
              <div className="font-medium">{selectedVault.name}</div>
              <div className="text-muted-foreground">
                Native chain: {selectedVault.nativeChainName}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <p className="text-xs text-muted-foreground">
        Your native-chain address will be detected automatically in Step 2 from the transaction you provide.
      </p>

      <Button type="submit" className="w-full" disabled={!isConnected || !selectedVault}>
        Continue to Transaction Details
      </Button>
    </form>
  )
}
