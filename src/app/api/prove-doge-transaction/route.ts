import { NextResponse } from "next/server"

type ProveBody = {
  txHash?: string
  proofSystem?: string
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as ProveBody
    const txHash = body?.txHash
    const proofSystem = body?.proofSystem || "plonk"

    if (!txHash || typeof txHash !== "string") {
      return NextResponse.json(
        { error: "txHash is required and must be a string" },
        { status: 400 }
      )
    }

    const upstream = await fetch(
      "http://165.22.220.156:3007/prove-doge-transaction",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ txHash, proofSystem }),
      }
    )

    const data = await upstream.json().catch(() => ({}))
    console.log("Upstream response:", data)

    if (!upstream.ok) {
      return NextResponse.json(
        {
          error:
            (data && (data.error || data.message)) ||
            "Failed to prove Dogecoin transaction",
          status: upstream.status,
        },
        { status: upstream.status }
      )
    }

    return NextResponse.json(data, { status: 200 })
  } catch (err: any) {
    return NextResponse.json(
      {
        error: "Internal server error while proving transaction",
        details: err?.message || "Unknown error",
      },
      { status: 500 }
    )
  }
}
