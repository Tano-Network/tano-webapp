'use client';
import { useState } from 'react';
import { Plus, Minus } from 'lucide-react';

export default function EarnPage() {
    const [depositAmount, setDepositAmount] = useState('');
    const [withdrawAmount, setWithdrawAmount] = useState('');
    const [currentDeposit, setCurrentDeposit] = useState(5432.10);
    const [mode, setMode] = useState('deposit'); // 'deposit' or 'withdraw'

    const handleAction = () => {
        const amount = parseFloat(mode === 'deposit' ? depositAmount : withdrawAmount);
        if (isNaN(amount) || amount <= 0) return;

        if (mode === 'deposit') {
            setCurrentDeposit(prev => prev + amount);
            setDepositAmount('');
        } else {
            setCurrentDeposit(prev => Math.max(0, prev - amount));
            setWithdrawAmount('');
        }
    }

    return (
        <div className="max-w-4xl mx-auto p-4 md:p-8 animate-fade-in">
            <h2 className="text-3xl font-bold text-foreground mb-2">Earn</h2>
            <p className="text-muted-foreground mb-8">Deposit your tDOGE into the Stability Pool to earn rewards.</p>

            <div className="bg-card/70 border rounded-2xl p-6 shadow-xl">
                <h3 className="text-xl font-bold text-foreground mb-4">Stability Pool</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="bg-secondary/50 p-4 rounded-lg">
                        <p className="text-sm text-muted-foreground">Total Deposited</p>
                        <p className="text-2xl font-bold text-foreground">25.7M tDOGE</p>
                    </div>
                    <div className="bg-secondary/50 p-4 rounded-lg">
                        <p className="text-sm text-muted-foreground">Your Deposit</p>
                        <p className="text-2xl font-bold text-foreground">{currentDeposit.toLocaleString()} tDOGE</p>
                    </div>
                </div>

                <div className="mt-6">
                    <div className="flex bg-secondary/30 rounded-lg p-1 mb-4">
                        <button onClick={() => setMode('deposit')} className={`w-1/2 py-2 rounded-md font-semibold transition-colors ${mode === 'deposit' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-secondary/50'}`}>
                            Deposit
                        </button>
                        <button onClick={() => setMode('withdraw')} className={`w-1/2 py-2 rounded-md font-semibold transition-colors ${mode === 'withdraw' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-secondary/50'}`}>
                            Withdraw
                        </button>
                    </div>

                    {mode === 'deposit' ? (
                        <div className="animate-fade-in-sm">
                            <label className="text-sm font-medium text-muted-foreground block mb-2">Amount to deposit</label>
                            <div className="relative">
                                <input type="number" placeholder="0.00" value={depositAmount} onChange={e => setDepositAmount(e.target.value)} className="w-full bg-secondary border border-border rounded-lg p-3 text-foreground text-xl focus:ring-2 focus:ring-ring focus:border-ring outline-none" />
                                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground font-bold">tDOGE</span>
                            </div>
                            <button onClick={handleAction} className="mt-4 w-full bg-primary text-primary-foreground font-bold py-3 rounded-lg hover:bg-primary/90 flex items-center justify-center gap-2">
                                <Plus size={20}/> Deposit
                            </button>
                        </div>
                    ) : (
                        <div className="animate-fade-in-sm">
                            <label className="text-sm font-medium text-muted-foreground block mb-2">Amount to withdraw</label>
                            <div className="relative">
                                <input type="number" placeholder="0.00" value={withdrawAmount} onChange={e => setWithdrawAmount(e.target.value)} className="w-full bg-secondary border border-border rounded-lg p-3 text-foreground text-xl focus:ring-2 focus:ring-ring focus:border-ring outline-none" />
                                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground font-bold">tDOGE</span>
                            </div>
                            <button onClick={handleAction} className="mt-4 w-full bg-primary text-primary-foreground font-bold py-3 rounded-lg hover:bg-primary/90 flex items-center justify-center gap-2">
                                <Minus size={20}/> Withdraw
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
