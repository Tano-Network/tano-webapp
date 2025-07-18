// 'use client';
// import { useState, useEffect, use } from 'react';
// import Link from 'next/link';
// import { ethers } from 'ethers';
// import { Zap, CheckCircle2 } from 'lucide-react';
// import {
//   AlertDialog,
//   AlertDialogAction,
//   AlertDialogContent,
//   AlertDialogDescription,
//   AlertDialogFooter,
//   AlertDialogHeader,
//   AlertDialogTitle,
// } from "@/components/ui/alert-dialog";
// import { Slider } from "@/components/ui/slider"
// import { Label } from '@/components/ui/label';
// import AssetManagerABI from '../../../../utils/abi/AssetManagerABI.json'

// // --- Smart Contract Configuration ---
// const assetManagerContractAddress = '0x6183367a204F2E2E9638d2ee5fDb281dB6f42F48';

// const assetManagerAbi = AssetManagerABI

// /**
//  * Parses RPC errors to return a user-friendly message.
//  * @param {any} error The error object from a try-catch block.
//  * @returns {string} A human-readable error message.
//  */
// const getRpcErrorMessage = (error: any): string => {
//     if (error.data?.message) {
//         return error.data.message;
//     }
//     if (error.reason) {
//         // Extracts the clean error message from contract requires
//         return error.reason;
//     }
//     if (error.code === 'ACTION_REJECTED') {
//         return 'Transaction was rejected by the user.';
//     }
//     if (error.code === 'INSUFFICIENT_FUNDS') {
//         return 'You have insufficient funds to complete this transaction.';
//     }
//     if (error.message) {
//         // Catches custom errors thrown manually
//         return error.message;
//     }
//     return 'An unknown error occurred. Please check the console for details.';
// };


// const WalletConnectButton = ({ walletName, onConnect, isConnected, address }:any) => (
//   <div className="bg-secondary p-4 rounded-lg border flex items-center justify-between">
//     <div>
//       <p className="font-semibold text-foreground">{walletName}</p>
//       {isConnected && <p className="text-xs text-muted-foreground font-mono break-all">{address}</p>}
//     </div>
//     <button
//       onClick={onConnect}
//       disabled={isConnected}
//       className={`px-4 py-2 rounded-md text-sm font-semibold transition-all duration-300 ${
//         isConnected
//           ? 'bg-green-500/20 text-green-400 cursor-not-allowed'
//           : 'bg-primary/80 hover:bg-primary text-primary-foreground'
//       }`}
//     >
//       {isConnected ? 'Connected' : `Connect ${walletName}`}
//     </button>
//   </div>
// );


// const getVaultData = (id: string) => {
//     const vaults: Record<string, { asset: string; icon: string }> = {
//         doge: { asset: 'tDOGE', icon: 'Ð' },
//         litecoin: { asset: 'tltc', icon: '₿' },
//         bitcoin_cash: { asset: 'tbch', icon: 'Ξ' },
//     };
//     return vaults[id] || vaults.doge;
// };


// export default function VaultDepositPage({ params }: { params: { id: string } }) {
//   //@ts-ignore
//     const { id } = use(params);
//     const vault = getVaultData(id);
//     const [dogeAmount, setDogeAmount] = useState('');
//     const [tDogeAmount, setTDogeAmount] = useState('');
//     const [lockingPeriod, setLockingPeriod] = useState(3);
//     const [isPeriodSigned, setIsPeriodSigned] = useState(false);
//       const [mintableAmount, setMintableAmount] = useState('');
//     const [evmWalletConnected, setEvmWalletConnected] = useState(false);
//     const [dogeAddress, setDogeAddress] = useState('');
//     const [evmAddress, setEvmAddress] = useState('');
    
//     const [isProcessing, setIsProcessing] = useState(false);
//     const [processingStep, setProcessingStep] = useState('');
//     const [showModal, setShowModal] = useState(false);
//     const [modalContent, setModalContent] = useState({ title: '', description: '', isSuccess: false });


