"use client";

import { useState, useEffect, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import Image from "next/image";
import {
  useAccount,
  useReadContract,
  useWriteContract,
  useWaitForTransactionReceipt,
} from "wagmi";
import { parseUnits, formatUnits, isAddress, maxUint256 } from "viem";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { BackButton } from "@/components/BackButton";
import { VAULTS, DEFAULT_INSTITUTIONAL_NATIVE_ADDRESS } from "@/lib/constants";
import Link from "next/link";
import { ConnectButton } from "@rainbow-me/rainbowkit";

const ERC20_ABI = [
  {
    inputs: [{ name: "account", type: "address" }],
    name: "balanceOf",
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      { name: "spender", type: "address" },
      { name: "amount", type: "uint256" },
    ],
    name: "approve",
    outputs: [{ name: "", type: "bool" }],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      { name: "owner", type: "address" },
      { name: "spender", type: "address" },
    ],
    name: "allowance",
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [{ name: "amount", type: "uint256" }],
    name: "burn",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [],
    name: "decimals",
    outputs: [{ name: "", type: "uint8" }],
    stateMutability: "view",
    type: "function",
  },
] as const;

export default function RedeemPage() {
  const params = useParams();
  const router = useRouter();
  const { address, isConnected, chainId } = useAccount();
  const { toast } = useToast();
  const {
    writeContract,
    data: hash,
    isPending: isWritePending,
    error: writeError,
    writeContractAsync,
  } = useWriteContract();

  const vaultId = params.id as string;
  const vault = VAULTS.find((v) => v.id === vaultId);

  const [amount, setAmount] = useState("");
  const [nativeAddress, setNativeAddress] = useState("");
  const [isFetchingNativeAddress, setIsFetchingNativeAddress] = useState(true);
  const [nativeAddressError, setNativeAddressError] = useState<string | null>(
    null
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [redeemRequestId, setRedeemRequestId] = useState<string | null>(null);
  const [burnTxHash, setBurnTxHash] = useState<string | null>(null);
  const [collateralPrice, setCollateralPrice] = useState<number | null>(null);
  const [redemptionFeePercentage, setRedemptionFeePercentage] =
    useState<number>(0);

  const [approvalHash, setApprovalHash] = useState<`0x${string}` | undefined>(
    undefined
  );
  const [isApproving, setIsApproving] = useState(false);

  // Contract reads
  const { data: balance, refetch: refetchBalance } = useReadContract({
    address: vault?.tokenAddress as `0x${string}`,
    abi: ERC20_ABI,
    functionName: "balanceOf",
    args: address ? [address] : undefined,
    query: {
      enabled:
        !!address && !!vault?.tokenAddress && isAddress(vault.tokenAddress),
    },
  });

  const { data: decimals } = useReadContract({
    address: vault?.tokenAddress as `0x${string}`,
    abi: ERC20_ABI,
    functionName: "decimals",
    query: { enabled: !!vault?.tokenAddress && isAddress(vault.tokenAddress) },
  });

  const { data: allowance, refetch: refetchAllowance } = useReadContract({
    address: vault?.tokenAddress as `0x${string}`,
    abi: ERC20_ABI,
    functionName: "allowance",
    args:
      address && vault?.assetManagementAddress
        ? [address, vault.assetManagementAddress as `0x${string}`]
        : undefined,
    query: {
      enabled:
        !!address &&
        !!vault?.tokenAddress &&
        !!vault?.assetManagementAddress &&
        isAddress(vault.tokenAddress) &&
        isAddress(vault.assetManagementAddress),
    },
  });

  // Wait for burn transaction receipt
  const { isLoading: isConfirmingBurn, isSuccess: isConfirmedBurn } =
    useWaitForTransactionReceipt({
      hash,
    });

  // Wait for approval transaction receipt
  const { isLoading: isConfirmingApproval, isSuccess: isConfirmedApproval } =
    useWaitForTransactionReceipt({
      hash: approvalHash,
    });

  // Fetch collateral price (native asset price) and fees
  useEffect(() => {
    const fetchPricesAndFees = async () => {
      if (vault?.coinGeckoId) {
        try {
          const response = await fetch(
            `https://api.coingecko.com/api/v3/simple/price?ids=${vault.coinGeckoId}&vs_currencies=usd`
          );
          const data = await response.json();
          if (data && data[vault.coinGeckoId] && data[vault.coinGeckoId].usd) {
            setCollateralPrice(data[vault.coinGeckoId].usd);
          } else {
            console.warn(
              `Could not fetch price for ${vault.coinGeckoId}, using placeholder.`
            );
            setCollateralPrice(0); // Fallback
          }
        } catch (error) {
          console.error("Error fetching CoinGecko price:", error);
          setCollateralPrice(0); // Fallback on error
        }
      }
      // Redemption fee percentage (hardcoded for now, fetch from API in real app)
      setRedemptionFeePercentage(0); // 0%
    };
    fetchPricesAndFees();
  }, [vault?.coinGeckoId]);

  // Fetch latest mint request for native recipient address
  useEffect(() => {
    const fetchNativeAddress = async () => {
      if (!isConnected || !address || !vaultId) {
        setNativeAddress("");
        setNativeAddressError("Connect your wallet to fetch address.");
        setIsFetchingNativeAddress(false);
        return;
      }

      setIsFetchingNativeAddress(true);
      setNativeAddressError(null);
      try {
        const response = await fetch(
          `/api/mint/latest?address=${address}&vaultId=${vaultId}`
        );
        const data = await response.json();

        if (response.ok && data.userVaultChainAddress) {
          setNativeAddress(data.userVaultChainAddress);
        } else {
          setNativeAddress("");
          setNativeAddressError(
            data.error || "No previous mint request found for this vault."
          );
        }
      } catch (error) {
        console.error("Error fetching latest mint request:", error);
        setNativeAddress("");
        setNativeAddressError("Failed to fetch previous mint request.");
      } finally {
        setIsFetchingNativeAddress(false);
      }
    };

    fetchNativeAddress();
  }, [isConnected, address, vaultId]);

  // Handle successful burn transaction
  useEffect(() => {
    if (isConfirmedBurn && hash && amount) {
      // Only call handleRedeemRequest if burn is confirmed
      handleRedeemRequest(hash);
    }
  }, [isConfirmedBurn, hash, amount]);

  // Handle successful approval transaction
  useEffect(() => {
    if (isConfirmedApproval && approvalHash) {
      toast({
        title: "Approval Successful!",
        description: `You have approved the vault to spend your ${vault?.asset} tokens.`,
        duration: 3000,
      });
      setIsApproving(false);
      setApprovalHash(undefined);
      refetchAllowance(); // Refetch allowance after approval
    }
  }, [
    isConfirmedApproval,
    approvalHash,
    toast,
    vault?.asset,
    refetchAllowance,
  ]);

  const handleRedeemRequest = async (txHash: string) => {
    if (!vault || !address) return;

    try {
      setIsSubmitting(true);
      setBurnTxHash(txHash);

      console.log("Creating redeem request with data:", {
        evmAddress: address,
        evmChain: vault.evmChain,
        evmChainId: vault.evmChainId,
        asset: vault.asset,
        amount,
        burnTxHash: txHash,
        nativeRecipientAddress: nativeAddress,
        status: "pending",
      });

      const response = await fetch("/api/redeem", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          evmAddress: address,
          evmChain: vault.evmChain,
          evmChainId: vault.evmChainId,
          asset: vault.coin,
          amount,
          burnTxHash: txHash,
          nativeRecipientAddress: nativeAddress,
          status: "pending",
        }),
      });

      const data = await response.json();

      if (response.ok && data.status === "success") {
        setRedeemRequestId(data.requestId);
        setShowSuccessModal(true);

        toast({
          title: "Redeem Request Submitted Successfully!",
          description: `Your redeem request for ${amount} ${vault.asset} has been submitted. Native tokens will be sent within 7 days.`,
          duration: 5000,
        });

        // Automatically redirect after a short delay
        setTimeout(() => {
          router.push("/redeem/requests");
        }, 3000); // 3 seconds delay

        // Reset form
        setAmount("");
        setNativeAddress("");
        refetchBalance(); // Refetch balance after successful API call
        refetchAllowance(); // Refetch allowance after successful API call
      } else {
        throw new Error(data.message || "Failed to create redeem request");
      }
    } catch (error: any) {
      console.error("Error creating redeem request:", error);
      toast({
        title: "Error",
        description:
          error.message || "Failed to submit redeem request. Please try again.",
        variant: "destructive",
        duration: 5000,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleApprove = async () => {
    if (!vault || !address || !vault.assetManagementAddress) return;

    try {
      setIsApproving(true);
      const approveTxHash = await writeContractAsync({
        address: vault.tokenAddress as `0x${string}`,
        abi: ERC20_ABI,
        functionName: "approve",
        args: [vault.assetManagementAddress as `0x${string}`, maxUint256], // Approve max amount
      });
      setApprovalHash(approveTxHash);
    } catch (error: any) {
      console.error("Error approving tokens:", error);
      toast({
        title: "Error",
        description: "Failed to approve tokens. Please try again.",
        variant: "destructive",
      });
      setIsApproving(false);
    }
  };

  const handleBurn = async () => {
    if (!vault || !address || !amount || !nativeAddress) return;

    try {
      const burnAmount = parseUnits(amount, decimals || 18);

      writeContract({
        address: vault.tokenAddress as `0x${string}`,
        abi: ERC20_ABI,
        functionName: "burn",
        args: [burnAmount],
      });
    } catch (error: any) {
      console.error("Error burning tokens:", error);
      toast({
        title: "Error",
        description: "Failed to burn tokens. Please try again.",
        variant: "destructive",
      });
    }
  };

  if (!vault) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card>
          <CardContent className="text-center py-12">
            <AlertTriangle className="h-12 w-12 mx-auto text-red-500 mb-4" />
            <h2 className="text-xl font-semibold mb-2">Vault Not Found</h2>
            <p className="text-muted-foreground mb-4">
              The requested vault could not be found.
            </p>
            <Button asChild>
              <Link href="/redeem">Back to Redeem</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const formattedBalance =
    balance && decimals ? formatUnits(balance, decimals) : "0";
  const formattedAllowance =
    allowance && decimals ? formatUnits(allowance, decimals) : "0";
  const parsedAmount = amount ? parseUnits(amount, decimals || 18) : BigInt(0);

  const isZeroBalance = !balance || balance === BigInt(0);
  const isZeroAddress =
    !vault.tokenAddress ||
    vault.tokenAddress === "0x0000000000000000000000000000000000000000";
  const isWrongNetwork = chainId !== vault.evmChainId;
  const isInvalidAmount =
    !amount ||
    Number.parseFloat(amount) <= 0 ||
    Number.parseFloat(amount) > Number.parseFloat(formattedBalance);
  const isInvalidNativeAddress =
    !nativeAddress || nativeAddress.length < 10 || nativeAddressError !== null;

  const needsApproval =
    isConnected &&
    !isInvalidAmount &&
    allowance !== undefined &&
    parsedAmount > allowance;

  const canRedeem =
    isConnected &&
    !isZeroBalance &&
    !isZeroAddress &&
    !isWrongNetwork &&
    !isInvalidAmount &&
    !isInvalidNativeAddress && // Redemption is blocked if no valid native address is found
    !needsApproval && // Must be approved
    !isWritePending &&
    !isConfirmingBurn &&
    !isSubmitting &&
    !isApproving &&
    !isConfirmingApproval &&
    !isFetchingNativeAddress;

  const usdEquivalent = useMemo(() => {
    const numAmount = Number.parseFloat(amount);
    if (isNaN(numAmount) || numAmount <= 0 || collateralPrice === null)
      return "0.00";
    return (numAmount * collateralPrice).toFixed(2);
  }, [amount, collateralPrice]);

  const redemptionFeeAmount = useMemo(() => {
    const numAmount = Number.parseFloat(amount);
    if (isNaN(numAmount) || numAmount <= 0) return "0.00";
    return (numAmount * (redemptionFeePercentage / 100)).toFixed(2);
  }, [amount, redemptionFeePercentage]);

  const expectedCollateralReceived = useMemo(() => {
    const numAmount = Number.parseFloat(amount);
    if (isNaN(numAmount) || numAmount <= 0) return "0";
    return (numAmount - Number.parseFloat(redemptionFeeAmount)).toFixed(2);
  }, [amount, redemptionFeeAmount]);

  // Helper to derive hover gradient classes from base gradient classes
  const getHoverGradientClass = (baseColorClass: string) => {
    const parts = baseColorClass.split(' '); // e.g., ['from-yellow-500', 'to-orange-500']
    if (parts.length !== 2 || !parts[0].startsWith('from-') || !parts[1].startsWith('to-')) {
      return ''; // Return empty if format is unexpected
    }

    const getHoverPart = (part: string) => {
      const [type, colorName, shadeStr] = part.split('-');
      const shade = parseInt(shadeStr);
      const newShade = shade < 900 ? shade + 100 : shade;
      return `hover:${type}-${colorName}-${newShade}`;
    };

    return `${getHoverPart(parts[0])} ${getHoverPart(parts[1])}`;
  };

  const baseGradientClass = vault.color;
  const hoverGradientClass = getHoverGradientClass(baseGradientClass);

  return (
    <div className="container mx-auto px-4 py-8 max-w-2xl">
      <div className="mb-6">
        <BackButton href="/redeem">Back to Redeem</BackButton>

        <div className="flex items-center gap-4 mb-2">
          <div
            className={`rounded-full w-12 h-12 flex items-center justify-center text-xl font-bold shadow-lg ${vault.color}`}
          >
            {vault.icon && (
              <Image
                src={vault.icon || "/placeholder.svg"}
                alt={`${vault.asset} icon`}
                width={32}
                height={32}
                className="rounded-full"
              />
            )}
          </div>
          <div>
            <h1 className="text-3xl font-bold">
              Redeem {vault.name.replace(/Vault/gi, "").trim()}
            </h1>

            <p className="text-muted-foreground">
              Burn t-{vault.asset} tokens to receive native{" "}
              {vault.nativeChainName}
            </p>
          </div>
        </div>
      </div>

      <div className="space-y-6">
        {/* Alerts */}
        {!isConnected && (
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              Please connect your wallet to redeem tokens.
            </AlertDescription>
          </Alert>
        )}

        {isZeroAddress && (
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              Token contract address is invalid. Redeem is currently disabled
              for this vault.
            </AlertDescription>
          </Alert>
        )}

        {isWrongNetwork && (
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              Please switch to {vault.evmChain} network to redeem tokens.
            </AlertDescription>
          </Alert>
        )}

        {/* {isZeroBalance && isConnected && !isZeroAddress && !isWrongNetwork && (
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              You have no t-{vault.asset} tokens to redeem. Your balance is 0.
            </AlertDescription>
          </Alert>
        )} */}

        {/* Redeem Form - Styled to match image */}
        <Card className="p-6">
          <div className="flex items-center justify-between mb-2">
            <Label htmlFor="amount" className="text-base font-semibold">
              Enter amount of {vault.asset}
            </Label>
            <span className="text-sm text-muted-foreground">
              Balance {formattedBalance} {vault.asset}
            </span>
          </div>

          <div className="flex items-center gap-2 mb-2">
            <div className="relative flex-grow">
              <Input
                id="amount"
                type="number"
                placeholder="0.00"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="pr-36 h-12 text-lg"
                disabled={
                  !isConnected ||
                  isZeroBalance ||
                  isZeroAddress ||
                  isWrongNetwork
                }
              />
              <div className="absolute right-4 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                ={" "}
                <span className="font-medium text-foreground">
                  ${usdEquivalent}
                </span>
              </div>
            </div>
            <Button
              variant="outline"
              className={`bg-gradient-to-r ${baseGradientClass} text-white ${hoverGradientClass} hover:text-white h-12 px-6`}
              onClick={() => setAmount(formattedBalance)}
              disabled={
                !isConnected || isZeroBalance || isZeroAddress || isWrongNetwork
              }
            >
              Max
            </Button>
            <Button
              variant="outline"
              className="bg-black text-white hover:bg-gray-800 hover:text-white h-12 px-6 flex items-center gap-2"
              disabled
            >
              <Wallet className="h-5 w-5" />
              {vault.asset}
            </Button>
          </div>

          {isConnected && allowance !== undefined && (
            <p className="text-sm text-muted-foreground mb-6">
              Approved: {formattedAllowance} {vault.asset}
            </p>
          )}

          {/* Native Address Display / Prompt */}
          {isFetchingNativeAddress ? (
            <div className="space-y-2 mb-6">
              <Label className="text-base font-semibold">
                {vault.nativeChainName} Address
              </Label>
              <div className="relative flex items-center gap-2 p-3 border rounded-md bg-muted/50">
                <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                <span className="text-muted-foreground">
                  Fetching address...
                </span>
              </div>
              <p className="text-xs text-muted-foreground">
                Native {vault.nativeChainName} tokens will be sent to this
                address.
              </p>
            </div>
          ) : nativeAddressError ? (
            <Alert variant="destructive" className="mt-4 mb-6">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription className="flex flex-col gap-2">
                <span>
                  No previous mint request found for this vault. For retail
                  users, a mint request is required to determine the native
                  recipient address.
                </span>
                <span>
                  For institutional users, please contact your administrator to
                  confirm the default vault address:{" "}
                  <code className="font-mono text-sm">
                    {DEFAULT_INSTITUTIONAL_NATIVE_ADDRESS}
                  </code>
                  .
                </span>
                <Button asChild variant="outline" className="w-fit">
                  <Link href="/mint/new">Create a Mint Request (Retail)</Link>
                </Button>
              </AlertDescription>
            </Alert>
          ) : (
            <div className="space-y-2 mb-6">
              <Label className="text-base font-semibold">
                {vault.nativeChainName} Address
              </Label>
              <div className="p-3 border rounded-md bg-muted/50 text-foreground break-all">
                {nativeAddress}
              </div>
              <p className="text-xs text-muted-foreground">
                Native {vault.nativeChainName} tokens will be sent to this
                address (fetched from your latest mint request).
              </p>
            </div>
          )}

          {!isConnected ? (
            <ConnectButton.Custom>
              {({ account, chain, openConnectModal, mounted }) => {
                const ready = mounted;
                const connected = ready && account && chain;

                return (
                  <Button
                    onClick={openConnectModal}
                    className={`w-full h-12 text-lg bg-gradient-to-r ${baseGradientClass} ${hoverGradientClass} text-white`}
                  >
                    Connect Wallet
                  </Button>
                );
              }}
            </ConnectButton.Custom>
          ) : needsApproval ? (
            <Button
              onClick={handleApprove}
              disabled={
                isApproving ||
                isConfirmingApproval ||
                isInvalidAmount ||
                isZeroBalance ||
                isZeroAddress ||
                isWrongNetwork ||
                isInvalidNativeAddress
              }
              className={`w-full h-12 text-lg bg-gradient-to-r ${baseGradientClass} ${hoverGradientClass} text-white`}
            >
              {(isApproving || isConfirmingApproval) && (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              )}
              {isApproving
                ? "Confirm Approval in Wallet..."
                : isConfirmingApproval
                ? "Approving Tokens..."
                : `Approve ${vault.asset}`}
            </Button>
          ) : (
            <Button
              onClick={handleBurn}
              disabled={!canRedeem}
              className={`w-full h-12 text-lg bg-gradient-to-r ${baseGradientClass} ${hoverGradientClass} text-white`}
            >
              {(isWritePending || isConfirmingBurn || isSubmitting) && (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              )}
              {isWritePending
                ? "Confirm in Wallet..."
                : isConfirmingBurn
                ? "Burning Tokens..."
                : isSubmitting
                ? "Creating Redeem Request..."
                : `Redeem ${vault.nativeChainName}`}
            </Button>
          )}

          {writeError && (
            <Alert variant="destructive" className="mt-4">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                Transaction failed: {writeError.message}
              </AlertDescription>
            </Alert>
          )}
        </Card>

        {/* Breakdown Section */}
        <Card className="p-6">
          <CardTitle className="mb-4 text-xl">Breakdown</CardTitle>
          <div className="space-y-3 text-base">
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-1 text-muted-foreground">
                Collateral Price <Info className="h-4 w-4" />
              </span>
              <span className="font-semibold">
                {collateralPrice !== null
                  ? `$${collateralPrice.toFixed(2)}`
                  : "Loading..."}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-1 text-muted-foreground">
                Redemption Fees <Info className="h-4 w-4" />
              </span>
              <span className="font-semibold text-red-500">
                {redemptionFeePercentage}%
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-1 text-muted-foreground">
                Redemption Fee Amount <Info className="h-4 w-4" />
              </span>
              <span className="font-semibold">{redemptionFeeAmount}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-1 text-muted-foreground">
                Expected Collateral Received <Info className="h-4 w-4" />
              </span>
              <span className="font-semibold text-green-500">
                {expectedCollateralReceived}
              </span>
            </div>
          </div>
        </Card>

        {/* Process Info */}
        <Card>
          <CardHeader>
            <CardTitle>Redemption Process</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div className="flex items-center gap-3">
              <div className="w-6 h-6 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-xs font-bold">
                1
              </div>
              <span>
                Burn your t-{vault.asset} tokens on {vault.evmChain}
              </span>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-6 h-6 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-xs font-bold">
                2
              </div>
              <span>Submit redeem request</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-6 h-6 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-xs font-bold">
                3
              </div>
              <span>
                Receive native {vault.nativeChainName} tokens within 7 days
              </span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Success Modal */}
      <Dialog open={showSuccessModal} onOpenChange={setShowSuccessModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-500" />
              Redeem Request Submitted Successfully!
            </DialogTitle>
            <DialogDescription className="space-y-3 pt-2">
              <p>
                Your redeem request for{" "}
                <strong>
                  {amount} {vault.asset}
                </strong>{" "}
                has been submitted successfully.
              </p>
              <p>
                Native {vault.nativeChainName} tokens will be sent to your
                address within 7 days.
              </p>
              {burnTxHash && (
                <div className="flex items-center gap-2 text-sm">
                  <span>Burn Transaction:</span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      window.open(
                        `${vault.explorerUrl}/tx/${burnTxHash}`,
                        "_blank"
                      )
                    }
                  >
                    <ExternalLink className="h-3 w-3 mr-1" />
                    View
                  </Button>
                </div>
              )}
            </DialogDescription>
          </DialogHeader>
          <div className="flex gap-2 pt-4">
            <Button
              variant="outline"
              onClick={() => setShowSuccessModal(false)}
              className="flex-1"
            >
              Close
            </Button>
            <Button
              onClick={() => router.push("/redeem/requests")}
              className="flex-1"
            >
              View All Requests
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
