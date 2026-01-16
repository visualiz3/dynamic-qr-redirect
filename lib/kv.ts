import { kv } from "@vercel/kv";

export interface QRCode {
  url: string;
  label: string;
  createdAt: string;
  scans: number;
}

function qrKey(code: string): string {
  return `qr:${code}`;
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