//     useEffect(() => {
//         setTDogeAmount(dogeAmount);
//     }, [dogeAmount]);

//     const handleConnectEvm = async () => {
//         //@ts-ignore
//     if (typeof window.ethereum === 'undefined') {
//         alert("Please install MetaMask to connect your wallet.");
//         return;
//     }

//     try {//@ts-ignore
//         const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
//         if (accounts.length > 0) {
//             const userAddress = accounts[0];
//             setEvmAddress(userAddress);
//             setEvmWalletConnected(true);
//         } else {
//             alert("No accounts found. Please ensure your wallet is set up correctly.");
//         }
//     } catch (error) {
//         console.error("Wallet connection error:", error);
//         alert("Failed to connect wallet. The request may have been rejected.");
//         setEvmWalletConnected(false);
//     }
//     };


//     const handleMint = async () => {
//         if (!evmWalletConnected || !dogeAmount || parseFloat(dogeAmount) <= 0) {
//             alert("Please connect your wallet and enter a valid amount greater than zero.");
//             return;
//         }

//         setIsProcessing(true);
//         setShowModal(true);
//         setModalContent({
//             title: 'Preparing Transaction...',
//             description: 'Verifying your minting allowance...',
//             isSuccess: false
//         });

//         try {
//             // @ts-ignore
//             const provider = new ethers.BrowserProvider(window.ethereum);
//             const signer = await provider.getSigner();
//             const assetManager = new ethers.Contract(assetManagerContractAddress, assetManagerAbi, signer);
            
//             // Assuming the token uses 18 decimals.
//             const amountInWei = ethers.parseUnits(dogeAmount, 18);
//             const userAddress = await signer.getAddress();
           
//             // **NEW**: Pre-flight check to see if user can mint this amount.
//               const mintableAmount = await assetManager.getMintableAmount(userAddress);
          
//             if (amountInWei > mintableAmount) {
//                   const mintableFormatted = ethers.formatUnits(mintableAmount, 18);
                    
//                 throw new Error(`Amount exceeds your minting allowance. You can mint up to ${mintableFormatted} ${vault.asset}.`);
//             }

//             setModalContent({
//                 title: 'Awaiting Confirmation',
//                 description: 'Please confirm the transaction in your wallet.',
//                 isSuccess: false,
//             });

//             const tx = await assetManager.mint(amountInWei);

//             setModalContent({
//                 title: 'Processing Transaction',
//                 description: 'Waiting for the transaction to be confirmed on the blockchain...',
//                 isSuccess: false,
//             });

//             await tx.wait(); // Wait for 1 confirmation

//             setIsProcessing(false);
//             setModalContent({
//                 title: 'Minting Successful! 🎉',
//                 description: `You have successfully minted ${dogeAmount} ${vault.asset}.`,
//                 isSuccess: true,
//             });

//         } catch (error: any) {
//             console.error("Minting failed:", error);
//             setIsProcessing(false);
//             setModalContent({
//                 title: 'Transaction Failed',
//                 description: getRpcErrorMessage(error),
//                 isSuccess: false,
//             });
//         }
//     }

//     const closeModal = () => {
//         if (modalContent.isSuccess) {
//             setShowModal(false);
//             setDogeAmount('');
//             setLockingPeriod(3);
//             setIsPeriodSigned(false);
//         } else {
//             setShowModal(false);
//         }
//     }

