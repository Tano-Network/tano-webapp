'use client';
import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { parseUnits, formatUnits, maxUint256 } from 'viem';
import { useAccount, useReadContract, useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { Plus, Minus, ArrowLeft, Loader2, AlertCircle, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertDialog, AlertDialogContent, AlertDialogDescription, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";

// ABIs
import DogeStakingModuleABI from '../../../../utils/abi/dogecoin/StakingModuleABI.json';
import DogeERC20ABI from '../../../../utils/abi/dogecoin/DogeABI.json';
import LitecoinStakingModuleABI from '../../../../utils/abi/litecoin/StakingModuleABI.json';
import LitecoinERC20ABI from '../../../../utils/abi/litecoin/LitecoinABI.json';

// --- Type Definition for Asset Configuration ---
type AssetConfig = {
    stakingContract: `0x${string}`;
    tokenContract: `0x${string}`;
    asset: string;
    stakingModuleABI: any;
    erc20ABI: any;
};

// --- Configuration with Updated Addresses and ABIs ---
const ASSET_CONFIG: Record<string, AssetConfig> = {
    doge: {
        stakingContract: '0x839D1424D64ad061e9f612a5f9A438fe9619D5B6',
        tokenContract: '0x46507E8929Fe9C20c8914fc9036829F6e7740D9D',
        asset: 'tDOGE',
        stakingModuleABI: DogeStakingModuleABI,
        erc20ABI: DogeERC20ABI,
    },
    litecoin: {
        stakingContract: '0x479641cb71FC11646e551e1F578707a7bBA673a8',
        tokenContract: '0xC1819d63807e34bb4a120abF1eF58a6D140964Ec',
        asset: 'tLTC',
        stakingModuleABI: LitecoinStakingModuleABI,
        erc20ABI: LitecoinERC20ABI,
    },
};


// --- Helper Functions ---
const getRpcErrorMessage = (error: any): string => {
    if (error?.shortMessage) return error.shortMessage;
    return 'An unknown error occurred. Please try again.';
};

// --- Success Card Component ---
const TransactionSuccessCard = ({ action, amount, asset, onContinue, onViewTx }: {
    action: string;
    amount: string;
    asset: string;
    onContinue: () => void;
    onViewTx: () => void;
}) => (
    <div className="bg-background/70 border border-border rounded-2xl p-6 shadow-xl text-center animate-fade-in">
        <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle2 size={32} className="text-green-400" />
        </div>
        <h2 className="text-2xl font-bold text-foreground capitalize">{action} Successful!</h2>
        <p className="text-muted-foreground mt-2 mb-6">
            You successfully {action}ed {amount} {asset}.
        </p>
        <div className="flex flex-col gap-3">
            <Button onClick={onViewTx}>View Transaction</Button>
            <Button variant="outline" onClick={onContinue}>Stake More</Button>
        </div>
    </div>
);


export default function EarnDepositPage() {
    const { id } = useParams<{ id: string }>();
    const config = ASSET_CONFIG[id] || ASSET_CONFIG.doge;

    // --- Component State ---
    const [mode, setMode] = useState<'deposit' | 'withdraw'>('deposit');
    const [amount, setAmount] = useState('');
    const [error, setError] = useState<string | null>(null);

    // --- UI State for Modal and Success Card ---
    const [showModal, setShowModal] = useState(false);
    const [modalContent, setModalContent] = useState({ title: '', description: '' });
    const [showSuccessCard, setShowSuccessCard] = useState(false);
    const [lastAction, setLastAction] = useState<'deposit' | 'withdraw' | null>(null);
    const [lastAmount, setLastAmount] = useState('');
    const [latestTxHash, setLatestTxHash] = useState<`0x${string}` | undefined>(undefined);

    // --- Wagmi Hooks ---
    const { address, isConnected } = useAccount();
   
    const { data: stakedBalanceRaw, refetch: refetchStakedBalance } = useReadContract({ address: config.stakingContract, abi: config.stakingModuleABI, functionName: 'getStakedBalance', args:address ? [address] : undefined, query: { enabled: isConnected && !!address }});
    const { data: walletBalanceRaw, refetch: refetchWalletBalance } = useReadContract({ address: config.tokenContract, abi: config.erc20ABI, functionName: 'balanceOf', args:address ? [address] : undefined, query: { enabled: isConnected && !!address }});
    const { data: allowanceRaw, refetch: refetchAllowance } = useReadContract({ address: config.tokenContract, abi: config.erc20ABI, functionName: 'allowance', args: address ? [address as `0x${string}`, config.stakingContract] : undefined, query: { enabled: isConnected && !!address }});

    const formattedStakedBalance = useMemo(() => (typeof stakedBalanceRaw === 'bigint' ? formatUnits(stakedBalanceRaw, 18) : '0.00'), [stakedBalanceRaw]);
    const formattedWalletBalance = useMemo(() => (typeof walletBalanceRaw === 'bigint' ? formatUnits(walletBalanceRaw, 18) : '0.00'), [walletBalanceRaw]);
    const allowance = useMemo(() => (typeof allowanceRaw === 'bigint' ? allowanceRaw : BigInt(0)), [allowanceRaw]);
    const parsedAmount = useMemo(() => { try { return (amount === '' || isNaN(parseFloat(amount))) ? BigInt(0) : parseUnits(amount, 18); } catch { return BigInt(0); } }, [amount]);
    const isAllowanceSufficient = useMemo(() => allowance >= parsedAmount, [allowance, parsedAmount]);

    const { data: approveHash, writeContract: approve, isPending: isApproving } = useWriteContract();
    const { data: depositHash, writeContract: deposit, isPending: isDepositing } = useWriteContract();
    const { data: withdrawHash, writeContract: withdraw, isPending: isWithdrawing } = useWriteContract();

    const { isLoading: isConfirmingApprove, isSuccess: isApproveSuccess } = useWaitForTransactionReceipt({ hash: approveHash });
    const { isLoading: isConfirmingDeposit, isSuccess: isDepositSuccess } = useWaitForTransactionReceipt({ hash: depositHash });
    const { isLoading: isConfirmingWithdraw, isSuccess: isWithdrawSuccess } = useWaitForTransactionReceipt({ hash: withdrawHash });

    const isProcessing = isApproving || isDepositing || isWithdrawing || isConfirmingApprove || isConfirmingDeposit || isConfirmingWithdraw;

    // --- Handlers ---
    const handleAction = () => {
        setError(null);
        if (mode === 'deposit') {
            const balanceToCompare = typeof walletBalanceRaw === 'bigint' ? walletBalanceRaw : BigInt(0);
            if (parsedAmount > balanceToCompare) { setError('Deposit amount cannot exceed your wallet balance.'); return; }
            if (isAllowanceSufficient) {
                deposit({ address: config.stakingContract, abi: config.stakingModuleABI, functionName: 'deposit', args: [parsedAmount] }, { onError: (err) => setError(getRpcErrorMessage(err)) });
            } else {
                approve({ address: config.tokenContract, abi: config.erc20ABI, functionName: 'approve', args: [config.stakingContract, parsedAmount] }, { onError: (err) => setError(getRpcErrorMessage(err)) });
            }
        } else {
            const balanceToCompare = typeof stakedBalanceRaw === 'bigint' ? stakedBalanceRaw : BigInt(0);
            if (parsedAmount > balanceToCompare) { setError('Withdraw amount cannot exceed your staked balance.'); return; }
            withdraw({ address: config.stakingContract, abi: config.stakingModuleABI, functionName: 'withdraw', args: [parsedAmount] }, { onError: (err) => setError(getRpcErrorMessage(err)) });
        }
    };

    // --- Effects for UI changes ---
    useEffect(() => {
        const isPending = isApproving || isDepositing || isWithdrawing;
        const isConfirming = isConfirmingApprove || isConfirmingDeposit || isConfirmingWithdraw;
        if (isPending || isConfirming) {
            setShowModal(true);
            setModalContent({
                title: isPending ? 'Awaiting Confirmation' : 'Processing Transaction',
                description: isPending ? 'Please confirm the transaction in your wallet.' : 'Waiting for blockchain confirmation...',
            });
        } else {
            setShowModal(false);
        }
    }, [isApproving, isDepositing, isWithdrawing, isConfirmingApprove, isConfirmingDeposit, isConfirmingWithdraw]);

    useEffect(() => {
        const handleSuccess = (action: 'deposit' | 'withdraw', txHash: `0x${string}` | undefined) => {
            setLastAction(action);
            setLastAmount(amount);
            setLatestTxHash(txHash);
            setShowSuccessCard(true);
            setAmount('');
            refetchStakedBalance();
            refetchWalletBalance();
        };

        if (isDepositSuccess) handleSuccess('deposit', depositHash);
        if (isWithdrawSuccess) handleSuccess('withdraw', withdrawHash);
        if (isApproveSuccess) refetchAllowance();
    }, [isApproveSuccess, isDepositSuccess, isWithdrawSuccess, amount, depositHash, withdrawHash, refetchAllowance, refetchStakedBalance, refetchWalletBalance]);

    useEffect(() => { setAmount(''); setError(null); }, [mode]);

    const getButtonText = () => {
        if (!isConnected) return 'Connect Wallet';
        if (isProcessing) return 'Processing...';
        if (!amount || parseFloat(amount) <= 0) return 'Enter an amount';
        if (mode === 'deposit') {
            return isAllowanceSufficient ? 'Deposit' : 'Approve';
        }
        return 'Withdraw';
    };

    return (
        <div className="max-w-xl mx-auto p-4 md:p-6 animate-fade-in">
            <Link href="/earn" className="text-muted-foreground hover:text-foreground mb-4 flex items-center gap-2 text-sm">
                <ArrowLeft size={16} /> Back to Earn
            </Link>

            {/* Main Content Area */}
            {showSuccessCard && lastAction ? (
                <TransactionSuccessCard
                    action={lastAction}
                    amount={lastAmount}
                    asset={config.asset}
                    onContinue={() => setShowSuccessCard(false)}
                    onViewTx={() => latestTxHash && window.open(`https://sepolia.etherscan.io/tx/${latestTxHash}`, '_blank')}
                />
            ) : (
                <>
                    <div className="flex justify-between items-center mb-4">
                        <h2 className="text-3xl font-bold text-foreground">Stake {config.asset}</h2>
                        <ConnectButton showBalance={false} accountStatus="address" />
                    </div>
                    <p className="text-muted-foreground mb-6">Deposit your {config.asset} to the Stability Pool to earn rewards.</p>

                    <div className="bg-card/70 border rounded-2xl p-6 shadow-xl">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div className="bg-secondary/50 p-4 rounded-lg">
                                <p className="text-sm text-muted-foreground">Your Wallet Balance</p>
                                <p className="text-2xl font-bold text-foreground truncate">{Number(formattedWalletBalance).toLocaleString()} {config.asset}</p>
                            </div>
                            <div className="bg-secondary/50 p-4 rounded-lg">
                                <p className="text-sm text-muted-foreground">Your Staked Balance</p>
                                <p className="text-2xl font-bold text-foreground truncate">{Number(formattedStakedBalance).toLocaleString()} {config.asset}</p>
                            </div>
                        </div>

                        <div className="mt-6">
                            <div className="flex bg-secondary/30 rounded-lg p-1 mb-4">
                                <button onClick={() => setMode('deposit')} className={`w-1/2 py-2 rounded-md font-semibold transition-colors ${mode === 'deposit' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-secondary/50'}`}>Deposit</button>
                                <button onClick={() => setMode('withdraw')} className={`w-1/2 py-2 rounded-md font-semibold transition-colors ${mode === 'withdraw' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-secondary/50'}`}>Withdraw</button>
                            </div>

                            <div className="animate-fade-in-sm">
                                <div className="flex justify-between items-center mb-2">
                                    <Label htmlFor="amount-input" className="text-sm font-medium text-muted-foreground">Amount to {mode}</Label>
                                    <button onClick={() => setAmount(mode === 'deposit' ? formattedWalletBalance : formattedStakedBalance)} className="text-sm font-semibold text-primary hover:underline" disabled={isProcessing}>Max</button>
                                </div>
                                <div className="relative">
                                    <Input id="amount-input" type="number" placeholder="0.00" value={amount} onChange={e => setAmount(e.target.value)} disabled={isProcessing || !isConnected} className="w-full text-xl p-3 pr-20" />
                                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground font-bold">{config.asset}</span>
                                </div>
                                {error && (<Alert variant="destructive" className="mt-4"><AlertCircle className="h-4 w-4" /><AlertTitle>Transaction Error</AlertTitle><AlertDescription>{error}</AlertDescription></Alert>)}
                                <Button onClick={handleAction} disabled={!isConnected || isProcessing || !amount || parseFloat(amount) <= 0} className="mt-4 w-full font-bold py-3 text-lg flex items-center justify-center gap-2">
                                    {isProcessing ? <Loader2 size={20} className="animate-spin" /> : mode === 'deposit' ? <Plus size={20}/> : <Minus size={20}/>}
                                    {getButtonText()}
                                </Button>
                            </div>
                        </div>
                    </div>
                </>
            )}

            {/* Transaction Processing Modal */}
            <AlertDialog open={showModal}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle className="text-center text-2xl font-bold text-foreground mb-4">{modalContent.title}</AlertDialogTitle>
                        <AlertDialogDescription asChild>
                            <div className="text-center text-muted-foreground">
                                <div className="flex justify-center items-center my-8"><span className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin"></span></div>
                                <span className="break-words">{modalContent.description}</span>
                            </div>
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}
