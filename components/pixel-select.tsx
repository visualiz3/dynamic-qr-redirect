"use client";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export interface PixelOption {
  pixelId: string;
  label: string;
  testEventCode?: string;
}

/** Sentinel for "no pixel" — never sent to the API. */
export const NO_PIXEL = "__none__";

/** Maps Select value → API pixelId (undefined clears the pixel). */
export function toApiPixelId(value: string): string | undefined {
  return value && value !== NO_PIXEL ? value : undefined;
}

interface PixelSelectProps {
  id: string;
  value: string;
  onChange: (value: string) => void;
  pixels: PixelOption[];
}

/**
 * Shared pixel dropdown for QR create/edit forms. Renders a
 * "(deleted — pick another or clear)" option when the current value
 * references a pixel that no longer exists.
 */
export function PixelSelect({ id, value, onChange, pixels }: PixelSelectProps) {
  const hasPixel = pixels.some((p) => p.pixelId === value);

  return (
    <Select value={hasPixel || !value ? value : ""} onValueChange={onChange}>
      <SelectTrigger id={id} className="w-full">
        <SelectValue placeholder="No tracking" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value={NO_PIXEL}>No tracking</SelectItem>
        {pixels.map((pixel) => (
          <SelectItem key={pixel.pixelId} value={pixel.pixelId}>
            {pixel.label}
            {pixel.testEventCode ? " (test)" : ""}
          </SelectItem>
        ))}
        {!hasPixel && value ? (
          <SelectItem value={value}>
            Deleted pixel {value} — pick another or clear
          </SelectItem>
        ) : null}
      </SelectContent>
    </Select>
  );
}
