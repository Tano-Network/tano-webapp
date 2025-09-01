import { VAULTS, Vault } from "@/lib/constants";
import { notFound } from "next/navigation";

export function generateStaticParams() {
  return VAULTS.map((vault) => ({
    id: vault.id,
  }));
}

export async function generateMetadata({ params }: { params: { id: string } }) {
  const vault = VAULTS.find((v) => v.id === params.id);
  if (!vault) {
    return {
      title: "Vault Not Found",
    };
  }
  return {
    title: `Earn ${vault.asset}`,
    description: `Stake your ${vault.asset} to earn rewards.`,
  };
}

export default function EarnLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
