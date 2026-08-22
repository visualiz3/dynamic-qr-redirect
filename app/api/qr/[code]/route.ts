import { NextResponse } from "next/server";
import { getQR, setQR, deleteQR, getPixel } from "@/lib/kv";

interface Params {
  params: Promise<{ code: string }>;
}

export async function PUT(request: Request, { params }: Params) {
  const { code } = await params;
  const { url, label, pixelId } = await request.json();

  if (!url || !label) {
    return NextResponse.json(
      { error: "Missing required fields" },
      { status: 400 }
    );
  }

  const existing = await getQR(code);
  if (!existing) {
    return NextResponse.json({ error: "QR code not found" }, { status: 404 });
  }

  // Validate the referenced pixel exists (if provided)
  if (pixelId) {
    const pixel = await getPixel(pixelId);
    if (!pixel) {
      return NextResponse.json(
        { error: "Pixel not found" },
        { status: 400 }
      );
    }
  }

  await setQR(code, { url, label, ...(pixelId && { pixelId }) });
  return NextResponse.json({ success: true });
}

export async function DELETE(_request: Request, { params }: Params) {
  const { code } = await params;

  const existing = await getQR(code);
  if (!existing) {
    return NextResponse.json({ error: "QR code not found" }, { status: 404 });
  }

  await deleteQR(code);
  return NextResponse.json({ success: true });
}
