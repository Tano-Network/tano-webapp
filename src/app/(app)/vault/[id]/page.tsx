
'use client';
import React, { useEffect, useState, use } from 'react';
import { Contract, BrowserProvider, parseUnits, formatUnits } from 'ethers';
import Link from 'next/link';
import { CheckCircle2, ExternalLink } from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Label } from '@/components/ui/label';
import assetManagementAbi from '@/abi/assetManagement.json';
import assetAbi from '@/abi/asset.json';

interface VaultParams {
  id: string;
}

const getVaultData = (id: string) => {
  const vaults: Record<string, { asset: string; icon: string; contractAddress: string; assetAddress: string }> = {
    doge: {
      asset: 'tDOGE',
      icon: 'Ð',
      contractAddress: '0x6183367a204F2E2E9638d2ee5fDb281dB6f42F48',
      assetAddress: '0x46507E8929Fe9C20c8914fc9036829F6e7740D9D'
    },
    litecoin: {
      asset: 'tLTC',
      icon: 'Ł',
      contractAddress: '0x1111111111111111111111111111111111111111', // example
      assetAddress: '0x2222222222222222222222222222222222222222', // example
    },
    bitcoin_cash: {
      asset: 'tBCH',
      icon: 'Ƀ',
      contractAddress: '0x2222222222222222222222222222222222222222', // example
      assetAddress: '0x3333333333333333333333333333333333333333', // example
    },
  };
  
  return vaults[id] || {
    asset: 'Unknown',
    icon: '?',
    contractAddress: '0x0000000000000000000000000000000000000000',
    assetAddress: '0x0000000000000000000000000000000000000000',
  };
};

