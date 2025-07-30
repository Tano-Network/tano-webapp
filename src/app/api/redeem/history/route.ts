import { NextResponse } from "next/server"
import { DatabaseService, initDB } from "@/lib/database"

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const address = searchParams.get("address")
    const vaultId = searchParams.get("vaultId")

    console.log("Redeem History API: Fetching history for address:", address, "vaultId:", vaultId)

    if (!address) {
      return NextResponse.json({ message: "Address parameter is required", status: "error" }, { status: 400 })
    }

    await initDB()

    // Map vaultId to asset
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

    console.log(`Redeem History API: Found ${requests.length} historical requests`)

    return NextResponse.json({
      history: requests,
      status: "success",
      count: requests.length,
    })
  } catch (error: any) {
    console.error("Redeem History API: Error fetching history:", error)
    return NextResponse.json(
      {
        message: "Failed to fetch redeem history",
        status: "error",
        error: error.message,
      },
      { status: 500 },
    )
  }
}
