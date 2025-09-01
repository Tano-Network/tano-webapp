import { type NextRequest, NextResponse } from "next/server"
import { DatabaseService } from "@/lib/database"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const address = searchParams.get("address")
    const vaultId = searchParams.get("vaultId")

    if (!address) {
      return NextResponse.json({ error: "Address is required" }, { status: 400 })
    }

    const latestRequest = await DatabaseService.getLatestMintRecordByAddress(address, vaultId || undefined)

    if (!latestRequest) {
      return NextResponse.json({ error: "No mint request found" }, { status: 404 })
    }

    return NextResponse.json(latestRequest)
  } catch (error) {
    console.error("Error fetching latest mint request:", error)
    return NextResponse.json({ error: "Failed to fetch latest mint request" }, { status: 500 })
  }
}