//     // --- The rest of your component remains the same ---
//     return (
//         <div className="max-w-2xl mx-auto p-4 md:p-8 animate-fade-in">
//             <Link href="/vault" className="text-muted-foreground hover:text-foreground mb-6 flex items-center gap-2">
//                 &larr; Back to Vaults
//             </Link>
//             <div className="bg-background/70 border border-border rounded-2xl p-6 shadow-xl">
//                 <h2 className="text-2xl font-bold text-foreground mb-5">Mint {vault.asset}</h2>
//                 <div className="space-y-4">
//                     <div>
//                         <Label className="text-sm font-medium text-muted-foreground block mb-2">Amount to Mint {vault.asset}</Label>
//                         <div className="relative">
//                             <input
//                                 type="number"
//                                 placeholder="0.00"
//                                 value={dogeAmount}
//                                 onChange={(e) => setDogeAmount(e.target.value)}
//                                 disabled={isPeriodSigned || isProcessing}
//                                 className="w-full bg-secondary border border-border rounded-lg p-3 text-foreground text-xl focus:ring-2 focus:ring-primary/50 focus:border-primary/50 outline-none disabled:bg-muted disabled:cursor-not-allowed"
//                             />
//                             <span className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground font-bold">{vault.asset}</span>
//                         </div>
//                             </div>
                         
//                 </div>
//                 <div className="my-6 space-y-3">
//                     <WalletConnectButton walletName="EVM Wallet" onConnect={handleConnectEvm} isConnected={evmWalletConnected} address={evmAddress} />
                            
//                       </div>
//                 <div className="grid grid-cols-1 md:grid-cols-1 gap-4 mt-6">
//                     <button
//                         onClick={handleMint}
//                         disabled={!evmWalletConnected || isProcessing || !dogeAmount}
//                         className="w-full bg-primary text-primary-foreground font-bold py-3 rounded-lg hover:bg-primary/90 transition-all disabled:bg-muted disabled:cursor-not-allowed disabled:text-muted-foreground"
//                     >
//                         {isProcessing ? 'Processing...' : `Mint ${vault.asset}`}
//                     </button>
//                 </div>
//             </div>
//             <AlertDialog open={showModal} onOpenChange={setShowModal}>
//                 <AlertDialogContent className="bg-background border-border rounded-2xl shadow-2xl p-6 w-full max-w-md">
//                 <AlertDialogHeader>
//                     <AlertDialogTitle className="text-center text-2xl font-bold text-foreground mb-4">
//                         {modalContent.title}
//                     </AlertDialogTitle>
//                     <AlertDialogDescription asChild>
//                         <div className="text-center text-muted-foreground">
//                         <div className="flex justify-center items-center my-8">
//                             {isProcessing ? (
//                                 <span className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin"></span>
//                             ) : (
//                                 <span className={`w-16 h-16 ${modalContent.isSuccess ? 'bg-green-500/20' : 'bg-red-500/20'} rounded-full flex items-center justify-center`}>
//                                     {modalContent.isSuccess ? <CheckCircle2 size={32} className="text-green-400" /> : <Zap size={32} className="text-red-400" />}
//                                 </span>
//                             )}
//                         </div>
//                         <span className="break-words">
//                             {modalContent.description}
//                         </span>
//                         </div>
//                     </AlertDialogDescription>
//                 </AlertDialogHeader>
//                 <AlertDialogFooter>
//                     {!isProcessing && (
//                         <AlertDialogAction onClick={closeModal} className="w-full bg-primary text-primary-foreground font-semibold py-2 px-6 rounded-lg hover:bg-primary/90">
//                             Done
//                         </AlertDialogAction>
//                     )}
//                 </AlertDialogFooter>
//                 </AlertDialogContent>
//             </AlertDialog>
//         </div>
//     );
// }
//############################################### New Version ###########################################################
'use client';
import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { parseUnits, formatUnits } from 'viem';
import { CheckCircle2, ArrowLeft, XCircle } from 'lucide-react'; // ✨ Added XCircle for the message
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { useAccount, useWriteContract, useWaitForTransactionReceipt, useReadContract } from 'wagmi';

