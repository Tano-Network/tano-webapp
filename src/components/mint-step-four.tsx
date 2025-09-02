"use client";

import { useEffect, useState } from "react";
import type { MintFormData } from "@/app/(app)/mint/page";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import {
  Loader2,
  Vault,
  CheckCircle,
  AlertTriangle,
  ExternalLink,
} from "lucide-react";
import { VAULTS } from "@/lib/constants";
import {
  useAccount,
  useWriteContract,
  useWaitForTransactionReceipt,
} from "wagmi";
import Testabi from "@/abi/test.json";
interface Props {
  formData: MintFormData;
  validationData: any;
  onBack: () => void;
  onComplete: () => void;
}

const ZERO_ADDRESS = "0x0000000000000000000000000000000000000000";

export function MintStepFour({
  formData,
  validationData,
  onBack,
  onComplete,
}: Props) {
  const { toast } = useToast();
  const { address } = useAccount();
  const vault = VAULTS.find((v) => v.id === formData.vaultId);
  const assetManagementAddress = vault?.assetManagementAddress;

  const [isMinting, setIsMinting] = useState(false);
  const [mintTxHash, setMintTxHash] = useState<string>("");
  const [mintingError, setMintingError] = useState<string | null>(null);
  const [isErrorExpanded, setIsErrorExpanded] = useState(false);

  const {
    writeContractAsync,
    data: hash,
    error,
    isPending,
  } = useWriteContract();

  const createMintRecord = async (status: string, txHash?: string) => {
    try {
      const response = await fetch("/api/mint-records", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          evmChainId: vault?.evmChainId,
          evmChain: vault?.evmChain,
          vaultId: formData.vaultId,
          vaultName: vault?.coinGeckoId,
          userAddress: address,
          userAddressNative: validationData.senderAddress,
          nativeTxHash: validationData.txHash,
          mintTxHash: txHash, // This will be undefined for "pending" status initially
          amount: validationData.amount,
          status: status,
          proofData: validationData.proof,
        }),
      });

      if (!response.ok) {
        throw new Error(`Failed to create mint record with status ${status}`);
      }
      return response.json(); // Return the created record
    } catch (error: any) {
      toast({
        title: "Record Creation Failed",
        description: error.message || "Failed to create mint record.",
        variant: "destructive",
      });
      throw error; // Re-throw to propagate the error
    }
  };

  const updateMintRecord = async (txHash: string) => {
    if (!txHash) return;

    try {
      await fetch("/api/mint-records/update", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nativeTxHash: validationData.txHash,
          status: "completed",
          mintTxHash: txHash,
        }),
      });

      toast({
        title: "Mint Record Created",
        description: "Your mint has been successfully recorded.",
      });
      onComplete();
    } catch (error) {
      // Error already toasted in createMintRecord
    } finally {
      setIsMinting(false);
    }
  };

  const {
    data: receipt,
    isLoading: isConfirming,
    isSuccess: isConfirmed,
    isError: isMintingError,
    error: mintingTxError,
  } = useWaitForTransactionReceipt({
    hash,
  });

  useEffect(() => {
    if (isConfirmed && receipt) {
      setMintTxHash(receipt.transactionHash);
      toast({
        title: "Transaction Confirmed!",
        description: (
          <a
            href={`${vault?.evmExplorerUrl}/tx/${receipt.transactionHash}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 underline hover:no-underline"
          >
            View on Explorer <ExternalLink className="h-3 w-3" />
          </a>
        ),
      });
      updateMintRecord(receipt.transactionHash);
    }
  }, [isConfirmed, receipt]);

  useEffect(() => {
    if (isMintingError && mintingTxError) {
      setMintingError(mintingTxError.message);
      toast({
        title: "Minting Failed",
        description: mintingTxError.message,
        variant: "destructive",
      });
      createMintRecord("failed"); // Call createMintRecord with "failed" status
      setIsMinting(false);
    }
  }, [isMintingError, mintingTxError]);

  const handleMint = async () => {
    setMintingError(null);
    setIsErrorExpanded(false);
    if (
      !assetManagementAddress ||
      assetManagementAddress === ZERO_ADDRESS ||
      !validationData?.proof ||
      !address
    ) {
      toast({
        title: "Missing Data or Contract Not Ready",
        description:
          "Required minting data is missing or the contract for this asset is not yet available. Please go back and validate again.",
        variant: "destructive",
      });
      return;
    }

    setIsMinting(true);
    // Create a pending mint record
    try {
      await createMintRecord("pending");
    } catch (error) {
      console.error("Failed to create pending mint record:", error);
      setIsMinting(false);
      return;
    }

    try {
      console.log("Minting with proof:", validationData);
      await writeContractAsync({
        address: assetManagementAddress as `0x${string}`,
        abi: Testabi,
        functionName: "mintWithZk",
        args: [
          validationData.proof || "0x",
          validationData.publicValues || "0x",
        ],
      });
    } catch (error: any) {
      console.error("Minting error:", error);
      setMintingError(error.message || "Failed to submit minting transaction.");
      toast({
        title: "Minting Failed",
        description: error.message || "Failed to submit minting transaction.",
        variant: "destructive",
      });
      setIsMinting(false);
    }
  };

  const isContractReady =
    assetManagementAddress && assetManagementAddress !== ZERO_ADDRESS;

  return (
    <div className="space-y-6">
      <Card className="border-2 border-purple-200 bg-purple-50/30 dark:border-purple-800 dark:bg-purple-950/30">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Vault className="h-5 w-5 text-purple-600" />
            Step 4: Mint Tokens
          </CardTitle>
          <CardDescription>
            Execute the smart contract minting with your validated proof
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <h4 className="font-medium">Vault Details</h4>
              <p className="text-sm text-muted-foreground">
                Name: {vault?.name}
              </p>
              <p className="text-sm text-muted-foreground">
                Chain: {vault?.evmChain}
              </p>
              <p className="text-sm text-muted-foreground">
                Contract: {assetManagementAddress}
              </p>
            </div>
            <div className="space-y-2">
              <h4 className="font-medium">Mint Details</h4>

              <p className="text-sm text-muted-foreground">
                Amount: {validationData.amount} {vault?.coin}
              </p>

              <p className="text-sm text-muted-foreground">
                Native Tx: {validationData.txHash.slice(0, 10)}...
              </p>
              <p className="text-sm text-muted-foreground">
                Sender: {validationData.senderAddress}
              </p>
            </div>
          </div>

          {!isContractReady && (
            <Alert className="border-yellow-200 bg-yellow-50 dark:border-yellow-800 dark:bg-yellow-950">
              <AlertTriangle className="h-4 w-4 text-yellow-600" />
              <AlertDescription className="text-yellow-800 dark:text-yellow-200">
                <strong>Contract Not Available:</strong> Minting for{" "}
                {vault?.name} is not yet enabled. Please check back later.
              </AlertDescription>
            </Alert>
          )}

          {isContractReady &&
            !mintingError &&
            !isConfirming &&
            !isConfirmed && (
              <Alert className="border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-950">
                <CheckCircle className="h-4 w-4 text-blue-600" />
                <AlertDescription className="text-blue-800 dark:text-blue-200">
                  <strong>Ready to Mint:</strong> Your transaction has been
                  validated and the zero-knowledge proof is ready. Click the
                  button below to execute the minting smart contract.
                </AlertDescription>
              </Alert>
            )}

          {mintingError && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription className="break-words">
                {mintingError.length > 100 ? (
                  isErrorExpanded ? (
                    <>
                      {mintingError}
                      <Button
                        variant="link"
                        className="p-0 h-auto ml-2"
                        onClick={() => setIsErrorExpanded(false)}
                      >
                        View Less
                      </Button>
                    </>
                  ) : (
                    <>
                      {`${mintingError.slice(0, 100)}... `}
                      <Button
                        variant="link"
                        className="p-0 h-auto"
                        onClick={() => setIsErrorExpanded(true)}
                      >
                        View More
                      </Button>
                    </>
                  )
                ) : (
                  mintingError
                )}
              </AlertDescription>
            </Alert>
          )}

          {isConfirming && (
            <Alert className="border-orange-200 bg-orange-50 dark:border-orange-800 dark:bg-orange-950">
              <Loader2 className="h-4 w-4 text-orange-600 animate-spin" />
              <AlertDescription className="text-orange-800 dark:text-orange-200">
                <strong>Transaction Submitted:</strong> Waiting for
                confirmation...
                <br />
                <a
                  href={`${vault?.evmExplorerUrl}/tx/${hash}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 underline hover:no-underline"
                >
                  View on Explorer <ExternalLink className="h-3 w-3" />
                </a>
              </AlertDescription>
            </Alert>
          )}

          {isConfirmed && (
            <Alert className="border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-950">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <AlertDescription className="text-green-800 dark:text-green-200">
                <strong>Transaction Confirmed!</strong>

                <br />
                <a
                  href={`${vault?.evmExplorerUrl}/tx/${hash}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 underline hover:no-underline"
                >
                  View on Explorer <ExternalLink className="h-3 w-3" />
                </a>
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      <div className="flex flex-col sm:flex-row gap-2">
        <Button
          variant="outline"
          onClick={onBack}
          disabled={isMinting || isPending || isConfirming}
        >
          Back
        </Button>
        <Button
          onClick={handleMint}
          disabled={
            !isContractReady ||
            isMinting ||
            isPending ||
            isConfirming ||
            isConfirmed
          }
          className="flex-1 bg-purple-600 hover:bg-purple-700"
        >
          {(isPending || isConfirming) && (
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          )}
          {isPending
            ? "Confirm in Wallet..."
            : isConfirming
            ? "Confirming..."
            : isConfirmed
            ? "Completed!"
            : mintingError
            ? "Try Again"
            : "Mint Tokens"}
        </Button>
      </div>
    </div>
  );
}
