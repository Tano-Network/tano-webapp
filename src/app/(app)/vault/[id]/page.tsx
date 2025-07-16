
'use client';
import { useState, useEffect, use } from 'react';
import { ethers } from 'ethers';
// TypeScript fix for window.ethereum
declare global {
  interface Window {
    ethereum?: any;
  }
}

// TypeScript fix for window.ethereum
declare global {
  interface Window {
    ethereum?: any;
  }
}
import Link from 'next/link';
import { Zap, CheckCircle2 } from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Slider } from "@/components/ui/slider"
import { Label } from '@/components/ui/label';

const WalletConnectButton = ({ walletName, onConnect, isConnected, address }:any) => (
  <div className="bg-secondary p-4 rounded-lg border flex items-center justify-between">
    <div>
      <p className="font-semibold text-foreground">{walletName}</p>
      {isConnected && <p className="text-xs text-muted-foreground font-mono break-all">{address}</p>}
    </div>
    <button
      onClick={onConnect}
      disabled={isConnected}
      className={`px-4 py-2 rounded-md text-sm font-semibold transition-all duration-300 ${
        isConnected
          ? 'bg-green-500/20 text-green-400 cursor-not-allowed'
          : 'bg-primary/80 hover:bg-primary text-primary-foreground'
      }`}
    >
      {isConnected ? 'Connected' : `Connect ${walletName}`}
    </button>
  </div>
);


const getVaultData = (id: string) => {
    const vaults: Record<string, { asset: string; icon: string }> = {
        doge: { asset: 'tDOGE', icon: 'Ð' },
        litecoin: { asset: 'tltc', icon: '₿' },
        bitcoin_cash: { asset: 'tbch', icon: 'Ξ' },
    };
    return vaults[id] || vaults.doge;
};


