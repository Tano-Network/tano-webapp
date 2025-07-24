"use client";
import { use, useEffect, useState } from "react";
import { ZeroAddress, Contract } from "ethers";
import Link from "next/link";
import {
  CheckCircle2,
  ExternalLink,
  ArrowLeft,
  Loader2,
  AlertTriangle,
  Info,
} from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { waitForTransactionReceipt } from "@wagmi/core";
import { readContract, writeContract } from "wagmi/actions";
import { config } from "@/lib/wagmiConfig"; // your wagmi config
import { useWriteContract, useReadContract } from "wagmi";
import { parseUnits, formatUnits } from "viem";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import earnStakingAbi from "@/abi/earnStaking.json"; // New ABI for staking
import assetAbi from "@/abi/asset.json"; // ABI for ERC20 token (tDOGE)
import { cn } from "@/lib/utils";
import { useAccount, useChainId } from "wagmi";
import {
  CONTRACT_ADDRESSES,
  EXPLORER_URLS,
  SUPPORTED_CHAINS,
} from "@/lib/constants";
import { LoadingSpinner } from "@/components/LoadingSpinner"; // Import LoadingSpinner

interface EarnParams {
  id: string;
}

/**
 * Returns the earn pool data for a given id.
 * If the id is not found, a default object is returned with placeholder values.
 *
 * @param id - The id of the earn pool (e.g., "doge", "litecoin", etc.)
 * @returns An object containing the earn pool data
 */
const getEarnPoolData = (id: string) => {
  const earnPools: Record<
    string,
    {
      asset: string;
      icon: string;
      contractAddress: string; // Staking pool contract
      stakingTokenAddress: string; // The token being staked (e.g., tDOGE)
      color: string;
      description: string;
    }
  > = {
    doge: {
      asset: "tDOGE",
      icon: "Ð",
      contractAddress:
        CONTRACT_ADDRESSES[SUPPORTED_CHAINS.SEPOLIA].TDOGE_STAKING_POOL,
      stakingTokenAddress:
        CONTRACT_ADDRESSES[SUPPORTED_CHAINS.SEPOLIA].TDOGE_TOKEN,
      color: "from-yellow-500 to-orange-500",
      description: "Stake your tDOGE to earn rewards",
    },
    litecoin: {
      asset: "tLTC",
      icon: "Ł",
      contractAddress:
        CONTRACT_ADDRESSES[SUPPORTED_CHAINS.SEPOLIA].TLTC_STAKING_POOL,
      stakingTokenAddress:
        CONTRACT_ADDRESSES[SUPPORTED_CHAINS.SEPOLIA].TLTC_TOKEN,
      color: "from-gray-400 to-gray-600",
      description: "Stake your tLTC to earn rewards",
    },
    bitcoin_cash: {
      asset: "tBCH",
      icon: "₿",
      contractAddress:
        CONTRACT_ADDRESSES[SUPPORTED_CHAINS.SEPOLIA].TBCH_STAKING_POOL,
      stakingTokenAddress:
        CONTRACT_ADDRESSES[SUPPORTED_CHAINS.SEPOLIA].TBCH_TOKEN,
      color: "from-green-500 to-emerald-600",
      description: "Stake your tBCH to earn rewards",
    },
  };
  return (
    earnPools[id] || {
      asset: "Unknown",
      icon: "?",
      contractAddress: "0x0000000000000000000000000000000000000000",
      stakingTokenAddress: "0x0000000000000000000000000000000000000000",
      color: "from-gray-400 to-gray-600",
      description: "Unknown earn pool",
    }
  );
};

