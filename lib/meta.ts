import { createHash, randomUUID } from "crypto";

const GRAPH_API_VERSION = "v21.0";

export interface QRScanEventInput {
  pixelId: string;
  accessToken: string;
  code: string;
  eventSourceUrl: string;
  clientIpAddress?: string;
  clientUserAgent?: string;
  /** _fbp cookie value (browser ID) — hashed before sending */
  fbp?: string;
  /** _fbc cookie value or value built from fbclid — hashed before sending */
  fbc?: string;
  qrLabel?: string;
  destinationUrl?: string;
  /** Optional Meta test event code — routes event to Test Events tab instead of production */
  testEventCode?: string;
}

export interface QRScanEventResult {
  success: boolean;
  eventId: string;
  error?: string;
}

/**
 * Per Meta's Conversions API spec:
 * - client_ip_address and client_user_agent are sent unhashed
 * - fbp and fbc must be SHA-256 hashed
 */
function sha256(value: string): string {
  return createHash("sha256").update(value).digest("hex");
}

/**
 * Sends a "QRScan" custom event to a Meta Pixel via the Conversions API.
 * Never throws — failures are logged so a bad pixel config can't break redirects.
 */
export async function sendQRScanEvent(
  input: QRScanEventInput
): Promise<QRScanEventResult> {
  const eventId = randomUUID();

  const userData: Record<string, string> = {};
  if (input.clientIpAddress) userData.client_ip_address = input.clientIpAddress;
  if (input.clientUserAgent) userData.client_user_agent = input.clientUserAgent;
  if (input.fbp) userData.fbp = sha256(input.fbp);
  if (input.fbc) userData.fbc = sha256(input.fbc);

  const customData: Record<string, string> = { qr_code: input.code };
  if (input.qrLabel) customData.qr_label = input.qrLabel;
  if (input.destinationUrl) customData.destination_url = input.destinationUrl;

  const body: Record<string, unknown> = {
    data: [
      {
        event_name: "QRScan",
        event_time: Math.floor(Date.now() / 1000),
        event_id: eventId,
        action_source: "website",
        event_source_url: input.eventSourceUrl,
        user_data: userData,
        custom_data: customData,
      },
    ],
    access_token: input.accessToken,
  };
  if (input.testEventCode) body.test_event_code = input.testEventCode;

  try {
    const res = await fetch(
      `https://graph.facebook.com/${GRAPH_API_VERSION}/${input.pixelId}/events`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
        signal: AbortSignal.timeout(5000),
      }
    );

    if (!res.ok) {
      const text = await res.text().catch(() => "");
      console.error(
        `[meta] CAPI error for pixel ${input.pixelId} (HTTP ${res.status}): ${text}`
      );
      return { success: false, eventId, error: `HTTP ${res.status}` };
    }

    return { success: true, eventId };
  } catch (err) {
    console.error(
      `[meta] CAPI request failed for pixel ${input.pixelId}:`,
      err instanceof Error ? err.message : err
    );
    return {
      success: false,
      eventId,
      error: err instanceof Error ? err.message : String(err),
    };
  }
}
