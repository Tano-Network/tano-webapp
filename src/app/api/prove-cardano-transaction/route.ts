import { NextResponse } from "next/server"

type ProveBody = {
  txHash?: string
  proofSystem?: string
  ownerAddress?: string
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as ProveBody
    const txHash = body?.txHash
    const proofSystem = body?.proofSystem || "plonk"
    const ownerAddress = body?.ownerAddress

    if (!txHash || typeof txHash !== "string") {
      return NextResponse.json(
        { error: "txHash is required and must be a string" },
        { status: 400 }
      )
    }

    const upstream = await fetch(
      "http://165.22.220.156:4000/prove-cardano-transaction",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ ownerAddress, txHash, proofSystem }),
      }
    )

    const data = await upstream.json().catch(() => ({}))
    console.log("Upstream response:", data)

    if (!upstream.ok) {
      return NextResponse.json(
        {
          error:
            (data && (data.error || data.message)) ||
            "Failed to prove Cardano transaction",
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
