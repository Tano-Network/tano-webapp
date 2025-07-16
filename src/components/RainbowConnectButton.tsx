import { ConnectButton } from '@rainbow-me/rainbowkit';

// Standard RainbowKit ConnectButton for wallet list modal
export function RainbowConnectButton(props: Parameters<typeof ConnectButton>[0]) {
  return <ConnectButton {...props} />;
}
