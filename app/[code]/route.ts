import { NextResponse, after } from "next/server";
import { getQR, getPixel, incrementScan } from "@/lib/kv";
import { sendQRScanEvent } from "@/lib/meta";

interface Params {
  params: Promise<{ code: string }>;
}

const FBP_COOKIE = "_fbp";
const FBC_COOKIE = "_fbc";
/** 90 days, same as Meta's browser pixel */
const META_COOKIE_MAX_AGE = 7776000;

/**
 * Builds a _fbc value from a fbclid param: fb.{version}.{creationTime}.{fbclid}
 * Format documented in Meta's "Passing click and browser IDs" guide.
 */
function buildFbcFromFbclid(fbclid: string): string {
  return `fb.1.${Date.now()}.${fbclid}`;
}

/** Extracts the client IP from x-forwarded-for (first hop) or x-real-ip. */
function getClientIp(headers: Headers): string | undefined {
  const xff = headers.get("x-forwarded-for");
  if (xff) return xff.split(",")[0].trim();
  return headers.get("x-real-ip") || undefined;
}

/**
 * _fbp format: fb.{subdomainIndex}.{creationTime}.{randomNumber}
 * Meta's own pixel emits a numeric random part, so we match that.
 */
function buildFbp(): string {
  return `fb.1.${Date.now()}.${Math.floor(Math.random() * 1e10)}`;
}

/** Sets a Meta tracking cookie with consistent attributes. */
function setMetaCookie(
  response: NextResponse,
  name: string,
  value: string
): void {
  response.cookies.set({
    name,
    value,
    maxAge: META_COOKIE_MAX_AGE,
    path: "/",
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
  });
}

export async function GET(request: Request, { params }: Params) {
  const { code } = await params;

  const qr = await getQR(code);

  if (!qr) {
    return NextResponse.json({ error: "QR code not found" }, { status: 404 });
  }

  const url = new URL(request.url);
  const userAgent = request.headers.get("user-agent") || undefined;
  const clientIp = getClientIp(request.headers);

  // --- Matching-ladder signals ------------------------------------------------
  // _fbp: browser ID cookie. Read if present; set it if missing so repeat
  // scans carry a strong match key. Server-set _fbp is the same trick
  // server-side GTM uses for redirects.
  const cookieHeader = request.headers.get("cookie") || "";
  const incomingFbp = getCookieValue(cookieHeader, FBP_COOKIE);
  const incomingFbc = getCookieValue(cookieHeader, FBC_COOKIE);

  // fbclid param → fbc (ties the scan to the originating ad click when the
  // short link is shared digitally)
  const fbclid = url.searchParams.get("fbclid");
  let fbc = incomingFbc;
  if (!fbc && fbclid) {
    fbc = buildFbcFromFbclid(fbclid);
  }

  let fbp = incomingFbp;
  let setFbp = false;
  if (!fbp) {
    fbp = buildFbp();
    setFbp = true;
  }

  // --- Fire tracking in the background, after the response is sent ----------
  // Everything is awaited so the tracked after() promise only resolves once
  // the KV write and Meta request complete — otherwise Vercel can suspend
  // the function and silently drop them.
  after(async () => {
    await incrementScan(code).catch(console.error);

    if (qr.pixelId) {
      const pixel = await getPixel(qr.pixelId).catch(() => null);
      if (pixel) {
        await sendQRScanEvent({
          pixelId: pixel.pixelId,
          accessToken: pixel.accessToken,
          testEventCode: pixel.testEventCode || undefined,
          code,
          eventSourceUrl: url.toString(),
          clientIpAddress: clientIp,
          clientUserAgent: userAgent,
          fbp,
          fbc,
          qrLabel: qr.label,
          destinationUrl: qr.url,
        });
      } else {
        console.warn(
          `[meta] QR '${code}' references pixel ${qr.pixelId} which no longer exists — scan not tracked`
        );
      }
    }
  });

  // --- Redirect --------------------------------------------------------------
  const response = NextResponse.redirect(qr.url, 302);

  if (setFbp) {
    setMetaCookie(response, FBP_COOKIE, fbp);
  }

  // Persist fbc if we built it from fbclid so future events stay linked to
  // the same ad click
  if (!incomingFbc && fbc) {
    setMetaCookie(response, FBC_COOKIE, fbc);
  }

  return response;
}

function getCookieValue(cookieHeader: string, name: string): string | undefined {
  for (const part of cookieHeader.split(";")) {
    const [key, ...valueParts] = part.trim().split("=");
    if (key === name) {
      const raw = valueParts.join("=");
      try {
        return decodeURIComponent(raw);
      } catch {
        // Malformed percent-encoding — use the raw value rather than
        // crashing the redirect
        return raw;
      }
    }
  }
  return undefined;
}
