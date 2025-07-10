'use client';
import { useRouter } from 'next/navigation';
import { Lock, Coins } from 'lucide-react';

const vaults = [
    { id: 'doge', asset: 'DOGE', icon: 'Ð', totalLocked: '150.5M DOGE', apy: '12.8%', myDeposit: '0.00' },
    { id: 'wbtc', asset: 'wBTC', icon: '₿', totalLocked: '250.2 wBTC', apy: '8.2%', myDeposit: '0.00' },
    { id: 'eth', asset: 'ETH', icon: 'Ξ', totalLocked: '5,120 ETH', apy: '9.5%', myDeposit: '0.00' },
];

const StatCard = ({ icon, label, value }) => (
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

    const onSelectVault = (vault) => {
        router.push(`/vault/${vault.id}`);
    };

    return (
        <div className="max-w-6xl mx-auto p-4 md:p-8 animate-fade-in">
            <h2 className="text-3xl font-bold text-foreground mb-6">Vaults Dashboard</h2>

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
};