export default function VaultDepositPage({ params }: { params: Promise<VaultParams> }) {
  const { id } = use(params);
  const vault = getVaultData(id);

  const [dogeAmount, setDogeAmount] = useState('');
  const [evmAddress, setEvmAddress] = useState('');
  const [contract, setContract] = useState<Contract | null>(null);
  const [assetContract, setAssetContract] = useState<Contract | null>(null);

  const [isWhitelisted, setIsWhitelisted] = useState(false);
  const [mintableAmount, setMintableAmount] = useState<number>(0);
  const [mintedAmount, setMintedAmount] = useState<number>(0);
  const [allowance, setAllowance] = useState<number>(0);
  const [currentAssetBalance, setCurrentAssetBalance] = useState<number>(0);

  const [isProcessing, setIsProcessing] = useState(false);
  const [processingStep, setProcessingStep] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [modalContent, setModalContent] = useState<{ title: string; description: string; isSuccess: boolean; txHash?: string }>({ title: '', description: '', isSuccess: false });

  useEffect(() => {
    const connect = async () => {
      if (!window.ethereum) return;
      const provider = new BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const address = await signer.getAddress();
      setEvmAddress(address);
      const contractInstance = new Contract(vault.contractAddress, assetManagementAbi, signer);
      const assetInstance = new Contract(vault.assetAddress, assetAbi, signer);
      setContract(contractInstance);
      setAssetContract(assetInstance);
    };
    connect();
  }, [vault.contractAddress, vault.assetAddress]);

  useEffect(() => {
    const fetchState = async () => {
      if (!contract || !assetContract || !evmAddress) return;
      const [whitelisted, mintable, allowanceAmt, mintedAmt, curBal] = await Promise.all([
        contract.isWhitelisted(evmAddress),
        contract.getMintableAmount(evmAddress),
        contract.getAllowance(evmAddress),
        contract.getMintedAmount(evmAddress),
        assetContract.balanceOf(evmAddress),
      ]);
      setIsWhitelisted(whitelisted);
      setMintableAmount(mintable);
      setAllowance(allowanceAmt);
      setMintedAmount(mintedAmt);
      setCurrentAssetBalance(curBal);
    };
    fetchState();
  }, [contract, assetContract, evmAddress]);

  const handleMint = async () => {
    if (!contract || parseFloat(dogeAmount) <= 0) return;
    setIsProcessing(true);
    setProcessingStep('minting');
    setShowModal(true);
    setModalContent({ title: 'Minting', description: 'Confirm in your wallet...', isSuccess: false });
    try {
      const amount = parseUnits(dogeAmount, 18);
      const tx = await contract.mint(amount);
      setModalContent({ title: 'Transaction Sent', description: 'Waiting for confirmation...', isSuccess: false });
      await tx.wait();
      setIsProcessing(false);
      setProcessingStep('');
      setModalContent({
        title: 'Mint Successful',
        description: `Minted ${dogeAmount} ${vault.asset}`,
        isSuccess: true,
        txHash: tx.hash,
      });
      setDogeAmount('');
    } catch (err) {
      setIsProcessing(false);
      setProcessingStep('');
      setModalContent({ title: 'Mint Failed', description: err instanceof Error ? err.message : 'Transaction failed', isSuccess: false });
    }
  };

  return (
    <div className="relative max-w-md mx-auto p-4">
      {!isWhitelisted && (
        <div
  style={{
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    backdropFilter: 'blur(10px)',
    WebkitBackdropFilter: 'blur(10px)',
    zIndex: 50,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '24px',
    boxSizing: 'border-box',
    animation: 'scaleIn 0.3s ease-out forwards'
  }}
>
  <div
    style={{
      background: 'linear-gradient(135deg, rgba(255,255,255,0.15), rgba(255,255,255,0.05))',
      border: '1px solid rgba(255, 255, 255, 0.2)',
      borderRadius: '16px',
      padding: '32px',
      maxWidth: '90%',
      color: '#ffffff',
      fontSize: '1.25rem',
      fontWeight: '600',
      textAlign: 'center',
      boxShadow: '0 8px 32px rgba(0,0,0,0.2)',
      backdropFilter: 'blur(15px)',
      WebkitBackdropFilter: 'blur(15px)',
      transition: 'transform 0.3s ease'
    }}
  >
    🚫 You are not whitelisted to mint {vault.asset}.
  </div>
  <style>
    {`
      @keyframes scaleIn {
        from { transform: scale(0.9); opacity: 0; }
        to { transform: scale(1); opacity: 1; }
      }
    `}
  </style>
</div>


      )}

      <Link href="/vault" className="text-muted-foreground hover:text-foreground mb-4 block">&larr; Back to Vaults</Link>
      <h2 className="text-2xl font-bold mb-4">Mint {vault.asset}</h2>

      <div className="flex flex-wrap gap-2 text-xs text-muted-foreground mb-2">
        <div>💰 Mintable: {formatUnits(mintableAmount, 18)} {vault.icon}</div>
        <div>🪙 Allowance: {formatUnits(allowance, 18)} {vault.icon}</div>
        <div>💸 Balance: {formatUnits(currentAssetBalance, 18)} {vault.icon}</div>
        <div>🔐 Whitelisted: {isWhitelisted ? <span className="text-green-500">Yes</span> : <span className="text-red-500">No</span>}</div>
        <div>🪙 Minted: {formatUnits(mintedAmount, 18)} {vault.icon}</div>
      </div>

      <Label className="text-sm mb-1">Amount to Mint {vault.asset}</Label>
      <div className="relative mb-4">
        <input
          type="number"
          placeholder="0.0"
          value={dogeAmount}
          onChange={(e) => setDogeAmount(e.target.value)}
          className="w-full bg-secondary border border-border rounded p-3 text-xl"
        />
        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground font-bold">{vault.asset}</span>
      </div>

      <button
        onClick={handleMint}
        disabled={!isWhitelisted || parseFloat(dogeAmount) <= 0 || isProcessing}
        className="mt-3 w-full bg-primary text-primary-foreground font-bold py-3 rounded hover:bg-primary/90 disabled:bg-muted disabled:text-muted-foreground"
      >
        {processingStep === 'minting' ? 'Minting...' : `Mint ${vault.asset}`}
      </button>

      <AlertDialog open={showModal} onOpenChange={setShowModal}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{modalContent.title}</AlertDialogTitle>
            <AlertDialogDescription>
              <div className="flex flex-col items-center mt-4 gap-3">
                {!modalContent.isSuccess ? (
                  <span className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
                ) : (
                  <CheckCircle2 size={40} className="text-green-400" />
                )}
                <p>{modalContent.description}</p>
                {modalContent.isSuccess && modalContent.txHash && (
                  <a
                    href={`https://sepolia.etherscan.io/tx/${modalContent.txHash}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 mt-2 px-3 py-1 bg-primary text-primary-foreground rounded hover:bg-primary/90 text-sm"
                  >
                    View on Etherscan <ExternalLink size={14} />
                  </a>
                )}
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          {modalContent.isSuccess && (
            <AlertDialogFooter>
              <AlertDialogAction onClick={() => setShowModal(false)}>Close</AlertDialogAction>
            </AlertDialogFooter>
          )}
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
