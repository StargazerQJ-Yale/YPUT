"use client";

import * as React from "react";
import { FileText, Image as ImageIcon, Upload, X } from "lucide-react";
import { cn } from "@/lib/utils";

const ACCEPTED_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/heic",
  "image/heif",
  "image/gif",
  "image/bmp",
  "image/tiff",
  "application/pdf",
];
const MAX_SIZE_BYTES = 8 * 1024 * 1024; // 8MB

function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function FileDropzone({
  name,
  onFileChange,
  error,
}: {
  name: string;
  onFileChange?: (file: File | null) => void;
  error?: string;
}) {
  const inputRef = React.useRef<HTMLInputElement>(null);
  const [file, setFile] = React.useState<File | null>(null);
  const [dragActive, setDragActive] = React.useState(false);
  const [localError, setLocalError] = React.useState<string | null>(null);

  function validateAndSet(candidate: File | null) {
    if (!candidate) {
      setFile(null);
      onFileChange?.(null);
      return;
    }
    if (!ACCEPTED_TYPES.includes(candidate.type)) {
      setLocalError("Unsupported file type. Upload a JPG, PNG, WEBP, HEIC, GIF, BMP, TIFF, or PDF.");
      return;
    }
    if (candidate.size > MAX_SIZE_BYTES) {
      setLocalError("File is too large (max 8MB).");
      return;
    }
    setLocalError(null);
    setFile(candidate);
    onFileChange?.(candidate);
  }

  return (
    <div>
      <input
        ref={inputRef}
        type="file"
        name={file ? name : undefined}
        accept={ACCEPTED_TYPES.join(",")}
        className="sr-only"
        onChange={(e) => validateAndSet(e.target.files?.[0] ?? null)}
      />

      {file ? (
        <div className="flex items-center gap-3 rounded-lg border bg-background p-3">
          {file.type === "application/pdf" ? (
            <FileText className="size-8 shrink-0 text-muted-foreground" />
          ) : (
            <ImageIcon className="size-8 shrink-0 text-muted-foreground" />
          )}
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium">{file.name}</p>
            <p className="text-xs text-muted-foreground">{formatBytes(file.size)}</p>
          </div>
          <button
            type="button"
            onClick={() => {
              validateAndSet(null);
              if (inputRef.current) inputRef.current.value = "";
            }}
            className="rounded-md p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground"
            aria-label="Remove file"
          >
            <X className="size-4" />
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          onDragOver={(e) => {
            e.preventDefault();
            setDragActive(true);
          }}
          onDragLeave={() => setDragActive(false)}
          onDrop={(e) => {
            e.preventDefault();
            setDragActive(false);
            validateAndSet(e.dataTransfer.files?.[0] ?? null);
          }}
          className={cn(
            "flex w-full flex-col items-center gap-2 rounded-lg border-2 border-dashed px-4 py-8 text-center transition-colors",
            dragActive ? "border-primary bg-primary/5" : "border-muted-foreground/25 hover:bg-muted/50",
          )}
        >
          <Upload className="size-6 text-muted-foreground" />
          <p className="text-sm font-medium">Click to upload or drag and drop</p>
          <p className="text-xs text-muted-foreground">
            JPG, PNG, WEBP, HEIC, GIF, BMP, TIFF, or PDF (max 8MB)
          </p>
        </button>
      )}

      {(localError || error) && (
        <p className="mt-1.5 text-sm text-destructive">{localError || error}</p>
      )}
    </div>
  );
}