import { AlertDialog, AlertDialogContent, AlertDialogDescription, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import AssetManagerABI from '../../../../utils/abi/AssetManagerABI.json';
import { useParams } from 'next/navigation';

// --- (Helper functions and constants remain the same) ---
// IMPORTANT: Make sure your AssetManagerABI.json includes the 'isWhitelisted' function.
// Example entry to add to your ABI array:
// {
//   "inputs": [{ "internalType": "address", "name": "user", "type": "address" }],
//   "name": "isWhitelisted",
//   "outputs": [{ "internalType": "bool", "name": "", "type": "bool" }],
//   "stateMutability": "view",
//   "type": "function"
// }
const assetManagerContractAddress = '0x6183367a204F2E2E9638d2ee5fDb281dB6f42F48';
const assetManagerAbi = AssetManagerABI;

const getRpcErrorMessage = (error: any): string => {
    if (error?.shortMessage) {
        return error.shortMessage;
    }
    return 'An unknown error occurred. Please try again.';
};

const getVaultData = (id: string | string[]) => {
    const vaults: Record<string, { asset: string; icon: string }> = {
        doge: { asset: 'tDOGE', icon: 'Ð' },
        litecoin: { asset: 'tltc', icon: '₿' },
        bitcoin_cash: { asset: 'tbch', icon: 'Ξ' },
    };
    const key = Array.isArray(id) ? id[0] : id;
    return vaults[key] || vaults.doge;
};

// --- Success Card Component (remains the same) ---
const MintSuccessCard = ({ amount, asset, onMintAgain, onViewTx }:any) => (
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
    const params = useParams();
    //@ts-ignore
    const vault = getVaultData(params.id);

    // --- Component State ---
    const [dogeAmount, setDogeAmount] = useState('');
    const [showModal, setShowModal] = useState(false);
    const [modalContent, setModalContent] = useState({ title: '', description: '' });
    const [lastMintedAmount, setLastMintedAmount] = useState('');
    const [showSuccessCard, setShowSuccessCard] = useState(false);

    // --- Hooks ---
    const { address, isConnected } = useAccount();
    const { data: hash, error, writeContract, isPending } = useWriteContract();
    const { isLoading: isConfirming, isSuccess: isConfirmed } = useWaitForTransactionReceipt({ hash });

    // ✨ 1. Read contract to check if the user is whitelisted
    const { data: isWhitelisted, isLoading: isCheckingWhitelist } = useReadContract({
        address: assetManagerContractAddress,
        abi: assetManagerAbi,
        functionName: 'isWhitelisted',
        args: [address],
        query: {
            enabled: isConnected && !!address, // Only run query if wallet is connected
        },
    });

    const { data: mintableAmountRaw, refetch: refetchMintableAmount } = useReadContract({
        address: assetManagerContractAddress,
        abi: assetManagerAbi,
        functionName: 'getMintableAmount',
        args: [address],
        query: {
            enabled: isConnected && !!address && isWhitelisted === true, // ✨ Only fetch amount if whitelisted
        },
    });

    const formattedMintableAmount = useMemo(() => mintableAmountRaw ? formatUnits(mintableAmountRaw as bigint, 18) : '0', [mintableAmountRaw]);

    const isAmountInvalid = useMemo(() => {
        if (!dogeAmount || !mintableAmountRaw) return false;
        try {
            return parseUnits(dogeAmount, 18) > (mintableAmountRaw as bigint);
        } catch {
            return true;
        }
    }, [dogeAmount, mintableAmountRaw]);

    // --- Event Handlers ---
    const handleMint = () => {
        // ✨ 2. Add a guard clause to prevent minting if not whitelisted
        if (!isWhitelisted) {
            alert("Your address is not whitelisted for minting.");
            return;
        }
        if (isAmountInvalid) {
            alert(`Amount exceeds your minting allowance.`);
            return;
        }
        if (!isConnected || !dogeAmount || parseFloat(dogeAmount) <= 0) {
            alert("Please connect your wallet and enter a valid amount.");
            return;
        }

        setLastMintedAmount(dogeAmount);
        writeContract({
            address: assetManagerContractAddress,
            abi: assetManagerAbi,
            functionName: 'mint',
            args: [parseUnits(dogeAmount, 18)],
        });
    }

    // --- (useEffect hooks remain the same) ---
    useEffect(() => {
        if (isConfirming || isPending) {
            setShowModal(true);
            setModalContent({
                title: isPending ? 'Awaiting Confirmation' : 'Processing Transaction',
                description: isPending ? 'Please confirm in your wallet.' : 'Waiting for blockchain confirmation...',
            });
        }
    }, [isConfirming, isPending]);

    useEffect(() => {
        if (isConfirmed) {
            setShowModal(false);
            setDogeAmount('');
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


    // ✨ 3. Determine if the UI should be disabled based on whitelist status
    const isMintDisabled = !isConnected || isPending || isConfirming || !dogeAmount || isAmountInvalid || !isWhitelisted || isCheckingWhitelist;
    const isInputDisabled = isPending || isConfirming || !isConnected || !isWhitelisted || isCheckingWhitelist;

    return (
        <div className="max-w-2xl mx-auto p-4 md:p-8 animate-fade-in">
            <Link href="/vault" className="text-muted-foreground hover:text-foreground mb-6 flex items-center gap-2">
                <ArrowLeft size={16} /> Back to Vaults
            </Link>

            {showSuccessCard ? (
                <MintSuccessCard
                    amount={lastMintedAmount}
                    asset={vault.asset}
                    onMintAgain={() => setShowSuccessCard(false)}
                    onViewTx={() => window.open(`https://sepolia.etherscan.io/tx/${hash}`, '_blank')}
                />
            ) : (
                <div className="bg-background/70 border border-border rounded-2xl p-6 shadow-xl">
                    <div className="flex justify-between items-start mb-5">
                        <h2 className="text-2xl font-bold text-foreground">Mint {vault.asset}</h2>
                        <ConnectButton showBalance={false} accountStatus="address" />
                    </div>
                    <div className="space-y-4">
                        <div>
                            <div className="flex justify-between items-center mb-2">
                                <Label className="text-sm font-medium text-muted-foreground">Amount to Mint</Label>
                                {isConnected && isWhitelisted && ( // ✨ Show available amount only if whitelisted
                                    <span className="text-xs text-muted-foreground">
                                        Available: {Number(formattedMintableAmount).toFixed(4)}
                                    </span>
                                )}
                            </div>
                            <div className="relative">
                                <input
                                    type="number"
                                    placeholder="0.00"
                                    value={dogeAmount}
                                    onChange={(e) => setDogeAmount(e.target.value)}
                                    disabled={isInputDisabled} // ✨ Use combined disabled state
                                    className={`w-full bg-secondary border rounded-lg p-3 text-foreground text-xl focus:ring-2 focus:ring-primary/50 focus:border-primary/50 outline-none disabled:bg-muted disabled:cursor-not-allowed ${isAmountInvalid ? 'border-red-500' : 'border-border'}`}
                                />
                                <div className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center gap-4">
                                   <span className="text-muted-foreground font-bold">{vault.asset}</span>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      className="h-auto p-1 text-primary hover:bg-primary/10"
                                      onClick={() => setDogeAmount(formattedMintableAmount)}
                                      disabled={isInputDisabled || formattedMintableAmount === '0'} // ✨ Use combined disabled state
                                    >
                                        Max
                                    </Button>
                                </div>
                            </div>
                             {isAmountInvalid && (
                                 <p className="text-xs text-red-500 mt-2">Amount exceeds your minting allowance.</p>
                             )}
                            {/* ✨ 4. Show a message if the connected address is not whitelisted */}
                            {isConnected && !isCheckingWhitelist && !isWhitelisted && (
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
                            disabled={isMintDisabled} // ✨ Use combined disabled state for the mint button
                        >
                            {isCheckingWhitelist ? 'Checking Whitelist...' : isPending ? 'Check Wallet...' : isConfirming ? 'Processing...' : `Mint ${vault.asset}`}
                        </Button>
                    </div>
                </div>
            )}

            {/* (AlertDialog for transactions remains the same) */}
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