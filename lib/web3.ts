import { BrowserProvider } from "ethers"

export const getProvider = () => {
  if (typeof window !== "undefined" && window.ethereum) {
    return new BrowserProvider(window.ethereum)
  }
  throw new Error("No Web3 provider found")
}

export const formatAddress = (address: string, chars = 4): string => {
  if (!address) return ""
  return `${address.slice(0, chars + 2)}...${address.slice(-chars)}`
}

export const formatNumber = (num: number, decimals = 2): string => {
  if (num >= 1e9) {
    return `${(num / 1e9).toFixed(decimals)}B`
  }
  if (num >= 1e6) {
    return `${(num / 1e6).toFixed(decimals)}M`
  }
  if (num >= 1e3) {
    return `${(num / 1e3).toFixed(decimals)}K`
  }
  return num.toFixed(decimals)
}
