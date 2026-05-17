import type { AnalysisResponse } from "./types";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

export class AnalyzeError extends Error {
  constructor(public status: number, message: string) {
    super(message);
    this.name = "AnalyzeError";
  }
}

export async function analyzeContract(file: File): Promise<AnalysisResponse> {
  const form = new FormData();
  form.append("file", file);

  const res = await fetch(`${API_URL}/analyze`, {
    method: "POST",
    body: form,
  });

  if (!res.ok) {
    const detail = await res.text().catch(() => "");
    throw new AnalyzeError(res.status, detail || `HTTP ${res.status}`);
  }

  return res.json();
}

export async function loadSampleContract(): Promise<File> {
  const res = await fetch("/sample_contract.pdf");
  if (!res.ok) {
    throw new Error("Sample contract missing");
  }
  const blob = await res.blob();
  return new File([blob], "sample_contract.pdf", { type: "application/pdf" });
}
