import { NextResponse } from "next/server"
import { DatabaseService, initDB } from "@/lib/database"

export async function POST(req: Request) {
  try {
    console.log("Redeem API: Starting request processing...")

    const {
      evmAddress,
      evmChain,
      evmChainId,
      asset,
      amount,
      burnTxHash,
      nativeRecipientAddress,
      status = "pending",
    } = await req.json()

    console.log("Redeem API: Received request data:", {
      evmAddress,
      evmChain,
      evmChainId,
      asset,
      amount,
      burnTxHash,
      nativeRecipientAddress,
      status,
    })

    // Validate required fields
    if (!evmAddress || !evmChain || !evmChainId || !asset || !amount || !burnTxHash || !nativeRecipientAddress) {
      console.log("Redeem API: Missing required fields")
      return NextResponse.json(
        {
          message: "Missing required fields",
          status: "error",
        },
        { status: 400 },
      )
    }

    // Validate burn transaction hash format
    if (!burnTxHash || burnTxHash.length < 10) {
      console.log("Redeem API: Invalid burn transaction hash")
      return NextResponse.json(
        {
          message: "Invalid burn transaction hash",
          status: "error",
        },
        { status: 400 },
      )
    }

    // Initialize database
    console.log("Redeem API: Initializing database...")
    await initDB()

    // Check for duplicate burn transaction hash
    console.log("Redeem API: Checking for duplicate burn transaction...")
    const existingRequest = await DatabaseService.getRedeemRequestByBurnTxHash(burnTxHash)

    if (existingRequest) {
      console.log("Redeem API: Duplicate burn transaction found")
      return NextResponse.json(
        {
          message: "This burn transaction has already been used for a redeem request.",
          status: "error",
        },
        { status: 400 },
      )
    }

    // Create new redeem request
    console.log("Redeem API: Creating new redeem request...")
    const newRequest = await DatabaseService.createRedeemRequest({
      evmAddress,
      evmChain,
      evmChainId,
      asset,
      amount,
      burnTxHash,
      nativeRecipientAddress,
      status,
    })

    console.log("Redeem API: Successfully created redeem request:", newRequest.id)

    return NextResponse.json({
      message: "Redeem request submitted successfully! Your native tokens will be sent within 7 days.",
      status: "success",
      requestId: newRequest.id,
      data: newRequest,
    })
  } catch (error: any) {
    console.error("Redeem API: Error processing request:", error)
    return NextResponse.json(
      {
        message: "An error occurred while processing your redeem request. Please try again.",
        status: "error",
        error: error.message,
      },
      { status: 500 },
    )
  }
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const address = searchParams.get("address")
    const vaultId = searchParams.get("vaultId")

    console.log("Redeem API GET: Fetching requests for address:", address, "vaultId:", vaultId)

    if (!address) {
      return NextResponse.json({ message: "Address parameter is required", status: "error" }, { status: 400 })
    }

    await initDB()

    // Map vaultId to asset if provided
    let asset: string | undefined
    if (vaultId) {
      const assetMap: Record<string, string> = {
        tdoge: "DOGE",
        tltc: "LTC",
        tbch: "BCH",
      }
      asset = assetMap[vaultId.toLowerCase()]
    }

    const requests = await DatabaseService.getRedeemRequestsByAddress(address, vaultId as string | undefined)

    console.log(`Redeem API GET: Found ${requests.length} requests`)

    return NextResponse.json({
      requests,
      status: "success",
    })
  } catch (error: any) {
    console.error("Redeem API GET: Error fetching requests:", error)
    return NextResponse.json(
      {
        message: "Failed to fetch redeem requests",
        status: "error",
        error: error.message,
      },
      { status: 500 },
    )
  }
}
