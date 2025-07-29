import { NextResponse } from "next/server"
import { DatabaseService } from "@/lib/database"

// GET endpoint to retrieve mint requests for a specific EVM address
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const evmAddress = searchParams.get("address")

  if (!evmAddress) {
    return NextResponse.json({ error: "EVM address is required" }, { status: 400 })
  }

  try {
    const requests = await DatabaseService.getMintRequestsByEvmAddress(evmAddress)

    return NextResponse.json({
      requests: requests.map((request) => ({
        id: request.id,
        vaultId: request.vaultId,
        vaultChain: request.vaultChain,
        amount: request.amount,
        transactionHash: request.transactionHash,
        utxo: request.utxo,
        whitelisted: request.whitelisted,
        mintTxLink: request.mintTxLink,
        status: request.status,
        createdAt: request.createdAt,
        updatedAt: request.updatedAt,
      })),
    })
  } catch (error) {
    console.error("Error fetching mint requests:", error)
    return NextResponse.json({ error: "An error occurred while fetching mint requests" }, { status: 500 })
  }
}

// PATCH endpoint for admin to update mint request status (whitelist/mint)
export async function PATCH(req: Request) {
  const { requestId, whitelisted, mintTxLink, status } = await req.json()

  if (!requestId) {
    return NextResponse.json({ error: "Request ID is required" }, { status: 400 })
  }

  try {
    const updatedRequest = await DatabaseService.updateMintRequest(requestId, {
      whitelisted,
      mintTxLink,
      status,
    })

    if (!updatedRequest) {
      return NextResponse.json({ error: "Mint request not found" }, { status: 404 })
    }

    return NextResponse.json({
      message: "Mint request updated successfully",
      request: updatedRequest,
    })
  } catch (error) {
    console.error("Error updating mint request:", error)
    return NextResponse.json({ error: "An error occurred while updating the mint request" }, { status: 500 })
  }
}
