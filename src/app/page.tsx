import { Layers, TrendingUp, Shield, ChevronsRight } from 'lucide-react';
import Link from 'next/link';
import { HomeHeader } from '@/components/HomeHeader';

const StatCard = ({ icon, label, value, subValue }) => (
  <div className="bg-card/50 backdrop-blur-sm p-6 rounded-2xl border border-border/50 flex flex-col items-start shadow-lg hover:bg-card/80 transition-all duration-300">
    <div className="bg-primary/10 p-3 rounded-xl mb-4 border border-primary/20">
      {icon}
    </div>
    <p className="text-muted-foreground text-sm mb-1">{label}</p>
    <p className="text-2xl font-bold text-foreground">{value}</p>
    {subValue && <p className="text-sm text-green-500 dark:text-green-400">{subValue}</p>}
  </div>
);

export default function HomePage() {
  return (
    <>
      <HomeHeader />
      <div className="text-foreground text-center py-20 px-4">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-6xl md:text-8xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary to-purple-500 mb-4 animate-fade-in-down">
            Tano Finance
          </h1>
          <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-12 animate-fade-in-up">
            Unlock the power of your Dogecoin. Earn yield and participate in a decentralized financial ecosystem.
          </p>
          <div className="flex justify-center mb-20">
            <Link href="/vault" className="bg-primary text-primary-foreground font-bold py-3 px-8 rounded-full hover:bg-primary/90 transition-transform transform hover:scale-105 shadow-lg shadow-primary/20 text-lg flex items-center gap-2">
              Launch App <ChevronsRight size={20} />
            </Link>
          </div>
        </div>

        <div className="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-6 animate-fade-in">
          <StatCard
            icon={<Layers size={24} className="text-primary" />}
            label="Total Value Locked"
            value="$12.3M"
            subValue="+2.5% (24h)"
          />
          <StatCard
            icon={<TrendingUp size={24} className="text-primary" />}
            label="Current APY"
            value="15.2%"
            subValue="on Stability Pool"
          />
          <StatCard
            icon={<Shield size={24} className="text-primary" />}
            label="Vaults Active"
            value="3"
            subValue="More coming soon"
          />
        </div>
      </div>
    </>
  )
}
