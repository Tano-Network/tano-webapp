"use client"

import { Button } from "@/components/ui/button"
import { ArrowLeft } from "lucide-react"
import { useRouter } from "next/navigation"


interface BackButtonProps {
  href?: string;
  children?: React.ReactNode;
}

export function BackButton({ href, children }: BackButtonProps) {
  const router = useRouter();

  const handleClick = () => {
    if (href) {
      router.push(href);
    } else {
      router.back();
    }
  };

  return (
    <Button variant="outline" onClick={handleClick} className="flex items-center gap-2">
      <ArrowLeft size={16} />
      {children || "Back"}
    </Button>
  );
}
