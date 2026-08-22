import { NextResponse } from "next/server";
import { getPixel, updatePixel, deletePixel } from "@/lib/kv";

interface Params {
  params: Promise<{ pixelId: string }>;
}

export async function GET(_request: Request, { params }: Params) {
  const { pixelId } = await params;
  const pixel = await getPixel(pixelId);

  if (!pixel) {
    return NextResponse.json({ error: "Pixel not found" }, { status: 404 });
  }

  // Never return the access token
  const { accessToken: _accessToken, ...safe } = pixel;
  return NextResponse.json(safe);
}

export async function PUT(request: Request, { params }: Params) {
  const { pixelId } = await params;
  const { label, accessToken, testEventCode } = await request.json();

  const existing = await getPixel(pixelId);
  if (!existing) {
    return NextResponse.json({ error: "Pixel not found" }, { status: 404 });
  }

  const updated = await updatePixel(pixelId, {
    ...(label !== undefined && { label }),
    ...(accessToken !== undefined && accessToken !== "" && { accessToken }),
    ...(testEventCode !== undefined && { testEventCode }),
  });

  return NextResponse.json({ success: true, pixel: { ...updated, accessToken: undefined } });
}

export async function DELETE(_request: Request, { params }: Params) {
  const { pixelId } = await params;

  const existing = await getPixel(pixelId);
  if (!existing) {
    return NextResponse.json({ error: "Pixel not found" }, { status: 404 });
  }

  await deletePixel(pixelId);
  return NextResponse.json({ success: true });
}
