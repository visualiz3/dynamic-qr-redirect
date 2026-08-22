import { NextResponse } from "next/server";
import { listPixelsSafe, createPixel } from "@/lib/kv";

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

  const pixel = await createPixel({
    label,
    pixelId,
    accessToken,
    testEventCode: testEventCode || undefined,
  });

  // Never echo the access token back
  return NextResponse.json({
    success: true,
    pixel: { ...pixel, accessToken: undefined },
  });
}
