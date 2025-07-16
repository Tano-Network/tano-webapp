'use client';

import { useRouter } from 'next/navigation';
import { Lock, Coins } from 'lucide-react';
import { RainbowConnectButton } from '@/components/RainbowConnectButton';
import { useAccount } from 'wagmi';
import { useEffect, useState } from 'react';
import { ethers } from 'ethers';

const vaults = [
    { id: 'doge', asset: 'DOGE', icon: 'Ð', totalLocked: '150.5M tDOGE', apy: '12.8%', myDeposit: '0.00' },
    { id: 'litecoin', asset: 'LTC', icon: 'Ł', totalLocked: '250.2 tltc', apy: '8.2%', myDeposit: '0.00' },
    { id: 'bitcoin_cash', asset: 'BCH', icon: '₿', totalLocked: '5,120 tbch', apy: '9.5%', myDeposit: '0.00' },
];

const StatCard = ({ icon, label, value }:any) => (
    <div className="bg-card p-4 rounded-lg flex items-center gap-4 border">
      <div className="bg-primary/10 p-3 rounded-xl border border-primary/20">
        {icon}
      </div>
      <div>
        <p className="text-sm text-muted-foreground">{label}</p>
        <p className="text-xl font-bold text-foreground">{value}</p>
      </div>
    </div>
  );


export default function VaultsPage() {
    const router = useRouter();
    const { address, isConnected, chain } = useAccount();
    const [isWhitelisted, setIsWhitelisted] = useState<boolean | null>(null);

    useEffect(() => {
        if (isConnected && address) {
            console.log('Connected address:', address);
            // Placeholder: Replace with your actual contract address and ABI
            const WHITELIST_CONTRACT = '0x0000000000000000000000000000000000000000';
            const ABI = [
                'function isWhitelisted(address user) view returns (bool)'
            ];
            async function checkWhitelist() {
                try {
                    const provider = new ethers.providers.Web3Provider(window.ethereum);
                    const contract = new ethers.Contract(WHITELIST_CONTRACT, ABI, provider);
                    const whitelisted = await contract.isWhitelisted(address);
                    setIsWhitelisted(whitelisted);
                    console.log('Whitelist check:', whitelisted);
                } catch (err) {
                    setIsWhitelisted(false);
                    console.error('Whitelist check error:', err);
                }
            }
            checkWhitelist();
        }
    }, [isConnected, address]);

    // UI for wallet connect
    if (!isConnected) {
        console.log('Wallet not connected');
        return (
            <div className="max-w-6xl mx-auto p-4 md:p-8 animate-fade-in flex flex-col items-center justify-center min-h-[60vh]">
                <div className="bg-card border rounded-xl p-8 flex flex-col items-center">
                    <p className="text-xl font-semibold text-foreground mb-4">To access this page, connect your wallet.</p>
                    <div className="mb-4">
                        <RainbowConnectButton />
                    </div>
                </div>
            </div>
        );
    }

    if (isWhitelisted === false) {
        return (
            <div className="max-w-6xl mx-auto p-4 md:p-8 animate-fade-in flex flex-col items-center justify-center min-h-[60vh]">
                <div className="bg-card border rounded-xl p-8 flex flex-col items-center">
                    <p className="text-xl font-semibold text-destructive mb-4">Your address is not whitelisted.</p>
                </div>
            </div>
        );
    }


    // UI for connected wallet
    const WalletInfo = () => {
        useEffect(() => {
            console.log('Vault page: chain', chain);
        }, [chain]);
        return (
            <div className="flex items-center gap-4 mb-8">
                <div className="bg-card border rounded-lg px-4 py-2 flex flex-col md:flex-row md:items-center gap-2">
                    <span className="text-sm text-muted-foreground">Network:</span>
                    <span className="font-semibold text-primary">{chain?.name || 'Unknown'}</span>
                    <span className="hidden md:inline-block mx-2 text-muted-foreground">|</span>
                    <span className="text-sm text-muted-foreground">Address:</span>
                    <span className="font-mono text-xs bg-secondary rounded px-2 py-1">{address}</span>
                    <span className="ml-2"><RainbowConnectButton /></span>
                </div>
            </div>
        );
    }

    const onSelectVault = (vault:any) => {
        router.push(`/vault/${vault.id}`);
    };

    return (
        <div className="max-w-6xl mx-auto p-4 md:p-8 animate-fade-in">
            <h2 className="text-3xl font-bold text-foreground mb-6">Vaults Dashboard</h2>
            <WalletInfo />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                <StatCard
                    icon={<Lock size={24} className="text-primary" />}
                    label="Total DOGE Locked"
                    value="150.5M DOGE"
                />
                <StatCard
                    icon={<Coins size={24} className="text-primary" />}
                    label="Total t-DOGE Minted"
                    value="148.2M t-DOGE"
                />
            </div>

            <h3 className="text-2xl font-bold text-foreground mb-4">Available Vaults</h3>
            <div className="bg-card/70 border rounded-2xl overflow-hidden shadow-xl">
                <div className="overflow-x-auto">
                    <table className="w-full min-w-[640px] text-left text-foreground">
                        <thead className="bg-secondary/50">
                            <tr>
                                <th className="p-4 font-semibold">Asset</th>
                                <th className="p-4 font-semibold">Total Locked</th>
                                <th className="p-4 font-semibold">APY</th>
                                <th className="p-4 font-semibold">My Deposit</th>
                                <th className="p-4 font-semibold"></th>
                            </tr>
                        </thead>
                        <tbody>
                            {vaults.map((vault) => (
                                <tr key={vault.id} className="border-t hover:bg-muted/50 transition-colors duration-200">
                                    <td className="p-4 flex items-center gap-3">
                                        <div className="bg-primary/10 text-primary rounded-full h-10 w-10 flex items-center justify-center text-xl font-bold border border-primary/20 flex-shrink-0">
                                            {vault.icon}
                                        </div>
                                        <span className="font-bold text-foreground">{vault.asset}</span>
                                    </td>
                                    <td className="p-4">{vault.totalLocked}</td>
                                    <td className="p-4 text-green-600 dark:text-green-400">{vault.apy}</td>
                                    <td className="p-4">{vault.myDeposit}</td>
                                    <td className="p-4 text-right">
                                        <button onClick={() => onSelectVault(vault)} className="bg-primary text-primary-foreground font-semibold py-2 px-4 rounded-lg hover:bg-primary/90 transition-all">
                                            Deposit
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
