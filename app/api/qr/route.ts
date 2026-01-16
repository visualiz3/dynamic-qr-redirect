import { NextResponse } from "next/server";
import { listQRs, setQR, getQR } from "@/lib/kv";

export async function GET() {
  const qrs = await listQRs();
  return NextResponse.json(qrs);
}

export async function POST(request: Request) {
  const { code, url, label } = await request.json();

  if (!code || !url || !label) {
    return NextResponse.json(
      { error: "Missing required fields" },
      { status: 400 }
    );
  }

  // Validate code format (alphanumeric, hyphens, underscores only)
  if (!/^[a-zA-Z0-9_-]+$/.test(code)) {
    return NextResponse.json(
      { error: "Code can only contain letters, numbers, hyphens, and underscores" },
      { status: 400 }
    );
  }

  // Check if code already exists
  const existing = await getQR(code);
  if (existing) {
    return NextResponse.json(
      { error: "Code already exists" },
      { status: 409 }
    );
  }

  await setQR(code, { url, label });
  return NextResponse.json({ success: true });
}
