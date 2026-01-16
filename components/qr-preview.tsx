"use client";

import { useEffect, useRef, useMemo, useCallback } from "react";
import QRCode from "qrcode";
import { Button } from "@/components/ui/button";

interface QRPreviewProps {
  code: string;
}

export function QRPreview({ code }: QRPreviewProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Build the redirect URL: yourdomain.com/code
  const qrUrl = useMemo(() => {
    if (typeof window !== "undefined") {
      return `${window.location.origin}/${code}`;
    }
    return `https://yourdomain.com/${code}`;
  }, [code]);

  useEffect(() => {
    if (canvasRef.current) {
      QRCode.toCanvas(
        canvasRef.current,
        qrUrl,
        {
          width: 256,
          margin: 2,
          color: {
            dark: "#000000",
            light: "#ffffff",
          },
        },
        (error) => {
          if (error) console.error("QR generation error:", error);
        }
      );
    }
  }, [qrUrl]);

  const downloadPNG = useCallback(() => {
    if (!canvasRef.current) return;
    const link = document.createElement("a");
    link.download = `qr-${code}.png`;
    link.href = canvasRef.current.toDataURL("image/png");
    link.click();
  }, [code]);

  const downloadSVG = useCallback(async () => {
    const svgString = await QRCode.toString(qrUrl, {
      type: "svg",
      width: 256,
      margin: 2,
    });
    const blob = new Blob([svgString], { type: "image/svg+xml" });
    const link = document.createElement("a");
    link.download = `qr-${code}.svg`;
    link.href = URL.createObjectURL(blob);
    link.click();
    URL.revokeObjectURL(link.href);
  }, [code, qrUrl]);

  return (
    <div className="flex flex-col items-center gap-4">
      <canvas ref={canvasRef} className="border rounded-lg" />
      <p className="text-sm text-muted-foreground text-center break-all max-w-[256px]">
        {qrUrl}
      </p>
      <div className="flex gap-2">
        <Button variant="outline" onClick={downloadPNG}>
          Download PNG
        </Button>
        <Button variant="outline" onClick={downloadSVG}>
          Download SVG
        </Button>
      </div>
    </div>
  );
}
