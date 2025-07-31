"use client"

import type React from "react"
import { useState } from "react"
import { useAccount } from "wagmi"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { VAULTS } from "@/lib/constants"
import { useToast } from "@/hooks/use-toast"
import { formatAddress } from "@/lib/web3"
import type { MintFormData } from "@/app/(app)/mint/page"
import Image from "next/image"

interface MintStepOneProps {
  onComplete: (data: MintFormData) => void
}

export function MintStepOne({ onComplete }: MintStepOneProps) {
  const { address, isConnected, chain } = useAccount()
  const [selectedVaultId, setSelectedVaultId] = useState<string | undefined>(undefined)
  const [userVaultChainAddress, setUserVaultChainAddress] = useState<string>("")
  const { toast } = useToast()

  const selectedVault = VAULTS.find((vault) => vault.id === selectedVaultId)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    if (!isConnected || !address || !chain || !selectedVault || !userVaultChainAddress) {
      toast({
        title: "Missing Information",
        description: "Please connect your wallet, select a vault, and enter your vault chain address.",
        variant: "destructive",
      })
      return
    }

    const formData: MintFormData = {
      evmAddress: address,
      evmChain: chain.name,
      evmChainId: chain.id,
      vaultId: selectedVault.id,
      vaultName: selectedVault.name,
      vaultChain: selectedVault.nativeChainName,
      userVaultChainAddress: userVaultChainAddress,
    }

    onComplete(formData)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-2">
        <Label htmlFor="walletAddress">Connected EVM Wallet Address</Label>
        <Input
          id="walletAddress"
          value={isConnected ? formatAddress(address!) : "Wallet not connected"}
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
                  <span className="text-lg"><img src={vault.icon} alt={vault.name} width={20} height={20} /></span>
                  {vault.name}
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {selectedVault && (
        <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
          <h3 className="font-semibold text-blue-900 mb-2">Selected: {selectedVault.name}</h3>
          <p className="text-sm text-blue-700">
            You will be depositing to {selectedVault.nativeChainName} and receiving t-{selectedVault.id.toUpperCase()}{" "}
            tokens on {isConnected ? chain?.name : "your EVM network"}.
          </p>
        </div>
      )}

      <div className="space-y-2">
        <Label htmlFor="userVaultChainAddress">Your {selectedVault?.nativeChainName || "Vault Chain"} Address</Label>
        <Input
          id="userVaultChainAddress"
          placeholder={`Enter your ${selectedVault?.nativeChainName || "vault chain"} address`}
          value={userVaultChainAddress}
          onChange={(e) => setUserVaultChainAddress(e.target.value)}
          disabled={!selectedVault}
          required
        />
        <p className="text-xs text-muted-foreground">
          This is your address on the {selectedVault?.nativeChainName || "vault chain"} where you will send funds from.
        </p>
      </div>

      <Button type="submit" className="w-full" disabled={!isConnected || !selectedVault || !userVaultChainAddress}>
        Continue to Transaction Details
      </Button>

      {selectedVault && (
        <div className="text-xs text-muted-foreground space-y-1">
          <p>
            <strong>Next Steps:</strong>
          </p>
          <p>1. You'll get the deposit address for {selectedVault.nativeChainName}</p>
          <p>2. Send your {selectedVault.nativeChainName} to that address</p>
          <p>3. Provide the transaction hash for verification</p>
          <p>4. Wait for admin approval and token minting</p>
        </div>
      )}
    </form>
  )
}
