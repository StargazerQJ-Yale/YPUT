import Image from "next/image";
import { FileText, Download } from "lucide-react";
import { Button } from "@/components/ui/button";

export function ReceiptPreview({
  receiptUrl,
  receiptName,
  isImage,
}: {
  receiptUrl: string | null;
  receiptName: string;
  isImage: boolean;
}) {
  if (!receiptUrl) {
    return (
      <div className="flex h-48 items-center justify-center rounded-lg border border-dashed text-sm text-muted-foreground">
        Receipt unavailable
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="overflow-hidden rounded-lg border bg-muted/30">
        {isImage ? (
          <a href={receiptUrl} target="_blank" rel="noreferrer">
            <div className="relative h-64 w-full">
              <Image
                src={receiptUrl}
                alt={receiptName}
                fill
                unoptimized
                className="object-contain"
              />
            </div>
          </a>
        ) : (
          <a
            href={receiptUrl}
            target="_blank"
            rel="noreferrer"
            className="flex h-48 flex-col items-center justify-center gap-2 text-muted-foreground"
          >
            <FileText className="size-10" />
            <span className="max-w-[80%] truncate text-sm">{receiptName}</span>
          </a>
        )}
      </div>
      <Button
        variant="outline"
        size="sm"
        className="w-full"
        nativeButton={false}
        render={<a href={receiptUrl} download={receiptName} />}
      >
        <Download className="size-4" />
        Download receipt
      </Button>
    </div>
  );
}
