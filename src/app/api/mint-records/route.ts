import { type NextRequest, NextResponse } from "next/server"
import { DatabaseService } from "@/lib/database"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    console.log("Received mint record creation request:", JSON.stringify(body, null, 2))

    const { evmChainId, evmChain, vaultId, vaultName, userAddress, userAddressNative, nativeTxHash, mintTxHash, amount, status, proofData } = body

    // Validate required fields
    if (!evmChainId || !evmChain || !vaultId || !vaultName || !userAddress || !userAddressNative || !nativeTxHash || !amount || !proofData) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }
    enum statuses {'pending','verified','whitelisted','minted','rejected' }
    // Create mint record
    const mintRecord = await DatabaseService.createMintRecord({
      evmAddress: userAddress,
      evmChain: evmChain || "ethereum", // Default to ethereum
      evmChainId: evmChainId || 1, // Default to mainnet
      vaultId,
      vaultChain: vaultName , // Default vault chain
      userVaultChainAddress: userAddressNative,
      amount: amount.toString(),
      utxo: nativeTxHash, // Using native tx hash as UTXO reference
      native_hash: nativeTxHash,
      minting_hash: mintTxHash,
      verified: true, // Since we're creating after validation
      whitelisted: false,
      proof: JSON.stringify(proofData),
      status: status || "minted"
    })

    console.log("Successfully created mint record:", mintRecord.id)

    return NextResponse.json({
      success: true,
      record: mintRecord,
    })
  } catch (error) {
    console.error("Error creating mint record:", error)
    return NextResponse.json({ error: "Failed to create mint record" }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const address = searchParams.get("address")

    if (address) {
      const records = await DatabaseService.getMintRecordsByEvmAddress(address)
      return NextResponse.json({ records })
    } else {
      const records = await DatabaseService.getAllMintRecords()
      return NextResponse.json({ records })
    }
  } catch (error) {
    console.error("Error fetching mint records:", error)
    return NextResponse.json({ error: "Failed to fetch mint records" }, { status: 500 })
  }
}
