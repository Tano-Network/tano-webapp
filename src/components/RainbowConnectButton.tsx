// components/RainbowConnectButton.tsx
'use client'; // This is still necessary for client-side components in Next.js
import { ConnectButton } from '@rainbow-me/rainbowkit';

export function RainbowConnectButton(props: Parameters<typeof ConnectButton>[0]) {
  return (
    <ConnectButton
      accountStatus="address"
      chainStatus="icon"
      showBalance={false}
      // You can still pass props to override individual button settings if needed
      {...props}
    />
  );
}
