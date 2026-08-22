import { NextResponse } from "next/server";
import { getPixel, updatePixel, deletePixel, toSafePixel } from "@/lib/kv";

interface Params {
  params: Promise<{ pixelId: string }>;
}

export async function GET(_request: Request, { params }: Params) {
  const { pixelId } = await params;
  const pixel = await getPixel(pixelId);

  if (!pixel) {
    return NextResponse.json({ error: "Pixel not found" }, { status: 404 });
  }

  return NextResponse.json(toSafePixel(pixel));
}

export async function PUT(request: Request, { params }: Params) {
  const { pixelId } = await params;
  const { label, accessToken, testEventCode } = await request.json();

  const updated = await updatePixel(pixelId, {
    ...(label !== undefined && { label }),
    ...(accessToken !== undefined && accessToken !== "" && { accessToken }),
    ...(testEventCode !== undefined && { testEventCode }),
  });

  if (!updated) {
    return NextResponse.json({ error: "Pixel not found" }, { status: 404 });
  }

  return NextResponse.json({ success: true, pixel: toSafePixel(updated) });
}

export async function DELETE(_request: Request, { params }: Params) {
  const { pixelId } = await params;

  const deleted = await deletePixel(pixelId);
  if (!deleted) {
    return NextResponse.json({ error: "Pixel not found" }, { status: 404 });
  }

  return NextResponse.json({ success: true });
}
