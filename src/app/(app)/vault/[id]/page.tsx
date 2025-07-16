'use client';
import { useEffect, useState, use } from 'react';
import { BrowserProvider, Contract, parseUnits, formatUnits } from 'ethers';
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
import { Label } from '@/components/ui/label';

// ABI and contract address
import assetManagementAbi from '@/abi/assetManagement.json'; // adjust as needed
import assetAbi from '@/abi/asset.json'; // adjust as needed


const ZERO_ADDRESS = "0x0000000000000000000000000000000000000000";

const getVaultData = (id: string) => {
  const vaults: Record<string, { asset: string; icon: string; contractAddress: string, assetAddress: string }> = {
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
    contractAddress: ZERO_ADDRESS,
  };
};


export default function VaultDepositPage({ params }: { params: { id: string } }) {
  //@ts-ignore
  const { id } = params; // ✅ avoid hydration error
  const vault = getVaultData(id);

  const [dogeAmount, setDogeAmount] = useState('');
  const [evmWalletConnected, setEvmWalletConnected] = useState(false);
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
  const [modalContent, setModalContent] = useState({ title: '', description: '', isSuccess: false });

  useEffect(() => {
    if (evmAddress && contract) fetchContractState();
  }, [evmAddress, contract]);

  const fetchContractState = async () => {
    try {
      console.log('Fetching on-chain state for', evmAddress);
      const [whitelisted, mintable, allowanceAmt, mintedAmt,curBal] = await Promise.all([
        contract!.isWhitelisted(evmAddress),
        contract!.getMintableAmount(evmAddress),
        contract!.getAllowance(evmAddress),
        contract!.getMintedAmount(evmAddress),
        assetContract!.balanceOf(evmAddress),
      ]);
      console.log('Whitelisted:', whitelisted);
      console.log('Mintable Amount:', formatUnits(mintable, 18));
      console.log('Allowance:', formatUnits(allowanceAmt, 18));
      console.log('Minted Amount:', formatUnits(mintedAmt, 18));
      console.log('Current Asset Balance:', formatUnits(curBal, 18));
      setIsWhitelisted(whitelisted);
      setMintableAmount(mintable);
      setAllowance(allowanceAmt);
      setMintedAmount(mintedAmt);
      setCurrentAssetBalance(curBal);
    } catch (error) {
      console.error('Contract call error:', error);
    }
  };

  const handleConnectEvm = async () => {
    try {
      if (!window.ethereum) throw new Error('No EVM wallet found');
      const provider = new BrowserProvider(window.ethereum);
      await provider.send("eth_requestAccounts", []);
      const signer = await provider.getSigner();
      const address = await signer.getAddress();
      const contractInstance = new Contract(vault.contractAddress, assetManagementAbi, signer);
      const assetInstance = new Contract(vault.assetAddress, assetAbi, signer);


      console.log('Connected address:', address);
      setEvmWalletConnected(true);
      setEvmAddress(address);
      setContract(contractInstance);
      setAssetContract(assetInstance);
    } catch (err: any) {
      setModalContent({ title: 'Wallet Connect Failed', description: err.message || 'Could not connect wallet', isSuccess: false });
      setShowModal(true);
    }
  };
useEffect(() => {
  if (window.ethereum) {
    handleConnectEvm();
  }
}, []);
  const handleMint = async () => {
    if (!contract || !canMint) return;

    setIsProcessing(true);
    setProcessingStep('minting');
    setShowModal(true);
    setModalContent({ title: 'Minting t-DOGE', description: 'Confirming onchain transaction...', isSuccess: false });

    try {
      const amount = parseUnits(dogeAmount || '0', 18);
      console.log('Calling mint with amount:', amount.toString());
      const tx = await contract.mint(amount);
      console.log('Transaction sent:', tx.hash);
      await tx.wait();
      console.log('Transaction confirmed');
      setIsProcessing(false);
      setProcessingStep('');
      setModalContent({
        title: 'Minting Successful!',
        description: `You minted ${dogeAmount} tDOGE.`,
        isSuccess: true,
      });
    } catch (err: any) {
      console.error('Mint error:', err);
      setIsProcessing(false);
      setProcessingStep('');
      setModalContent({ title: 'Minting Failed', description: err.message || 'Transaction failed', isSuccess: false });
    }
  };

  const closeModal = () => {
    setShowModal(false);
    if (modalContent.title.includes('Successful')) {
      setDogeAmount('');
      fetchContractState();
    }
  };

  const canMint =
    evmWalletConnected &&
    isWhitelisted &&
    mintableAmount > 0 &&
    parseFloat(dogeAmount) > 0 &&
    !isProcessing;

  return (
    <div className="max-w-2xl mx-auto p-4 md:p-8">
      <Link href="/vault" className="text-muted-foreground hover:text-foreground mb-6 flex items-center gap-2">
        &larr; Back to Vaults
      </Link>
      <div className="bg-background/70 border border-border rounded-2xl p-6 shadow-xl">
        <h2 className="text-2xl font-bold text-foreground mb-5">Mint {vault.asset}</h2>
        <div className="space-y-4">
          <div>
            <Label className="text-sm font-medium text-muted-foreground block mb-2">Amount to Mint tDOGE</Label>
            <div className="relative">
              <input
                type="number"
                placeholder="0.00"
                value={dogeAmount}
                onChange={(e) => setDogeAmount(e.target.value)}
                className="w-full bg-secondary border border-border rounded-lg p-3 text-foreground text-xl focus:ring-2 focus:ring-primary/50 focus:border-primary/50 outline-none"
              />
              <span className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground font-bold">{vault.asset}</span>
            </div>
          </div>

          {evmWalletConnected && (
            <div className="text-sm text-muted-foreground space-y-1 mt-4">
              <div>💸 <strong>Minted Amount:</strong> {formatUnits(mintedAmount || 0, 18)}</div>
              <div>💸 <strong>Current {vault.asset} Balance:</strong> {formatUnits(currentAssetBalance || 0, 18)} {vault.icon}</div>
              <div>🔐 <strong>Whitelisted:</strong> {isWhitelisted ? 'Yes' : 'No'}</div>
              <div>💰 <strong>Mintable Amount:</strong> {formatUnits(mintableAmount || 0, 18)}</div>
              <div>🪙 <strong>Allowance:</strong> {formatUnits(allowance || 0, 18)}</div>
            </div>
          )}
        </div>

        <div className="my-6 space-y-3">
          <button
            onClick={handleConnectEvm}
            disabled={evmWalletConnected}
            className={`w-full px-4 py-2 rounded-md font-semibold text-sm ${
              evmWalletConnected
                ? 'bg-green-500/20 text-green-400 cursor-not-allowed'
                : 'bg-primary hover:bg-primary/90 text-primary-foreground'
            }`}
          >
            {evmWalletConnected ? `Connected: ${evmAddress.slice(0, 6)}...${evmAddress.slice(-4)}` : 'Connect Wallet'}
          </button>
        </div>

        <div className="mt-6">
          <button
            onClick={handleMint}
            disabled={!canMint}
            className="w-full bg-primary text-primary-foreground font-bold py-3 rounded-lg hover:bg-primary/90 transition-all disabled:bg-muted disabled:cursor-not-allowed disabled:text-muted-foreground"
          >
            {processingStep === 'minting' ? 'Minting...' : `Mint ${vault.asset}`}
          </button>
        </div>
      </div>

      <AlertDialog open={showModal} onOpenChange={setShowModal}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{modalContent.title}</AlertDialogTitle>
            <AlertDialogDescription>
              <div className="flex flex-col items-center justify-center gap-4 mt-4">
                {!modalContent.isSuccess ? (
                  <span className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
                ) : (
                  <span className="w-12 h-12 bg-green-500/20 rounded-full flex items-center justify-center">
                    <CheckCircle2 size={28} className="text-green-400" />
                  </span>
                )}
                <p>{modalContent.description}</p>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          {modalContent.isSuccess && (
            <AlertDialogFooter>
              <AlertDialogAction onClick={closeModal}>Done</AlertDialogAction>
            </AlertDialogFooter>
          )}
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
