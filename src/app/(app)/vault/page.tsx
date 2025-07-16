'use client';

import { useRouter } from 'next/navigation';
import { Lock, Coins } from 'lucide-react';
import { RainbowConnectButton } from '@/components/RainbowConnectButton';
import { useAccount } from 'wagmi';
import { useEffect, useState } from 'react';
import { BrowserProvider, ethers, Typed } from 'ethers';
import assetManagementAbi from '@/abi/assetManagement.json';

const vaults = [
    {
        id: 'doge',
        asset: 'DOGE',
        icon: 'Ð',
        totalLocked: '150.5M tDOGE',
        apy: '12.8%',
        myDeposit: '0.00',
        whitelistContract: `0x6183367a204F2E2E9638d2ee5fDb281dB6f42F48`,
        whitelistAbi: assetManagementAbi
    },
    {
        id: 'litecoin',
        asset: 'LTC',
        icon: 'Ł',
        totalLocked: '250.2 tltc',
        apy: '8.2%',
        myDeposit: '0.00',
        whitelistContract: '0x0000000000000000000000000000000000000000', // TODO: replace with actual contract
        whitelistAbi: assetManagementAbi
    },
    {
        id: 'bitcoin_cash',
        asset: 'BCH',
        icon: '₿',
        totalLocked: '5,120 tbch',
        apy: '9.5%',
        myDeposit: '0.00',
        whitelistContract: '0x0000000000000000000000000000000000000000', // TODO: replace with actual contract
        whitelistAbi: assetManagementAbi
    },
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
    
    const [whitelistStatus, setWhitelistStatus] = useState<Record<string, boolean | null>>({});

    useEffect(() => {
    if (!isConnected || !address) return;

    async function checkAllVaults() {
        const provider = new BrowserProvider((window as any).ethereum);

        const statusUpdates = await Promise.all(
            vaults.map(async (vault) => {
                const { whitelistContract, whitelistAbi, id } = vault;

                if (
                    !whitelistContract ||
                    whitelistContract === '0x0000000000000000000000000000000000000000'
                ) {
                    console.warn(`Vault ${id} has no valid whitelist contract.`);
                    return { id, whitelisted: null };
                }
                console.log(`Checking whitelist for vault ${id}...`);
                const code = await provider.getCode(whitelistContract);
if (!code || code === "0x") {
    console.warn(`Contract at ${whitelistContract} does not exist`);
    return { id, whitelisted: null };
}

                try {
                    const contract = new ethers.Contract(whitelistContract, whitelistAbi, provider);

                    // Ensure method exists in ABI
                    if (!contract.interface.getFunction("isWhitelisted")) {
                        console.warn(`Contract for vault ${id} does not have isWhitelisted(address)`);
                        return { id, whitelisted: null };
                    }

                    const whitelisted = await contract.isWhitelisted(address);
                    console.log(`Whitelist status for vault ${id}: ${whitelisted}`);
                    if(whitelisted) console.log("Whitelisted");
                    return { id, whitelisted };
                } catch (err) {
                    console.error(`Error checking whitelist for vault ${id}:`, err);
                    return { id, whitelisted: false };
                }
            })
        );

        const newStatus: Record<string, boolean | null> = {};
        for (const { id, whitelisted } of statusUpdates) {
            newStatus[id] = whitelisted;
        }

        setWhitelistStatus(newStatus);
    }

    checkAllVaults();
}, [isConnected, address, vaults]);


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

    // ...existing code...


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
        <div className="max-w-6xl mx-auto p-4 md:p-8 animate-fade-in relative">
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
            <div className="relative">
                {/* Overlay if not whitelisted - handled per vault row below */}
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
                {vaults.map((vault) => {
                    const isWhitelisted = whitelistStatus[vault.id];
                    return (
                        <tr key={vault.id} className="border-t hover:bg-muted/50 transition-colors duration-200 relative">
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
                                <button
                                    onClick={() => onSelectVault(vault)}
                                    className="bg-primary text-primary-foreground font-semibold py-2 px-4 rounded-lg hover:bg-primary/90 transition-all"
                                    disabled={isWhitelisted === false}
                                >
                                    Mint
                                </button>
                            </td>
                            {isWhitelisted === false && (
                                <td className="absolute inset-0 z-10 flex items-center justify-center bg-black/60 backdrop-blur-sm rounded-2xl" colSpan={5}>
                                    <div className="bg-card border border-destructive rounded-xl p-4 flex flex-col items-center">
                                        <p className="text-base font-semibold text-destructive mb-1">Not whitelisted for {vault.asset}</p>
                                        <p className="text-xs text-muted-foreground">Minting is blocked for your account.</p>
                                    </div>
                                </td>
                            )}
                        </tr>
                    );
                })}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );
}
