import { NextResponse } from "next/server"
import { DatabaseService, initDB } from "@/lib/database"

export async function POST(req: Request) {
  const {
    evmAddress,
    evmChain,
    evmChainId,
    vaultId,
    vaultName,
    vaultChain,
    userVaultChainAddress,
    transactionHash,
    amount,
    utxo,
    proof,
    requestType,
  } = await req.json()

  console.log("Received mint request:")
  console.log("EVM Address:", evmAddress)
  console.log("EVM Chain:", evmChain)
  console.log("EVM Chain ID:", evmChainId)
  console.log("Vault ID:", vaultId)
  console.log("Vault Chain:", vaultChain)
  console.log("User Vault Chain Address:", userVaultChainAddress)
  console.log("Transaction Hash:", transactionHash)
  console.log("Amount:", amount)
  console.log("UTXO:", utxo)
  console.log("Request Type:", requestType)

  try {
    // Double-check if transaction hash already exists
    initDB();
    console.log("Checking if transaction hash already exists...")
    const existingRequest = await DatabaseService.getMintRequestByTxHash(transactionHash)

    if (existingRequest) {
      return NextResponse.json(
        {
          message: "This transaction has already been used for a mint request.",
          status: "error",
        },
        { status: 400 },
      )
    }

    // Create new mint request record
    const newRequest = await DatabaseService.createMintRequest({
      evmAddress,
      evmChain,
      evmChainId,
      vaultId,
      vaultChain,
      userVaultChainAddress,
      amount,
      utxo,
      transactionHash,
      whitelisted: false, // Will be set to true after admin approval
      proof,
      status: "verified", // Transaction is verified, pending whitelist approval
      requestType: requestType || "retail",
    })

    console.log("Mint request record created:", newRequest)

    return NextResponse.json({
      message: "Mint request successfully recorded and is pending admin approval for token minting.",
      status: "success",
      requestId: newRequest.id,
      details: {
        evmAddress,
        vaultId,
        amount,
        transactionHash,
        utxo,
        requestType,
        recordedAt: newRequest.createdAt,
      },
    })
  } catch (error: any) {
    console.error("Mint request error:", error)
    return NextResponse.json(
      {
        message: "An error occurred while recording your mint request. Please try again.",
        status: "error",
      },
      { status: 500 },
    )
  }
}
