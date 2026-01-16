import { NextResponse } from "next/server";
import { getQR, incrementScan } from "@/lib/kv";

interface Params {
  params: Promise<{ code: string }>;
}

export async function GET(_request: Request, { params }: Params) {
  const { code } = await params;

  const qr = await getQR(code);

  if (!qr) {
    return NextResponse.json({ error: "QR code not found" }, { status: 404 });
  }

  // Increment scan count (fire and forget)
  incrementScan(code).catch(console.error);

  // Redirect to the actual URL
  return NextResponse.redirect(qr.url, 302);
}
