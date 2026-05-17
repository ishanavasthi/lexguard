"use client";

import { useRef, useState } from "react";
import { FileText, Upload } from "lucide-react";

import { Button } from "@/app/components/ui/button";
import { loadSampleContract } from "@/lib/api";
import { cn } from "@/lib/utils";

interface Props {
  onFile: (file: File) => void;
}

const ACCEPTED = [".pdf", ".docx", ".txt"];

function isAccepted(name: string): boolean {
  const lower = name.toLowerCase();
  return ACCEPTED.some((ext) => lower.endsWith(ext));
}

export function UploadZone({ onFile }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);
  const [loadingSample, setLoadingSample] = useState(false);

  function pick(file: File) {
    if (!isAccepted(file.name)) {
      setLocalError("Only PDF, DOCX, or TXT files are supported.");
      return;
    }
    setLocalError(null);
    onFile(file);
  }

  function onDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) pick(file);
  }

  async function onSample() {
    setLocalError(null);
    setLoadingSample(true);
    try {
      const file = await loadSampleContract();
      onFile(file);
    } catch {
      setLocalError("Could not load sample contract.");
    } finally {
      setLoadingSample(false);
    }
  }

  return (
    <div className="space-y-4">
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={onDrop}
        onClick={() => inputRef.current?.click()}
        className={cn(
          "flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed bg-white px-6 py-12 transition-colors dark:bg-zinc-900",
          dragging
            ? "border-primary bg-primary/5 dark:border-white dark:bg-white/5"
            : "border-slate-300 hover:border-slate-400 dark:border-zinc-800 dark:hover:border-zinc-700"
        )}
      >
        <Upload className="mb-3 h-10 w-10 text-slate-400 dark:text-zinc-500" />
        <p className="text-base font-medium text-slate-700 dark:text-zinc-200">
          Drag a contract here, or click to browse
        </p>
        <p className="mt-1 text-sm text-slate-500 dark:text-zinc-400">
          PDF, DOCX, or TXT, up to 10MB
        </p>
        <input
          ref={inputRef}
          type="file"
          accept=".pdf,.docx,.txt"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) pick(file);
            e.target.value = "";
          }}
        />
      </div>

      <div className="flex items-center justify-center gap-3 text-sm text-slate-500 dark:text-zinc-500">
        <span className="h-px flex-1 bg-slate-200 dark:bg-zinc-800" />
        <span>or</span>
        <span className="h-px flex-1 bg-slate-200 dark:bg-zinc-800" />
      </div>

      <Button
        type="button"
        variant="outline"
        className="w-full dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-200 dark:hover:bg-zinc-800 dark:hover:text-white"
        onClick={onSample}
        disabled={loadingSample}
      >
        <FileText className="mr-2 h-4 w-4" />
        {loadingSample ? "Loading sample…" : "Try with a sample contract"}
      </Button>

      {localError && (
        <p role="alert" className="text-center text-sm text-destructive">
          {localError}
        </p>
      )}
    </div>
  );
}
