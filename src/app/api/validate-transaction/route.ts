import { NextResponse } from "next/server"
import { TatumService } from "@/lib/tatum"
import { DatabaseService, initDB } from "@/lib/database"

export async function POST(req: Request) {
  const { transactionHash, userVaultChainAddress, vaultId, vaultChain, depositAddress } = await req.json()

  console.log("Validating transaction:")
  console.log("Transaction Hash:", transactionHash)
  console.log("User Vault Chain Address:", userVaultChainAddress)
  console.log("Vault ID:", vaultId)
  console.log("Vault Chain:", vaultChain)
  console.log("Expected Deposit Address:", depositAddress)

  try {
    // Check if transaction hash already exists in database
    initDB()
    const existingRequest = await DatabaseService.getMintRequestByTxHash(transactionHash)

    if (existingRequest) {
      return NextResponse.json(
        {
          isValid: false,
          message: "This transaction has already been used for a mint request.",
        },
        { status: 400 },
      )
    }

    // Verify transaction using Tatum API with enhanced verification
    console.log("Verifying transaction...")
    console.log("Vault Chain:", vaultChain)
    console.log("Transaction Hash:", transactionHash)
    console.log("User Vault Chain Address:", userVaultChainAddress)
    console.log("Expected Deposit Address:", depositAddress)
    const transactionDetails = await TatumService.verifyTransactionWithFromLookup(
      vaultChain,
      transactionHash,
      userVaultChainAddress,
      depositAddress,
    )

    if (!transactionDetails) {
      return NextResponse.json(
        {
          isValid: false,
          message: "Transaction not found or could not be verified on the blockchain.",
        },
        { status: 400 },
      )
    }

    console.log("Transaction validation successful:", transactionDetails)

    return NextResponse.json({
      isValid: true,
      message: "Transaction successfully validated and ready for mint request submission.",
      transactionDetails: {
        amount: transactionDetails.amount,
        fromAddress: transactionDetails.fromAddress,
        toAddress: transactionDetails.toAddress,
        confirmations: transactionDetails.confirmations,
        utxo: transactionDetails.utxo,
      },
    })
  } catch (error: any) {
    console.error("Transaction validation error:", error)
    return NextResponse.json(
      {
        isValid: false,
        message: error.message || "An error occurred during transaction validation.",
      },
      { status: 500 },
    )
  }
}
