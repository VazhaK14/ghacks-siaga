import type { ArchivedReportCategory, ArchivedReportStatus } from "./types";

export const ARCHIVED_STATUS_LABELS = {
  CANCELLED: "Dibatalkan",
  CLOSED: "Ditutup",
  RESOLVED: "Terselesaikan",
} as const satisfies Record<ArchivedReportStatus, string>;

export const ARCHIVED_STATUS_VARIANTS = {
  CANCELLED: "destructive",
  CLOSED: "outline",
  RESOLVED: "secondary",
} as const satisfies Record<
  ArchivedReportStatus,
  "destructive" | "outline" | "secondary"
>;

export const ARCHIVED_STATUS_OPTIONS = [
  { label: "Semua status", value: "ALL" },
  { label: "Terselesaikan", value: "RESOLVED" },
  { label: "Ditutup", value: "CLOSED" },
  { label: "Dibatalkan", value: "CANCELLED" },
] as const;

export const ARCHIVED_CATEGORY_OPTIONS = [
  { label: "Semua prioritas", value: "ALL" },
  { label: "Kritis", value: "CRITICAL" },
  { label: "Tinggi", value: "HIGH" },
  { label: "Sedang", value: "MEDIUM" },
  { label: "Rendah", value: "LOW" },
  { label: "Belum dinilai", value: "UNCATEGORIZED" },
] as const satisfies ReadonlyArray<{
  label: string;
  value: ArchivedReportCategory | "ALL";
}>;

export const formatArchivedDateTime = (value: string): string =>
  new Intl.DateTimeFormat("id-ID", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
