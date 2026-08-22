"use client";

import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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

interface Pixel {
  pixelId: string;
  label: string;
  testEventCode?: string;
  createdAt: string;
}

export function PixelManager() {
  const [pixels, setPixels] = useState<Pixel[]>([]);
  const [loading, setLoading] = useState(true);

  // New pixel dialog
  const [newPixelOpen, setNewPixelOpen] = useState(false);
  const [newLabel, setNewLabel] = useState("");
  const [newPixelId, setNewPixelId] = useState("");
  const [newAccessToken, setNewAccessToken] = useState("");
  const [newTestEventCode, setNewTestEventCode] = useState("");

  // Edit pixel dialog
  const [editPixel, setEditPixel] = useState<Pixel | null>(null);
  const [editLabel, setEditLabel] = useState("");
  const [editAccessToken, setEditAccessToken] = useState("");
  const [editTestEventCode, setEditTestEventCode] = useState("");

  const fetchPixels = useCallback(async () => {
    const res = await fetch("/api/pixel");
    if (res.ok) {
      const data = await res.json();
      setPixels(data);
    }
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchPixels().finally(() => setLoading(false));
  }, [fetchPixels]);

  async function handleCreatePixel(e: React.FormEvent) {
    e.preventDefault();
    const res = await fetch("/api/pixel", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        label: newLabel,
        pixelId: newPixelId,
        accessToken: newAccessToken,
        testEventCode: newTestEventCode || undefined,
      }),
    });

    if (res.ok) {
      toast.success("Pixel added");
      setNewPixelOpen(false);
      setNewLabel("");
      setNewPixelId("");
      setNewAccessToken("");
      setNewTestEventCode("");
      fetchPixels();
    } else {
      const data = await res.json();
      toast.error(data.error || "Failed to add pixel");
    }
  }

  async function handleUpdatePixel(e: React.FormEvent) {
    e.preventDefault();
    if (!editPixel) return;

    const body: Record<string, string> = { label: editLabel };
    if (editAccessToken) body.accessToken = editAccessToken;
    if (editTestEventCode !== editPixel.testEventCode) {
      body.testEventCode = editTestEventCode;
    }

    const res = await fetch(`/api/pixel/${editPixel.pixelId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    if (res.ok) {
      toast.success("Pixel updated");
      setEditPixel(null);
      fetchPixels();
    } else {
      const data = await res.json();
      toast.error(data.error || "Failed to update pixel");
    }
  }

  async function handleDeletePixel(pixelId: string) {
    if (!confirm("Delete this pixel? QR codes referencing it will stop tracking (but keep working as redirects).")) return;

    const res = await fetch(`/api/pixel/${pixelId}`, {
      method: "DELETE",
    });

    if (res.ok) {
      toast.success("Pixel deleted");
      fetchPixels();
    } else {
      toast.error("Failed to delete pixel");
    }
  }

  if (loading) {
    return <p className="text-muted-foreground">Loading...</p>;
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-lg font-medium">Meta Pixels</h2>
          <p className="text-sm text-muted-foreground">
            Pixels receive a server-side &quot;QRScan&quot; event on every scan of
            QR codes linked to them.
          </p>
        </div>
        <Dialog open={newPixelOpen} onOpenChange={setNewPixelOpen}>
          <DialogTrigger asChild>
            <Button>+ Add Pixel</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add Meta Pixel</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleCreatePixel} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="pixelLabel">Label</Label>
                <Input
                  id="pixelLabel"
                  value={newLabel}
                  onChange={(e) => setNewLabel(e.target.value)}
                  placeholder="Main store pixel"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="pixelId">Pixel ID</Label>
                <Input
                  id="pixelId"
                  value={newPixelId}
                  onChange={(e) => setNewPixelId(e.target.value)}
                  placeholder="123456789012345"
                  pattern="\d{10,20}"
                  inputMode="numeric"
                  required
                />
                <p className="text-xs text-muted-foreground">
                  Events Manager → your pixel → Settings
                </p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="accessToken">Conversions API Access Token</Label>
                <Input
                  id="accessToken"
                  value={newAccessToken}
                  onChange={(e) => setNewAccessToken(e.target.value)}
                  placeholder="EAAG..."
                  type="password"
                  required
                />
                <p className="text-xs text-muted-foreground">
                  Stored server-side only. Never shown or sent to the browser
                  again.
                </p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="testEventCode">
                  Test Event Code (optional)
                </Label>
                <Input
                  id="testEventCode"
                  value={newTestEventCode}
                  onChange={(e) => setNewTestEventCode(e.target.value)}
                  placeholder="TEST12345"
                />
                <p className="text-xs text-muted-foreground">
                  While set, scans go to Events Manager → Test Events instead of
                  production. Remove before launch.
                </p>
              </div>
              <Button type="submit" className="w-full">
                Add Pixel
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {pixels.length === 0 ? (
        <div className="text-center py-16 border rounded-lg bg-background">
          <p className="text-muted-foreground mb-4">No pixels yet.</p>
          <Button onClick={() => setNewPixelOpen(true)}>Add Your First Pixel</Button>
        </div>
      ) : (
        <div className="border rounded-lg bg-background">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Label</TableHead>
                <TableHead>Pixel ID</TableHead>
                <TableHead>Test Mode</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {pixels.map((pixel) => (
                <TableRow key={pixel.pixelId}>
                  <TableCell className="font-medium">{pixel.label}</TableCell>
                  <TableCell className="font-mono text-sm">
                    {pixel.pixelId}
                  </TableCell>
                  <TableCell>
                    {pixel.testEventCode ? (
                      <span className="text-xs bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300 px-2 py-1 rounded-full">
                        Test mode
                      </span>
                    ) : (
                      <span className="text-xs text-muted-foreground">
                        Live
                      </span>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setEditPixel(pixel);
                          setEditLabel(pixel.label);
                          setEditAccessToken("");
                          setEditTestEventCode(pixel.testEventCode || "");
                        }}
                      >
                        Edit
                      </Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => handleDeletePixel(pixel.pixelId)}
                      >
                        Delete
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Edit Dialog */}
      <Dialog open={!!editPixel} onOpenChange={(open) => !open && setEditPixel(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Pixel</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleUpdatePixel} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="editPixelLabel">Label</Label>
              <Input
                id="editPixelLabel"
                value={editLabel}
                onChange={(e) => setEditLabel(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="editAccessToken">
                Conversions API Access Token
              </Label>
              <Input
                id="editAccessToken"
                value={editAccessToken}
                onChange={(e) => setEditAccessToken(e.target.value)}
                placeholder="Leave blank to keep current token"
                type="password"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="editTestEventCode">Test Event Code</Label>
              <Input
                id="editTestEventCode"
                value={editTestEventCode}
                onChange={(e) => setEditTestEventCode(e.target.value)}
                placeholder="Empty for live events"
              />
            </div>
            <Button type="submit" className="w-full">
              Update Pixel
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
