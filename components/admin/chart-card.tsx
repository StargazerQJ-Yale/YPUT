"use client";

import * as React from "react";
import { toPng } from "html-to-image";
import { toast } from "sonner";
import { Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export function ChartCard({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  const containerRef = React.useRef<HTMLDivElement>(null);
  const [downloading, setDownloading] = React.useState(false);

  async function handleDownload() {
    if (!containerRef.current) return;
    setDownloading(true);
    try {
      const dataUrl = await toPng(containerRef.current, {
        backgroundColor: getComputedStyle(document.body).backgroundColor,
        pixelRatio: 2,
      });
      const link = document.createElement("a");
      link.download = `${title.toLowerCase().replace(/\s+/g, "-")}.png`;
      link.href = dataUrl;
      link.click();
    } catch {
      toast.error("Couldn't export this chart. Please try again.");
    } finally {
      setDownloading(false);
    }
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between gap-3">
        <CardTitle className="text-base">{title}</CardTitle>
        <Button variant="outline" size="sm" onClick={handleDownload} disabled={downloading}>
          <Download className="size-3.5" />
          PNG
        </Button>
      </CardHeader>
      <CardContent>
        <div ref={containerRef} className="bg-card">
          {children}
        </div>
      </CardContent>
    </Card>
  );
}
