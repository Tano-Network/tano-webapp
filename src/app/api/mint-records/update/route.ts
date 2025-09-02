import { type NextRequest, NextResponse } from "next/server";
import { DatabaseService } from "@/lib/database";

export async function PUT(req: NextRequest) {
  console.log("Received mint record update request");
  console.log(req);
  try {
    const body = await req.json();
    console.log(
      "Received mint record update request:",
      JSON.stringify(body, null, 2)
    );
    const record = await DatabaseService.updateMintRecord(body.nativeTxHash, {
      status: body.status,
      minting_hash: body.mintTxHash,
    });
    console.log("Updated mint record:", JSON.stringify(record, null, 2));
    return NextResponse.json(record, { status: 200 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
