'use client';
import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { parseUnits, formatUnits} from 'viem';
import { CheckCircle2, ArrowLeft, XCircle } from 'lucide-react';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { useAccount, useWriteContract, useWaitForTransactionReceipt, useReadContract } from 'wagmi';
import { useParams } from 'next/navigation';

import { AlertDialog, AlertDialogContent, AlertDialogDescription, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

// ABIs for different vaults
import DogeAssetManagerABI from '../../../../utils/abi/dogecoin/AssetManagerABI.json';
import LitecoinAssetManagerABI from '../../../../utils/abi/litecoin/AssetManagerABI.json';

// --- Type Definition for Vault Configuration ---
type VaultConfig = {
    assetManagerContract: `0x${string}`;
    assetManagerABI: any;
    asset: string;
    icon: string;
};

// --- Dynamic Configuration for Vaults ---
const VAULT_CONFIG: Record<string, VaultConfig> = {
    doge: {
        assetManagerContract: '0x6183367a204F2E2E9638d2ee5fDb281dB6f42F48', // Example address for Doge
        assetManagerABI: DogeAssetManagerABI,
        asset: 'tDOGE',
        icon: 'Ð',
    },
    litecoin: {
        assetManagerContract: '0xA4F45B2628f2cFac02d2E8f3C2267e87c5e02BFf', // Example address for Litecoin
        assetManagerABI: LitecoinAssetManagerABI,
        asset: 'tLTC',
        icon: '₿',
    },
};


const getRpcErrorMessage = (error: any): string => {
    if (error?.shortMessage) {
        return error.shortMessage;
    }
    return 'An unknown error occurred. Please try again.';
};

// --- Success Card Component ---
const MintSuccessCard = ({ amount, asset, onMintAgain, onViewTx }: {
    amount: string;
    asset: string;
    onMintAgain: () => void;
    onViewTx: () => void;
}) => (
    <div className="bg-background/70 border border-border rounded-2xl p-6 shadow-xl text-center animate-fade-in">
        <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle2 size={32} className="text-green-400" />
        </div>
        <h2 className="text-2xl font-bold text-foreground">Mint Successful!</h2>
      <p className="text-muted-foreground mt-2 mb-6">
  You successfully minted {amount} {asset}.
</p>
        <div className="flex flex-col gap-3">
             <Button onClick={onViewTx}>
                 View Transaction
            </Button>
            <Button variant="outline" onClick={onMintAgain}>
                Mint More
            </Button>
        </div>
    </div>
);


export default function VaultDepositPage() {
    const { id } = useParams<{ id: string }>();
    const config = VAULT_CONFIG[id] || VAULT_CONFIG.doge; // Get config based on URL, fallback to doge

    // --- Component State ---
    const [amount, setAmount] = useState('');
    const [showModal, setShowModal] = useState(false);
    const [modalContent, setModalContent] = useState({ title: '', description: '' });
    const [lastMintedAmount, setLastMintedAmount] = useState('');
    const [showSuccessCard, setShowSuccessCard] = useState(false);

    // --- Hooks ---
    const { address, isConnected } = useAccount();
    const { data: hash, error, writeContract, isPending } = useWriteContract();
    const { isLoading: isConfirming, isSuccess: isConfirmed } = useWaitForTransactionReceipt({ hash });

    const { data: isWhitelisted, isLoading: isCheckingWhitelist } = useReadContract({
        address: config.assetManagerContract,
        abi: config.assetManagerABI,
        functionName: 'isWhitelisted',
        args: address?[address]:undefined,
        query: { enabled: isConnected && !!address },
    });

    const { data: mintableAmountRaw, refetch: refetchMintableAmount } = useReadContract({
        address: config.assetManagerContract,
        abi: config.assetManagerABI,
        functionName: 'getMintableAmount',
        args: address?[address]:undefined,
        query: { enabled: isConnected && !!address && isWhitelisted === true },
    });

    const formattedMintableAmount = useMemo(() => {
        if (typeof mintableAmountRaw === 'bigint') {
            return formatUnits(mintableAmountRaw, 18);
        }
        return '0';
    }, [mintableAmountRaw]);

    const isAmountInvalid = useMemo(() => {
        if (!amount || typeof mintableAmountRaw !== 'bigint') return false;
        try {
            return parseUnits(amount, 18) > mintableAmountRaw;
        } catch {
            return true;
        }
    }, [amount, mintableAmountRaw]);

    // --- Event Handlers ---
    const handleMint = () => {
        if (isWhitelisted === false) {
            alert("Your address is not whitelisted for minting.");
            return;
        }
        if (isAmountInvalid) {
            alert(`Amount exceeds your minting allowance.`);
            return;
        }
        if (!isConnected || !amount || parseFloat(amount) <= 0) {
            alert("Please connect your wallet and enter a valid amount.");
            return;
        }

        setLastMintedAmount(amount);
        writeContract({
            address: config.assetManagerContract,
            abi: config.assetManagerABI,
            functionName: 'mint',
            args: [parseUnits(amount, 18)],
        });
    }

    // --- useEffects for Modals and State Changes ---
    useEffect(() => {
        if (isConfirming || isPending) {
            setShowModal(true);
            setModalContent({
                title: isPending ? 'Awaiting Confirmation' : 'Processing Transaction',
                description: isPending ? 'Please confirm in your wallet.' : 'Waiting for blockchain confirmation...',
            });
        }
        // Hide modal if it's not processing anymore
        if (!isConfirming && !isPending) {
            setShowModal(false);
        }
    }, [isConfirming, isPending]);

    useEffect(() => {
        if (isConfirmed) {
            setAmount('');
            setShowSuccessCard(true);
            refetchMintableAmount();
        }
    }, [isConfirmed, refetchMintableAmount]);

    useEffect(() => {
        if (error) {
            setShowModal(false);
            alert(`Transaction Failed: ${getRpcErrorMessage(error)}`);
        }
    }, [error]);


    const isMintDisabled = !isConnected || isPending || isConfirming || !amount || isAmountInvalid || isWhitelisted === false || isCheckingWhitelist;
    const isInputDisabled = isPending || isConfirming || !isConnected || isWhitelisted === false || isCheckingWhitelist;

    return (
        <div className="max-w-xl mx-auto p-4 md:p-6 animate-fade-in">
            <Link href="/vault" className="text-muted-foreground hover:text-foreground mb-6 flex items-center gap-2">
                <ArrowLeft size={16} /> Back to Vaults
            </Link>

            {showSuccessCard ? (
                <MintSuccessCard
                    amount={lastMintedAmount}
                    asset={config.asset}
                    onMintAgain={() => setShowSuccessCard(false)}
                    onViewTx={() => window.open(`https://sepolia.etherscan.io/tx/${hash}`, '_blank')}
                />
            ) : (
                <div className="bg-background/70 border border-border rounded-2xl p-6 shadow-xl">
                    <div className="flex justify-between items-start mb-5">
                        <h2 className="text-2xl font-bold text-foreground">Mint {config.asset}</h2>
                        <ConnectButton showBalance={false} accountStatus="address" />
                    </div>
                    <div className="space-y-4">
                        <div>
                             <div className="flex justify-between items-center mb-2">
                                <Label className="text-sm font-medium text-muted-foreground">Amount to Mint</Label>
                                {isConnected && isWhitelisted === true && (
                                    <span className="text-xs text-muted-foreground">
                                        Available: {Number(formattedMintableAmount).toFixed(4)}
                                    </span>
                                )}
                            </div>
                            <div className="relative">
                                <Input
                                    type="number"
                                    placeholder="0.00"
                                    value={amount}
                                    onChange={(e) => setAmount(e.target.value)}
                                    disabled={isInputDisabled}
                                    className={`w-full bg-secondary border rounded-lg p-3 text-foreground text-xl focus:ring-2 focus:ring-primary/50 focus:border-primary/50 outline-none disabled:bg-muted disabled:cursor-not-allowed ${isAmountInvalid ? 'border-red-500' : 'border-border'}`}
                                />
                                <div className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center gap-4">
                                   <span className="text-muted-foreground font-bold">{config.asset}</span>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      className="h-auto p-1 text-primary hover:bg-primary/10"
                                      onClick={() => setAmount(formattedMintableAmount)}
                                      disabled={isInputDisabled || formattedMintableAmount === '0'}
                                    >
                                        Max
                                    </Button>
                                </div>
                            </div>
                             {isAmountInvalid && (
                                 <p className="text-xs text-red-500 mt-2">Amount exceeds your minting allowance.</p>
                             )}
                            {isConnected && isWhitelisted === false && !isCheckingWhitelist && (
                                <div className="flex items-center gap-2 text-sm text-yellow-500 mt-2 p-3 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
                                    <XCircle size={16} />
                                    <span>Your address is not whitelisted for minting.</span>
                                </div>
                            )}
                        </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-1 gap-4 mt-6">
                        <Button
                            onClick={handleMint}
                            disabled={isMintDisabled}
                        >
                            {isCheckingWhitelist ? 'Checking Whitelist...' : isPending ? 'Check Wallet...' : isConfirming ? 'Processing...' : `Mint ${config.asset}`}
                        </Button>
                    </div>
                </div>
            )}
            
            <AlertDialog open={showModal} onOpenChange={setShowModal}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                       <AlertDialogTitle className="text-center text-2xl font-bold text-foreground mb-4">{modalContent.title}</AlertDialogTitle>
                       <AlertDialogDescription asChild>
                           <div className="text-center text-muted-foreground">
                               <div className="flex justify-center items-center my-8">
                                   <span className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin"></span>
                               </div>
                               <span className="break-words">{modalContent.description}</span>
                           </div>
                       </AlertDialogDescription>
                    </AlertDialogHeader>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}
