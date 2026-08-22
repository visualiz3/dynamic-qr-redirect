import { NextResponse } from "next/server";
import { listPixelsSafe, createPixel, getPixel, toSafePixel } from "@/lib/kv";

export async function GET() {
  const pixels = await listPixelsSafe();
  return NextResponse.json(pixels);
}

export async function POST(request: Request) {
  const { label, pixelId, accessToken, testEventCode } = await request.json();

  if (!label || !pixelId || !accessToken) {
    return NextResponse.json(
      { error: "Missing required fields: label, pixelId, accessToken" },
      { status: 400 }
    );
  }

  // Validate pixel ID format — Meta pixel IDs are numeric
  if (!/^\d{10,20}$/.test(pixelId)) {
    return NextResponse.json(
      { error: "Pixel ID must be numeric (10-20 digits)" },
      { status: 400 }
    );
  }

  // Reject duplicates — otherwise the existing pixel's token/config would be
  // silently overwritten
  const existing = await getPixel(pixelId);
  if (existing) {
    return NextResponse.json(
      { error: "A pixel with this Pixel ID already exists" },
      { status: 409 }
    );
  }

  const pixel = await createPixel({
    label,
    pixelId,
    accessToken,
    testEventCode: testEventCode || undefined,
  });

  return NextResponse.json({ success: true, pixel: toSafePixel(pixel) });
}