export default function EarnPoolPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  // Safely access params.id
  const { id } = use(params);
  const poolId = typeof id === "string" ? id : "";
  const pool = getEarnPoolData(poolId);
  const { address, isConnected } = useAccount();
  const chainId = useChainId();
  const { toast } = useToast();
  const [depositAmount, setDepositAmount] = useState("");
  const [withdrawAmount, setWithdrawAmount] = useState("");
  const [mode, setMode] = useState<"deposit" | "withdraw">("deposit");
  const [stakedBalance, setStakedBalance] = useState<bigint>(BigInt(0));
  const [totalStaked, setTotalStaked] = useState<bigint>(BigInt(0));
  const [tokenBalance, setTokenBalance] = useState<bigint>(BigInt(0));
  const [tokenAllowance, setTokenAllowance] = useState<bigint>(BigInt(0));
  const { writeContractAsync } = useWriteContract();
  const [isProcessing, setIsProcessing] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [modalContent, setModalContent] = useState<{
    title: string;
    description: string;
    isSuccess: boolean;
    txHash?: string;
  }>({ title: "", description: "", isSuccess: false });

  const [isLoading, setIsLoading] = useState(true);
  const [pageError, setPageError] = useState<string | null>(null); // Renamed to avoid conflict with 'error' in modal

  // Check if we're on Sepolia testnet
  const isCorrectNetwork = chainId === SUPPORTED_CHAINS.SEPOLIA;
  const explorerUrl =
    EXPLORER_URLS[chainId as keyof typeof EXPLORER_URLS] ||
    EXPLORER_URLS[SUPPORTED_CHAINS.SEPOLIA];

  // Handle invalid pool ID early
  useEffect(() => {
    if (!poolId || pool.asset === "Unknown") {
      setPageError(
        "Invalid earn pool ID. Please go back to the Earn Dashboard."
      );
      setIsLoading(false);
    }
  }, [poolId, pool.asset]);

  useEffect(() => {
    /**
     * Connects to the Ethereum network and performs necessary checks for the earn pool.
     *
     * - Ensures the user's wallet is connected and on the correct network (Sepolia testnet).
     * - Verifies the pool's contract and token addresses are valid and active.
     * - Reads from the pool's staking contract and token contract to ensure they are accessible.
     * - Updates the page error state based on any issues encountered during the connection process.
     *
     * Throws:
     * - Sets an error message if MetaMask or another Web3 wallet is not installed.
     * - Sets an error message if the wallet is not connected.
     * - Sets an error message if the user is not on the Sepolia testnet.
     * - Sets an error message if the earn pool is not active or has an invalid contract address.
     * - Sets an error message if there are issues reading from the contracts.
     */

    const connect = async () => {
      if (pageError) return;

      try {
        if (!window.ethereum) {
          setPageError("Please install MetaMask or another Web3 wallet");
          return;
        }

        if (!isConnected || !address) {
          setPageError("Please connect your wallet");
          return;
        }

        if (!isCorrectNetwork) {
          setPageError(
            `Please switch to Sepolia testnet (Chain ID: ${SUPPORTED_CHAINS.SEPOLIA})`
          );
          return;
        }

        if (
          !pool.contractAddress ||
          pool.contractAddress === "0x0000000000000000000000000000000000000000"
        ) {
          setPageError(
            "This earn pool is not yet active or has an invalid contract address."
          );
          return;
        }

        // Read-only contract check (e.g. totalStaked or name)
        await readContract(config, {
          address: pool.contractAddress as `0x${string}`,
          abi: earnStakingAbi,
          functionName: "totalStaked", // or any view function
        });

        // Check ERC20 token contract is readable
        await readContract(config, {
          address: pool.stakingTokenAddress as `0x${string}`,
          abi: assetAbi,
          functionName: "decimals",
        });

        setPageError(null);
      } catch (err) {
        console.error("Contract read error:", err);
        setPageError(
          "Failed to read from contracts. Ensure correct network and contract setup."
        );
      }
    };

    connect();
  }, [
    pool.contractAddress,
    pool.stakingTokenAddress,
    isConnected,
    address,
    isCorrectNetwork,
    pageError,
  ]);

  useEffect(() => {
    /**
     * Fetches and updates the state of the earn pool page.
     *
     * - Reads the following data from the earn pool's staking contract and token contract:
     *   - The user's staked balance.
     *   - The total amount staked in the pool.
     *   - The user's token balance.
     *   - The amount of tokens the user has approved for staking.
     * - Updates the page state based on the data fetched.
     * - Sets an error message if there are any issues fetching the data.
     * - Automatically called when the component mounts and when the user switches between deposit and withdraw modes.
     *
     * Returns a Promise that resolves to void.
     */
    const fetchState = async () => {
      if (
        !address ||
        !isCorrectNetwork ||
        pageError ||
        !pool.contractAddress ||
        !pool.stakingTokenAddress ||
        pool.contractAddress === "0x0000000000000000000000000000000000000000" ||
        pool.stakingTokenAddress ===
          "0x0000000000000000000000000000000000000000"
      ) {
        setIsLoading(false);
        return;
      }

      setIsLoading(true);

      try {
        const [stakedBal, totalStakedAmt, tokenBal, tokenAllow] =
          await Promise.all([
            readContract(config, {
              address: pool.contractAddress as `0x${string}`,
              abi: earnStakingAbi,
              functionName: "getStakedBalance",
              args: [address],
            }),
            readContract(config, {
              address: pool.contractAddress as `0x${string}`,
              abi: earnStakingAbi,
              functionName: "totalStaked",
            }),
            readContract(config, {
              address: pool.stakingTokenAddress as `0x${string}`,
              abi: assetAbi,
              functionName: "balanceOf",
              args: [address],
            }),
            readContract(config, {
              address: pool.stakingTokenAddress as `0x${string}`,
              abi: assetAbi,
              functionName: "allowance",
              args: [address, pool.contractAddress],
            }),
          ]);

        setStakedBalance(stakedBal as bigint);
        setTotalStaked(totalStakedAmt as bigint);
        setTokenBalance(tokenBal as bigint);
        setTokenAllowance(tokenAllow as bigint);
        setPageError(null);
      } catch (err) {
        console.error("Fetch error:", err);
        setPageError(
          "Failed to fetch earn pool data. Please ensure you are on Sepolia testnet and contracts are deployed."
        );
      } finally {
        setIsLoading(false);
      }
    };

    fetchState();
  }, [
    address,
    isCorrectNetwork,
    pageError,
    pool.contractAddress,
    pool.stakingTokenAddress,
  ]);

  /**
   * Refreshes the state of the staking pool by fetching the latest data from the contract.
   * Called after deposit/withdrawal transactions.
   * @returns {Promise<void>}
   */
  const refreshState = async () => {
    try {
      const [stakedBal, totalStakedAmt, tokenBal, tokenAllow] =
        await Promise.all([
          readContract(config, {
            address: pool.contractAddress as `0x${string}`,
            abi: earnStakingAbi,
            functionName: "getStakedBalance",
            args: [address!],
          }),
          readContract(config, {
            address: pool.contractAddress as `0x${string}`,
            abi: earnStakingAbi,
            functionName: "totalStaked",
          }),
          readContract(config, {
            address: pool.stakingTokenAddress as `0x${string}`,
            abi: assetAbi,
            functionName: "balanceOf",
            args: [address!],
          }),
          readContract(config, {
            address: pool.stakingTokenAddress as `0x${string}`,
            abi: assetAbi,
            functionName: "allowance",
            args: [address!, pool.contractAddress],
          }),
        ]);

      setStakedBalance(stakedBal as bigint);
      setTotalStaked(totalStakedAmt as bigint);
      setTokenBalance(tokenBal as bigint);
      setTokenAllowance(tokenAllow as bigint);
    } catch (err) {
      console.error("refreshState error:", err);
      toast({
        title: "Error Refreshing State",
        description: "Could not refresh staking data. Please try again.",
        variant: "destructive",
      });
    }
  };

  /**
   * Handles the token approval process for staking.
   *
   * - Validates the deposit amount and network.
   * - Initiates token approval for staking by sending a transaction to the blockchain.
   * - Provides feedback to the user through modals and toasts.
   * - Updates the token allowance state upon successful approval.
   * - Sets processing state and handles errors gracefully.
   *
   * Preconditions:
   * - The user must be connected to the correct network (Sepolia testnet).
   * - A valid deposit amount must be provided by the user.
   *
   * Postconditions:
   * - The token approval transaction is submitted and confirmed.
   * - The token allowance state is updated based on the new approval.
   * - User is notified of success or failure of the approval process.
   */

  const handleApprove = async () => {
    if (!depositAmount || Number.parseFloat(depositAmount) <= 0) {
      toast({
        title: "Invalid Amount",
        description: "Please enter a valid amount to approve",
        variant: "destructive",
      });
      return;
    }
    if (!isCorrectNetwork) {
      toast({
        title: "Wrong Network",
        description: "Please switch to Sepolia testnet",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsProcessing(true);
      setShowModal(true);
      setModalContent({
        title: "Approving Token",
        description: `Please confirm approval for ${pool.asset}...`,
        isSuccess: false,
      });

      const amountBigInt = parseUnits(depositAmount, 18);

      const hash = await writeContractAsync({
        address: pool.stakingTokenAddress as `0x${string}`,
        abi: assetAbi,
        functionName: "approve",
        args: [pool.contractAddress, amountBigInt],
      });

      setModalContent({
        title: "Approval Submitted",
        description: "Waiting for confirmation...",
        isSuccess: false,
      });
      await waitForTransactionReceipt(config, {
        hash: hash as `0x${string}`,
        confirmations: 1,
      });

      toast({
        title: "Success",
        description: `Approved ${depositAmount} ${pool.asset}`,
      });
      setModalContent({
        title: "Approval Successful",
        description: `Approved ${depositAmount} ${pool.asset}`,
        isSuccess: true,
        txHash: hash,
      });

      const newAllowance = await readContract(config, {
        address: pool.stakingTokenAddress as `0x${string}`,
        abi: assetAbi,
        functionName: "allowance",
        args: [address!, pool.contractAddress],
      });
      setTokenAllowance(newAllowance as bigint);
    } catch (err) {
      handleError("Approval", err);
    } finally {
      setIsProcessing(false);
    }
  };

  /**
   * Handles depositing tokens to the earn pool
   *
   * If the user does not have enough tokens in their wallet, or if the user does not have enough allowance, toast an error
   *
   * If the user is not on the correct network, toast an error
   *
   * If the user confirms the deposit, wait for the transaction to be confirmed and then toast success
   *
   * If the user cancels the deposit, do nothing
   *
   * @param {string} depositAmount - the amount of tokens to deposit
   */
  const handleDeposit = async () => {
    if (!depositAmount || Number.parseFloat(depositAmount) <= 0) {
      toast({
        title: "Invalid Amount",
        description: "Please enter a valid amount to deposit",
        variant: "destructive",
      });
      return;
    }
    if (!isCorrectNetwork) {
      toast({
        title: "Wrong Network",
        description: "Please switch to Sepolia testnet",
        variant: "destructive",
      });
      return;
    }
    const amountBigInt = parseUnits(depositAmount, 18);
    if (amountBigInt > tokenBalance) return toastErr("Insufficient balance");
    if (amountBigInt > tokenAllowance)
      return toastErr("Insufficient allowance");

    try {
      setIsProcessing(true);
      setShowModal(true);
      setModalContent({
        title: "Deposit Pending",
        description: "Confirm the transaction...",
        isSuccess: false,
      });

      const hash = await writeContractAsync({
        address: pool.contractAddress as `0x${string}`,
        abi: earnStakingAbi,
        functionName: "deposit",
        args: [amountBigInt],
      });

      setModalContent({
        title: "Submitted",
        description: "Waiting for confirmation...",
        isSuccess: false,
      });
      await waitForTransactionReceipt(config, {
        hash: hash as `0x${string}`,
        confirmations: 1,
      });

      toast({
        title: "Success",
        description: `Deposited ${depositAmount} ${pool.asset}`,
      });
      setModalContent({
        title: "Deposit Successful",
        description: `Deposited ${depositAmount} ${pool.asset}`,
        isSuccess: true,
        txHash: hash,
      });
      setDepositAmount("");

      await refreshState();
    } catch (err) {
      handleError("Deposit", err);
    } finally {
      setIsProcessing(false);
    }
  };

  /**
   * Handles withdrawing tokens from the earn pool
   *
   * If the user does not have enough staked tokens, toast an error
   *
   * If the user is not on the correct network, toast an error
   *
   * If the user confirms the withdrawal, wait for the transaction to be confirmed and then toast success
   *
   * If the user cancels the withdrawal, do nothing
   *
   * @param {string} withdrawAmount - the amount of tokens to withdraw
   */
  const handleWithdraw = async () => {
    if (!withdrawAmount || Number.parseFloat(withdrawAmount) <= 0) {
      toast({
        title: "Invalid Amount",
        description: "Please enter a valid amount to withdraw",
        variant: "destructive",
      });
      return;
    }
    if (!isCorrectNetwork) {
      toast({
        title: "Wrong Network",
        description: "Please switch to Sepolia testnet",
        variant: "destructive",
      });
      return;
    }
    const amountBigInt = parseUnits(withdrawAmount, 18);
    if (amountBigInt > stakedBalance)
      return toastErr("Insufficient staked balance");

    try {
      setIsProcessing(true);
      setShowModal(true);
      setModalContent({
        title: "Withdraw Pending",
        description: "Confirm withdrawal...",
        isSuccess: false,
      });

      const hash = await writeContractAsync({
        address: pool.contractAddress as `0x${string}`,
        abi: earnStakingAbi,
        functionName: "withdraw",
        args: [amountBigInt],
      });

      setModalContent({
        title: "Submitted",
        description: "Waiting for confirmation...",
        isSuccess: false,
      });
      await waitForTransactionReceipt(config, {
        hash: hash as `0x${string}`,
        confirmations: 1,
      });

      toast({
        title: "Success",
        description: `Withdrew ${withdrawAmount} ${pool.asset}`,
      });
      setModalContent({
        title: "Withdraw Successful",
        description: `Withdrew ${withdrawAmount} ${pool.asset}`,
        isSuccess: true,
        txHash: hash,
      });
      setWithdrawAmount("");

      await refreshState();
    } catch (err) {
      handleError("Withdraw", err);
    } finally {
      setIsProcessing(false);
    }
  };

  // Helpers
  function toastErr(message: string) {
    toast({ title: "Error", description: message, variant: "destructive" });
  }

  /**
   * Handles errors by logging them, setting modal content with an appropriate message,
   * and displaying a toast notification. Specific error messages are provided for user
   * rejection and insufficient funds scenarios.
   *
   * @param {string} type - The operation type that failed (e.g., 'Withdraw', 'Deposit').
   * @param {any} err - The error object containing information about the failure.
   */

  function handleError(type: string, err: any) {
    console.error(`${type} error:`, err);
    let message = `${type} failed`;
    if (err?.message?.includes("user rejected"))
      message = `${type} was cancelled`;
    else if (err?.message?.includes("insufficient funds"))
      message = "Insufficient funds for gas";
    else if (err?.message) message = err.message;

    setModalContent({
      title: `${type} Failed`,
      description: message,
      isSuccess: false,
    });
    toast({
      title: `${type} Failed`,
      description: message,
      variant: "destructive",
    });
  }

  const formattedStakedBalance = Number(formatUnits(stakedBalance, 18)).toFixed(
    4
  );
  const formattedTokenBalance = Number(formatUnits(tokenBalance, 18)).toFixed(
    4
  );
  const formattedTotalStaked = Number(formatUnits(totalStaked, 18)).toFixed(4);
  const formattedTokenAllowance = Number(
    formatUnits(tokenAllowance, 18)
  ).toFixed(4);

  const usagePercentage =
    Number(formatUnits(totalStaked, 18)) > 0
      ? (Number(formatUnits(stakedBalance, 18)) /
          Number(formatUnits(totalStaked, 18))) *
        100
      : 0;

  // Render loading state if data is still being fetched or if poolId is invalid
  if (isLoading || !poolId || pool.asset === "Unknown") {
    return (
      <div className="container mx-auto p-4 max-w-2xl flex flex-col items-center justify-center min-h-[60vh]">
        <LoadingSpinner size="lg" />
        <div className="mt-4 text-muted-foreground">
          {pageError ||
            (poolId ? "Loading earn pool data..." : "Invalid pool ID...")}
        </div>
        {pageError && (
          <Button asChild variant="outline" className="mt-6 bg-transparent">
            <Link href="/earn">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Earn Pools
            </Link>
          </Button>
        )}
      </div>
    );
  }

  if (!isConnected) {
    return (
      <div className="container mx-auto p-4 max-w-2xl">
        <Alert variant="destructive" className="mb-4">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            Please connect your wallet to access this earn pool
          </AlertDescription>
        </Alert>
        <Button asChild variant="outline">
          <Link href="/earn">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Earn Pools
          </Link>
        </Button>
      </div>
    );
  }

  if (!isCorrectNetwork) {
    return (
      <div className="container mx-auto p-4 max-w-2xl">
        <Alert variant="destructive" className="mb-4">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            Please switch to Sepolia testnet to use this earn pool. Current
            network: {chainId}
          </AlertDescription>
        </Alert>
        <Button asChild variant="outline">
          <Link href="/earn">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Earn Pools
          </Link>
        </Button>
      </div>
    );
  }

  if (pageError) {
    // Display specific page errors
    return (
      <div className="container mx-auto p-4 max-w-2xl">
        <Alert variant="destructive" className="mb-4">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>{pageError}</AlertDescription>
        </Alert>
        <Button asChild variant="outline">
          <Link href="/earn">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Earn Pools
          </Link>
        </Button>
      </div>
    );
  }

  const needsApproval =
    mode === "deposit" &&
    Number.parseFloat(depositAmount) > 0 &&
    parseUnits(depositAmount, 18) > tokenAllowance;

  return (
    <div className="container mx-auto p-4 max-w-4xl">
      <Button asChild variant="outline" className="mb-6 bg-transparent">
        <Link href="/earn">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Earn Pools
        </Link>
      </Button>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Earn Card */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <div className="flex items-center gap-4">
                <div
                  className={cn(
                    "w-12 h-12 bg-gradient-to-br text-white rounded-full flex items-center justify-center text-xl font-bold",
                    pool.color
                  )}
                >
                  {pool.icon}
                </div>
                <div>
                  <CardTitle className="text-2xl">Stake {pool.asset}</CardTitle>
                  <CardDescription>{pool.description}</CardDescription>
                </div>
                <Badge variant="default" className="ml-auto">
                  Sepolia Testnet
                </Badge>
              </div>
            </CardHeader>

            <CardContent className="space-y-6">
              {/* Mode Toggle */}
              <div className="flex bg-secondary/30 rounded-lg p-1">
                <button
                  onClick={() => setMode("deposit")}
                  className={cn(
                    "w-1/2 py-3 rounded-md font-semibold transition-all duration-200",
                    mode === "deposit"
                      ? "bg-primary text-primary-foreground shadow-sm"
                      : "text-muted-foreground hover:bg-secondary/50"
                  )}
                  disabled={isLoading || isProcessing}
                >
                  Deposit
                </button>
                <button
                  onClick={() => setMode("withdraw")}
                  className={cn(
                    "w-1/2 py-3 rounded-md font-semibold transition-all duration-200",
                    mode === "withdraw"
                      ? "bg-primary text-primary-foreground shadow-sm"
                      : "text-muted-foreground hover:bg-secondary/50"
                  )}
                  disabled={isLoading || isProcessing}
                >
                  Withdraw
                </button>
              </div>

              {/* Input Section */}
              <div className="space-y-4">
                {mode === "deposit" ? (
                  <div className="space-y-2">
                    <Label
                      htmlFor="deposit-amount"
                      className="text-base font-medium"
                    >
                      Amount to Deposit
                    </Label>
                    <div className="relative mt-2">
                      <Input
                        id="deposit-amount"
                        type="number"
                        placeholder="0.0"
                        value={depositAmount}
                        onChange={(e) => setDepositAmount(e.target.value)}
                        className="text-lg h-12 pr-20"
                        disabled={isLoading || isProcessing}
                        step="0.01"
                        min="0"
                        max={formattedTokenBalance}
                      />
                      <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-2">
                        <span className="text-muted-foreground font-medium">
                          {pool.asset}
                        </span>
                      </div>
                    </div>
                    <div className="flex justify-between mt-2 text-sm text-muted-foreground">
                      <span>
                        Available: {formattedTokenBalance} {pool.asset}
                      </span>
                      <Button
                        variant="link"
                        size="sm"
                        className="h-auto p-0"
                        onClick={() => setDepositAmount(formattedTokenBalance)}
                        disabled={
                          isLoading ||
                          isProcessing ||
                          Number(formattedTokenBalance) === 0
                        }
                      >
                        Max
                      </Button>
                    </div>
                    {needsApproval && (
                      <Alert className="mt-4 border-yellow-500/50 text-yellow-600 dark:text-yellow-300 bg-yellow-50 dark:bg-yellow-950/20">
                        <Info className="h-4 w-4" />
                        <AlertDescription>
                          You need to approve the staking pool to spend your{" "}
                          {pool.asset} before depositing.
                        </AlertDescription>
                      </Alert>
                    )}
                  </div>
                ) : (
                  <div className="space-y-2">
                    <Label
                      htmlFor="withdraw-amount"
                      className="text-base font-medium"
                    >
                      Amount to Withdraw
                    </Label>
                    <div className="relative mt-2">
                      <Input
                        id="withdraw-amount"
                        type="number"
                        placeholder="0.0"
                        value={withdrawAmount}
                        onChange={(e) => setWithdrawAmount(e.target.value)}
                        className="text-lg h-12 pr-20"
                        disabled={isLoading || isProcessing}
                        step="0.01"
                        min="0"
                        max={formattedStakedBalance}
                      />
                      <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-2">
                        <span className="text-muted-foreground font-medium">
                          {pool.asset}
                        </span>
                      </div>
                    </div>
                    <div className="flex justify-between mt-2 text-sm text-muted-foreground">
                      <span>
                        Staked: {formattedStakedBalance} {pool.asset}
                      </span>
                      <Button
                        variant="link"
                        size="sm"
                        className="h-auto p-0"
                        onClick={() =>
                          setWithdrawAmount(formattedStakedBalance)
                        }
                        disabled={
                          isLoading ||
                          isProcessing ||
                          Number(formattedStakedBalance) === 0
                        }
                      >
                        Max
                      </Button>
                    </div>
                  </div>
                )}

                {mode === "deposit" && needsApproval ? (
                  <Button
                    onClick={handleApprove}
                    disabled={
                      !depositAmount ||
                      Number.parseFloat(depositAmount) <= 0 ||
                      isProcessing ||
                      isLoading ||
                      parseUnits(depositAmount, 18) > tokenBalance
                    }
                    className="w-full h-12 text-base"
                    size="lg"
                  >
                    {isProcessing ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Approving...
                      </>
                    ) : (
                      `Approve ${pool.asset}`
                    )}
                  </Button>
                ) : (
                  <Button
                    onClick={
                      mode === "deposit" ? handleDeposit : handleWithdraw
                    }
                    disabled={
                      isProcessing ||
                      isLoading ||
                      (mode === "deposit" &&
                        (!depositAmount ||
                          Number.parseFloat(depositAmount) <= 0 ||
                          parseUnits(depositAmount, 18) > tokenBalance ||
                          parseUnits(depositAmount, 18) > tokenAllowance)) ||
                      (mode === "withdraw" &&
                        (!withdrawAmount ||
                          Number.parseFloat(withdrawAmount) <= 0 ||
                          parseUnits(withdrawAmount, 18) > stakedBalance))
                    }
                    className="w-full h-12 text-base"
                    size="lg"
                  >
                    {isProcessing ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Processing...
                      </>
                    ) : mode === "deposit" ? (
                      `Deposit ${pool.asset}`
                    ) : (
                      `Withdraw ${pool.asset}`
                    )}
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Stats Sidebar */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Your Stats</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {isLoading ? (
                <div className="space-y-3">
                  {[...Array(4)].map((_, i) => (
                    <div key={i} className="space-y-2">
                      <div className="h-3 bg-muted rounded animate-pulse" />
                      <div className="h-4 bg-muted rounded animate-pulse w-2/3" />
                    </div>
                  ))}
                </div>
              ) : (
                <>
                  <div>
                    <div className="text-sm text-muted-foreground">
                      Your Staked Balance
                    </div>
                    <div className="text-lg font-semibold">
                      {formattedStakedBalance} {pool.asset}
                    </div>
                  </div>

                  <div>
                    <div className="text-sm text-muted-foreground">
                      Your Wallet Balance
                    </div>
                    <div className="text-lg font-semibold">
                      {formattedTokenBalance} {pool.asset}
                    </div>
                  </div>

                  <div>
                    <div className="text-sm text-muted-foreground">
                      Approved Allowance
                    </div>
                    <div className="text-lg font-semibold">
                      {formattedTokenAllowance} {pool.asset}
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between text-sm mb-2">
                      <span className="text-muted-foreground">
                        Your Share of Pool
                      </span>
                      <span className="font-medium">
                        {usagePercentage.toFixed(1)}%
                      </span>
                    </div>
                    <Progress value={usagePercentage} className="h-2" />
                    <div className="text-xs text-muted-foreground mt-1">
                      {formattedStakedBalance} / {formattedTotalStaked} staked
                    </div>
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Pool Info</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Asset</span>
                <span className="font-medium">{pool.asset}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Total Staked</span>
                <span className="font-medium">
                  {formattedTotalStaked} {pool.asset}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Network</span>
                <span className="font-medium">Sepolia Testnet</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Contract</span>
                <span className="font-mono text-xs">
                  {pool.contractAddress.slice(0, 6)}...
                  {pool.contractAddress.slice(-4)}
                </span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <AlertDialog open={showModal} onOpenChange={setShowModal}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{modalContent.title}</AlertDialogTitle>
            <AlertDialogDescription>
              <span className="flex flex-col items-center mt-4 gap-3 max-w-full">
                {!modalContent.isSuccess ? (
                  <Loader2 className="w-10 h-10 animate-spin text-primary" />
                ) : (
                  <CheckCircle2 size={40} className="text-green-500" />
                )}
                <span className="text-center break-words overflow-hidden">
                  {modalContent.description}
                </span>
                {modalContent.isSuccess && modalContent.txHash && (
                  <Button asChild variant="outline" size="sm">
                    <a
                      href={`${explorerUrl}/tx/${modalContent.txHash}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2"
                    >
                      View on Etherscan <ExternalLink size={14} />
                    </a>
                  </Button>
                )}
              </span>
            </AlertDialogDescription>
          </AlertDialogHeader>
          {modalContent.isSuccess && (
            <AlertDialogFooter>
              <AlertDialogAction onClick={() => setShowModal(false)}>
                Close
              </AlertDialogAction>
            </AlertDialogFooter>
          )}
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
