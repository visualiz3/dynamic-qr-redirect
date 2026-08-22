"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { QRPreview } from "@/components/qr-preview";
import { PixelManager } from "@/components/pixel-manager";

interface QRCode {
  code: string;
  data: {
    url: string;
    label: string;
    pixelId?: string;
    createdAt: string;
    scans: number;
  };
}

interface Pixel {
  pixelId: string;
  label: string;
  testEventCode?: string;
}

const NO_PIXEL = "__none__";

export default function DashboardPage() {
  const router = useRouter();
  const [qrCodes, setQrCodes] = useState<QRCode[]>([]);
  const [pixels, setPixels] = useState<Pixel[]>([]);
  const [loading, setLoading] = useState(true);

  // New QR dialog
  const [newQROpen, setNewQROpen] = useState(false);
  const [newQRLabel, setNewQRLabel] = useState("");
  const [newQRCode, setNewQRCode] = useState("");
  const [newQRUrl, setNewQRUrl] = useState("");
  const [newQRPixelId, setNewQRPixelId] = useState<string>("");

  // Edit QR dialog
  const [editQR, setEditQR] = useState<QRCode | null>(null);
  const [editLabel, setEditLabel] = useState("");
  const [editUrl, setEditUrl] = useState("");
  const [editPixelId, setEditPixelId] = useState<string>("");

  // QR Preview dialog
  const [previewQR, setPreviewQR] = useState<string | null>(null);

  const fetchQRCodes = useCallback(async () => {
    const res = await fetch("/api/qr");
    if (res.ok) {
      const data = await res.json();
      setQrCodes(data);
    }
  }, []);

  const fetchPixels = useCallback(async () => {
    const res = await fetch("/api/pixel");
    if (res.ok) {
      const data = await res.json();
      setPixels(data);
    }
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    Promise.all([fetchQRCodes(), fetchPixels()]).finally(() =>
      setLoading(false)
    );
  }, [fetchQRCodes, fetchPixels]);

  async function handleLogout() {
    await fetch("/api/auth", { method: "DELETE" });
    router.push("/");
  }

  async function handleCreateQR(e: React.FormEvent) {
    e.preventDefault();
    const res = await fetch("/api/qr", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        code: newQRCode,
        url: newQRUrl,
        label: newQRLabel,
        pixelId: newQRPixelId && newQRPixelId !== NO_PIXEL ? newQRPixelId : undefined,
      }),
    });

    if (res.ok) {
      toast.success("QR code created");
      setNewQROpen(false);
      setNewQRLabel("");
      setNewQRCode("");
      setNewQRUrl("");
      setNewQRPixelId("");
      fetchQRCodes();
    } else {
      const data = await res.json();
      toast.error(data.error || "Failed to create QR code");
    }
  }

  async function handleUpdateQR(e: React.FormEvent) {
    e.preventDefault();
    if (!editQR) return;

    const res = await fetch(`/api/qr/${editQR.code}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        url: editUrl,
        label: editLabel,
        pixelId: editPixelId && editPixelId !== NO_PIXEL ? editPixelId : undefined,
      }),
    });

    if (res.ok) {
      toast.success("QR code updated");
      setEditQR(null);
      fetchQRCodes();
    } else {
      const data = await res.json();
      toast.error(data.error || "Failed to update QR code");
    }
  }

  async function handleDeleteQR(code: string) {
    if (!confirm("Delete this QR code?")) return;

    const res = await fetch(`/api/qr/${code}`, {
      method: "DELETE",
    });

    if (res.ok) {
      toast.success("QR code deleted");
      fetchQRCodes();
    } else {
      toast.error("Failed to delete QR code");
    }
  }

  function openEditDialog(qr: QRCode) {
    setEditQR(qr);
    setEditLabel(qr.data.label);
    setEditUrl(qr.data.url);
    setEditPixelId(qr.data.pixelId || "");
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-muted/30">
      <header className="border-b bg-background">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <h1 className="text-xl font-semibold">QR Manager</h1>
          <Button variant="ghost" size="sm" onClick={handleLogout}>
            Logout
          </Button>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 space-y-12">
        <section>
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-lg font-medium">QR Codes</h2>
            <Dialog open={newQROpen} onOpenChange={setNewQROpen}>
              <DialogTrigger asChild>
                <Button>+ New QR Code</Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Create QR Code</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleCreateQR} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="qrLabel">Label</Label>
                    <Input
                      id="qrLabel"
                      value={newQRLabel}
                      onChange={(e) => setNewQRLabel(e.target.value)}
                      placeholder="Menu QR"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="qrCode">Short Code</Label>
                    <Input
                      id="qrCode"
                      value={newQRCode}
                      onChange={(e) => setNewQRCode(e.target.value)}
                      placeholder="menu"
                      pattern="[a-zA-Z0-9_-]+"
                      required
                    />
                    <p className="text-xs text-muted-foreground">
                      URL will be: yourdomain.com/{newQRCode || "code"}
                    </p>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="qrUrl">Destination URL</Label>
                    <Input
                      id="qrUrl"
                      type="url"
                      value={newQRUrl}
                      onChange={(e) => setNewQRUrl(e.target.value)}
                      placeholder="https://example.com/menu"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="qrPixel">Meta Pixel</Label>
                    <Select
                      value={newQRPixelId}
                      onValueChange={setNewQRPixelId}
                    >
                      <SelectTrigger id="qrPixel" className="w-full">
                        <SelectValue placeholder="No tracking" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value={NO_PIXEL}>No tracking</SelectItem>
                        {pixels.map((pixel) => (
                          <SelectItem key={pixel.pixelId} value={pixel.pixelId}>
                            {pixel.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <p className="text-xs text-muted-foreground">
                      Scans of this QR will fire a server-side
                      &quot;QRScan&quot; event to the selected pixel.
                    </p>
                  </div>
                  <Button type="submit" className="w-full">
                    Create QR Code
                  </Button>
                </form>
              </DialogContent>
            </Dialog>
          </div>

          {qrCodes.length === 0 ? (
            <div className="text-center py-16 border rounded-lg bg-background">
              <p className="text-muted-foreground mb-4">No QR codes yet.</p>
              <Button onClick={() => setNewQROpen(true)}>
                Create Your First QR Code
              </Button>
            </div>
          ) : (
            <div className="border rounded-lg bg-background">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Label</TableHead>
                    <TableHead>Code</TableHead>
                    <TableHead>Destination</TableHead>
                    <TableHead>Pixel</TableHead>
                    <TableHead className="text-right">Scans</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {qrCodes.map((qr) => {
                    const pixel = qr.data.pixelId
                      ? pixels.find((p) => p.pixelId === qr.data.pixelId)
                      : undefined;
                    return (
                      <TableRow key={qr.code}>
                        <TableCell className="font-medium">
                          {qr.data.label}
                        </TableCell>
                        <TableCell className="font-mono text-sm">{qr.code}</TableCell>
                        <TableCell className="max-w-[200px] truncate text-muted-foreground">
                          {qr.data.url}
                        </TableCell>
                        <TableCell className="max-w-[120px] truncate">
                          {pixel ? (
                            <span
                              className="text-sm"
                              title={
                                pixel.testEventCode
                                  ? `${pixel.label} (test mode)`
                                  : pixel.label
                              }
                            >
                              {pixel.label}
                              {pixel.testEventCode && (
                                <span className="ml-1 text-xs text-amber-600 dark:text-amber-400">
                                  (test)
                                </span>
                              )}
                            </span>
                          ) : qr.data.pixelId ? (
                            <span
                              className="text-sm text-destructive"
                              title={`Pixel ${qr.data.pixelId} was deleted`}
                            >
                              Missing
                            </span>
                          ) : (
                            <span className="text-sm text-muted-foreground">—</span>
                          )}
                        </TableCell>
                        <TableCell className="text-right">{qr.data.scans}</TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => openEditDialog(qr)}
                            >
                              Edit
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setPreviewQR(qr.code)}
                            >
                              QR
                            </Button>
                            <Button
                              variant="destructive"
                              size="sm"
                              onClick={() => handleDeleteQR(qr.code)}
                            >
                              Delete
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </section>

        <section>
          <PixelManager />
        </section>
      </main>

      {/* Edit Dialog */}
      <Dialog open={!!editQR} onOpenChange={(open) => !open && setEditQR(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit QR Code</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleUpdateQR} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="editLabel">Label</Label>
              <Input
                id="editLabel"
                value={editLabel}
                onChange={(e) => setEditLabel(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="editUrl">Destination URL</Label>
              <Input
                id="editUrl"
                type="url"
                value={editUrl}
                onChange={(e) => setEditUrl(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="editPixel">Meta Pixel</Label>
              <Select value={editPixelId} onValueChange={setEditPixelId}>
                <SelectTrigger id="editPixel" className="w-full">
                  <SelectValue placeholder="No tracking" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={NO_PIXEL}>No tracking</SelectItem>
                  {pixels.map((pixel) => (
                    <SelectItem key={pixel.pixelId} value={pixel.pixelId}>
                      {pixel.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Button type="submit" className="w-full">
              Update QR Code
            </Button>
          </form>
        </DialogContent>
      </Dialog>

      {/* QR Preview Dialog */}
      <Dialog
        open={!!previewQR}
        onOpenChange={(open) => !open && setPreviewQR(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>QR Code Preview</DialogTitle>
          </DialogHeader>
          {previewQR && <QRPreview code={previewQR} />}
        </DialogContent>
      </Dialog>
    </div>
  );
}
