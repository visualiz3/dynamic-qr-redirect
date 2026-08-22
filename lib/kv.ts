import { kv } from "@vercel/kv";

export interface QRCode {
  url: string;
  label: string;
  /** Optional Meta Pixel ID this QR code sends scan events to */
  pixelId?: string;
  createdAt: string;
  scans: number;
}

export interface Pixel {
  /** The Meta Pixel ID itself — also the KV key */
  pixelId: string;
  label: string;
  accessToken: string;
  /** Optional Meta test event code — routes events to Test Events tab */
  testEventCode?: string;
  createdAt: string;
}

function qrKey(code: string): string {
  return `qr:${code}`;
}

function pixelKey(pixelId: string): string {
  return `pixel:${pixelId}`;
}

export async function getQR(code: string): Promise<QRCode | null> {
  return kv.get<QRCode>(qrKey(code));
}

export async function setQR(
  code: string,
  data: Omit<QRCode, "scans" | "createdAt">
): Promise<void> {
  const existing = await getQR(code);
  const qrData: QRCode = {
    ...data,
    createdAt: existing?.createdAt || new Date().toISOString(),
    scans: existing?.scans || 0,
  };
  await kv.set(qrKey(code), qrData);
}

export async function deleteQR(code: string): Promise<void> {
  await kv.del(qrKey(code));
}

export async function listQRs(): Promise<{ code: string; data: QRCode }[]> {
  const keys = await kv.keys("qr:*");
  if (keys.length === 0) return [];

  const results: { code: string; data: QRCode }[] = [];
  for (const key of keys) {
    const data = await kv.get<QRCode>(key);
    if (data) {
      const code = key.replace("qr:", "");
      results.push({ code, data });
    }
  }
  return results;
}

export async function incrementScan(code: string): Promise<void> {
  const key = qrKey(code);
  const data = await kv.get<QRCode>(key);
  if (data) {
    data.scans = (data.scans || 0) + 1;
    await kv.set(key, data);
  }
}

// ---------------------------------------------------------------------------
// Pixels — keyed by the Meta Pixel ID itself
// ---------------------------------------------------------------------------

export async function getPixel(pixelId: string): Promise<Pixel | null> {
  return kv.get<Pixel>(pixelKey(pixelId));
}

export async function createPixel(
  data: Omit<Pixel, "createdAt">
): Promise<Pixel> {
  const pixel: Pixel = {
    ...data,
    createdAt: new Date().toISOString(),
  };
  await kv.set(pixelKey(pixel.pixelId), pixel);
  return pixel;
}

export async function updatePixel(
  pixelId: string,
  data: Partial<Omit<Pixel, "pixelId" | "createdAt">>
): Promise<Pixel | null> {
  const existing = await getPixel(pixelId);
  if (!existing) return null;

  const updated: Pixel = { ...existing, ...data };
  await kv.set(pixelKey(pixelId), updated);
  return updated;
}

export async function deletePixel(pixelId: string): Promise<void> {
  await kv.del(pixelKey(pixelId));
}

/** List pixels WITHOUT access tokens — safe for API responses. */
export async function listPixelsSafe(): Promise<
  Omit<Pixel, "accessToken">[]
> {
  const keys = await kv.keys("pixel:*");
  if (keys.length === 0) return [];

  const results: Omit<Pixel, "accessToken">[] = [];
  for (const key of keys) {
    const data = await kv.get<Pixel>(key);
    if (data) {
      const { accessToken: _accessToken, ...safe } = data;
      results.push(safe);
    }
  }
  return results;
}
