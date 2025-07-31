import { type NextRequest, NextResponse } from "next/server"
import { DatabaseService, initDB } from "@/lib/database"

export async function GET(request: NextRequest) {
  try {
    // Initialize database
    await initDB()

    const { searchParams } = new URL(request.url)
    const address = searchParams.get("address")

    let requests
    if (address) {
      // Get requests for specific address
      requests = await DatabaseService.getMintRequestsByEvmAddress(address)
    } else {
      // Get all requests
      requests = await DatabaseService.getAllMintRequests()
    }

    return NextResponse.json({
      success: true,
      requests,
      count: requests.length,
    })
  } catch (error) {
    console.error("Error fetching mint requests:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch mint requests",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    // Initialize database
    await initDB()

    const body = await request.json()
    console.log("Received mint request:", body)

    // Validate required fields
    const requiredFields = [
      "evmAddress",
      "evmChain",
      "evmChainId",
      "vaultId",
      "vaultChain",
      "userVaultChainAddress",
      "amount",
      "utxo",
      "transactionHash",
      "proof",
    ]

    for (const field of requiredFields) {
      if (!body[field]) {
        return NextResponse.json(
          {
            success: false,
            error: `Missing required field: ${field}`,
          },
          { status: 400 },
        )
      }
    }

    // Check if request with this transaction hash already exists
    const existingRequest = await DatabaseService.getMintRequestByTxHash(body.transactionHash)
    if (existingRequest) {
      return NextResponse.json(
        {
          success: false,
          error: "A mint request with this transaction hash already exists",
          existingRequest,
        },
        { status: 409 },
      )
    }

    // Create the mint request
    const mintRequest = await DatabaseService.createMintRequest({
      evmAddress: body.evmAddress,
      evmChain: body.evmChain,
      evmChainId: body.evmChainId,
      vaultId: body.vaultId,
      vaultChain: body.vaultChain,
      userVaultChainAddress: body.userVaultChainAddress,
      amount: body.amount,
      utxo: body.utxo,
      transactionHash: body.transactionHash,
      whitelisted: false,
      mintTxLink: body.mintTxLink || null,
      proof: body.proof,
      status: "pending",
      requestType: "retail",
    })

    console.log("Created mint request:", mintRequest)

    return NextResponse.json({
      success: true,
      request: mintRequest,
      message: "Mint request created successfully",
    })
  } catch (error) {
    console.error("Error creating mint request:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Failed to create mint request",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}

export async function PUT(request: NextRequest) {
  try {
    // Initialize database
    await initDB()

    const body = await request.json()
    const { id, ...updates } = body

    if (!id) {
      return NextResponse.json(
        {
          success: false,
          error: "Missing request ID",
        },
        { status: 400 },
      )
    }

    // Update the mint request
    const updatedRequest = await DatabaseService.updateMintRequest(id, updates)

    if (!updatedRequest) {
      return NextResponse.json(
        {
          success: false,
          error: "Mint request not found",
        },
        { status: 404 },
      )
    }

    return NextResponse.json({
      success: true,
      request: updatedRequest,
      message: "Mint request updated successfully",
    })
  } catch (error) {
    console.error("Error updating mint request:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Failed to update mint request",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