export default function VaultDepositPage({ params }: { params: { id: string } }) {
  //@ts-ignore
    const { id } = use(params);
    const vault = getVaultData(id);
    const [dogeAmount, setDogeAmount] = useState('');
    const [tDogeAmount, setTDogeAmount] = useState('');
    const [lockingPeriod, setLockingPeriod] = useState(3);
    const [isPeriodSigned, setIsPeriodSigned] = useState(false);

    const [dogeWalletConnected, setDogeWalletConnected] = useState(false);
    const [evmWalletConnected, setEvmWalletConnected] = useState(false);
    const [dogeAddress, setDogeAddress] = useState('');
    const [evmAddress, setEvmAddress] = useState('');
    
    const [isProcessing, setIsProcessing] = useState(false);
    const [processingStep, setProcessingStep] = useState(''); // 'signing', 'minting'
    const [showModal, setShowModal] = useState(false);
    const [modalContent, setModalContent] = useState({ title: '', description: '', isSuccess: false });


    useEffect(() => {
        setTDogeAmount(dogeAmount);
    }, [dogeAmount]);

    const handleConnectDoge = () => {
        setTimeout(() => {
            setDogeWalletConnected(true);
            if (window.crypto && window.crypto.randomUUID) {
              setDogeAddress(`D...${window.crypto.randomUUID().slice(-12)}`);
            } else {
              setDogeAddress(`D...${(Math.random().toString(36) + '00000000000000000').slice(2, 14)}`);
            }
        }, 1000);
    };

    // Connect EVM wallet and get address
    const handleConnectEvm = async () => {
        try {
            if (!window.ethereum) throw new Error('No EVM wallet found');
            const provider = new ethers.providers.Web3Provider(window.ethereum);
            await provider.send("eth_requestAccounts", []);
            const signer = provider.getSigner();
            const address = await signer.getAddress();
            setEvmWalletConnected(true);
            setEvmAddress(address);
        } catch (err) {
            setModalContent({ title: 'Wallet Connect Failed', description: (err && (err as any).message) ? (err as any).message : 'Could not connect wallet', isSuccess: false });
            setShowModal(true);
        }
    };

    const handleSign = () => {
        if (!canSign) return;
        setIsProcessing(true);
        setProcessingStep('signing');
        setShowModal(true);
        setModalContent({ title: 'Signing Locking Period', description: 'Please sign the transaction in your DOGE wallet...', isSuccess: false });

        setTimeout(() => {
            setIsPeriodSigned(true);
            setIsProcessing(false);
            setProcessingStep('');
            setModalContent({ title: 'Signature Successful', description: 'You have successfully signed the locking period. You can now proceed to mint your t-DOGE.', isSuccess: true });
        }, 2000);
    }
    
    // AssetManager contract ABI (minimal for mint)
    const assetManagerAbi = [
      "function mint(uint256 amount) public"
    ];
    const assetManagerAddress = "0x6183367a204F2E2E9638d2ee5fDb281dB6f42F48";

    const handleMint = async () => {
        if (!canMint) return;
        setIsProcessing(true);
        setProcessingStep('minting');
        setShowModal(true);
        setModalContent({ title: 'Minting t-DOGE', description: 'Confirming the transaction on the EVM chain...', isSuccess: false });

        try {
            // Prompt user for wallet connection
            if (!window.ethereum) throw new Error('No EVM wallet found');
            const provider = new ethers.providers.Web3Provider(window.ethereum);
            await provider.send("eth_requestAccounts", []);
            const signer = provider.getSigner();
            const contract = new ethers.Contract(assetManagerAddress, assetManagerAbi, signer);
            // Convert amount to wei (assuming tDOGE has 18 decimals)
            const amount = ethers.utils.parseUnits(dogeAmount || '0', 18);
            const tx = await contract.mint(amount);
            await tx.wait();
            setIsProcessing(false);
            setProcessingStep('');
            setModalContent({ title: 'Minting Successful!', description: `You have successfully deposited ${dogeAmount} ${vault.asset} and received ${tDogeAmount} t-DOGE.`, isSuccess: true });
        } catch (err: any) {
            setIsProcessing(false);
            setProcessingStep('');
            setModalContent({ title: 'Minting Failed', description: (err && err.message) ? err.message : 'Transaction failed', isSuccess: false });
        }
    }

    const closeModal = () => {
        if (modalContent.title === 'Minting Successful!') {
            setShowModal(false);
            setDogeAmount('');
            setLockingPeriod(3);
            setIsPeriodSigned(false);
        } else {
            setShowModal(false);
        }
    }

    const canSign = dogeWalletConnected && evmWalletConnected && parseFloat(dogeAmount) > 0 && lockingPeriod !== 0 && !isPeriodSigned && !isProcessing;
    const canMint = isPeriodSigned && evmWalletConnected && !isProcessing;

    return (
        <div className="max-w-2xl mx-auto p-4 md:p-8 animate-fade-in">
            <Link href="/vault" className="text-muted-foreground hover:text-foreground mb-6 flex items-center gap-2">
                &larr; Back to Vaults
            </Link>
            <div className="bg-background/70 border border-border rounded-2xl p-6 shadow-xl">
                <h2 className="text-2xl font-bold text-foreground mb-5">Mint {vault.asset}</h2>
                {/* <p className="text-muted-foreground mb-6">You will receive tDOGE.</p> */}

                <div className="space-y-4">
                    <div>
                        <Label className="text-sm font-medium text-muted-foreground block mb-2">Amount to Mint tDOGE</Label>
                        <div className="relative">
                            <input
                                type="number"
                                placeholder="0.00"
                                value={dogeAmount}
                                onChange={(e) => setDogeAmount(e.target.value)}
                                disabled={isPeriodSigned}
                                className="w-full bg-secondary border border-border rounded-lg p-3 text-foreground text-xl focus:ring-2 focus:ring-primary/50 focus:border-primary/50 outline-none disabled:bg-muted disabled:cursor-not-allowed"
                            />
                            <span className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground font-bold">{vault.asset}</span>
                        </div>
                    </div>
                </div>

                <div className="my-6 space-y-3">
                    {/* <WalletConnectButton walletName="DOGE Wallet" onConnect={handleConnectDoge} isConnected={dogeWalletConnected} address={dogeAddress} /> */}
                    <WalletConnectButton walletName="EVM Wallet" onConnect={handleConnectEvm} isConnected={evmWalletConnected} address={evmAddress} />
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
                    <button
                        onClick={handleSign}
                        disabled={!canSign}
                        className="w-full bg-primary text-primary-foreground font-bold py-3 rounded-lg hover:bg-primary/90 transition-all disabled:bg-muted disabled:cursor-not-allowed disabled:text-muted-foreground"
                    >
                         {processingStep === 'signing' ? 'Signing...' : isPeriodSigned ? 'Signed' : '1. Sign & Lock'}
                    </button>
                    <button
                        onClick={handleMint}
                        disabled={!canMint}
                        className="w-full bg-primary text-primary-foreground font-bold py-3 rounded-lg hover:bg-primary/90 transition-all disabled:bg-muted disabled:cursor-not-allowed disabled:text-muted-foreground"
                    >
                        {processingStep === 'minting' ? 'Minting...' : '2. Mint t-DOGE'}
                    </button>
                </div>

            </div>
            <AlertDialog open={showModal} onOpenChange={setShowModal}>
              <AlertDialogContent className="bg-background border-border rounded-2xl shadow-2xl p-6 w-full max-w-md">
                <AlertDialogHeader>
                  <AlertDialogTitle className="text-center text-2xl font-bold text-foreground mb-4">
                     {modalContent.title}
                  </AlertDialogTitle>
                   <AlertDialogDescription asChild>
                     <div className="text-center text-muted-foreground">
                       <div className="flex justify-center items-center my-8">
                         {!modalContent.isSuccess ? (
                           <span className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin"></span>
                         ) : (
                            <span className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center">
                              {modalContent.title.includes('Minting') ? <Zap size={32} className="text-green-400" /> : <CheckCircle2 size={32} className="text-green-400" />}
                            </span>
                         )}
                       </div>
                       <span>
                          {modalContent.description}
                       </span>
                     </div>
                   </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  {modalContent.isSuccess && (
                      <AlertDialogAction onClick={closeModal} className="w-full bg-primary text-primary-foreground font-semibold py-2 px-6 rounded-lg hover:bg-primary/90">
                          Done
                      </AlertDialogAction>
                  )}
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}
