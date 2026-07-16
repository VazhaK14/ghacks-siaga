import {
  AlertTriangleIcon,
  CircleAlertIcon,
  CircleIcon,
  FlameIcon,
  ShieldAlertIcon,
} from "lucide-react";

import type {
  ActiveReportListItem,
  LiveConnectionStatus,
  ReportDetail,
} from "./types";

export const REPORT_PAGE_SIZE = 10;

export const CATEGORY_CONFIG = {
  CRITICAL: {
    badgeClassName: "bg-red-10 text-red-100",
    barClassName: "bg-red-200",
    icon: CircleAlertIcon,
    label: "Kritis",
    markerClassName:
      "border-red-100 bg-red-200 text-neutral-100 ring-red-100/30",
  },
  HIGH: {
    badgeClassName: "bg-primary-10 text-primary-200",
    barClassName: "bg-primary-300",
    icon: ShieldAlertIcon,
    label: "Tinggi",
    markerClassName:
      "border-primary-100 bg-primary-300 text-neutral-100 ring-primary-200/30",
  },
  LOW: {
    badgeClassName: "bg-green-10 text-green-200",
    barClassName: "bg-green-200",
    icon: CircleIcon,
    label: "Rendah",
    markerClassName:
      "border-green-100 bg-green-200 text-neutral-1000 ring-green-100/30",
  },
  MEDIUM: {
    badgeClassName: "bg-yellow-10 text-yellow-200",
    barClassName: "bg-yellow-200",
    icon: AlertTriangleIcon,
    label: "Sedang",
    markerClassName:
      "border-yellow-100 bg-yellow-200 text-neutral-1000 ring-yellow-100/30",
  },
  UNCATEGORIZED: {
    badgeClassName: "bg-neutral-10 text-neutral-700",
    barClassName: "bg-neutral-500",
    icon: FlameIcon,
    label: "Belum dinilai",
    markerClassName:
      "border-neutral-300 bg-neutral-600 text-neutral-100 ring-neutral-400/30",
  },
} as const satisfies Record<
  ActiveReportListItem["category"],
  {
    barClassName: string;
    badgeClassName: string;
    icon: typeof CircleAlertIcon;
    label: string;
    markerClassName: string;
  }
>;

export const INCIDENT_TYPE_LABELS = {
  CRIME: "Kriminal",
  DOMESTIC_VIOLENCE: "Kekerasan domestik",
  FIRE: "Kebakaran",
  MEDICAL: "Medis",
  MISSING_PERSON: "Orang hilang",
  NATURAL_DISASTER: "Bencana alam",
  OTHER: "Lainnya",
  TRAFFIC_ACCIDENT: "Kecelakaan lalu lintas",
} as const satisfies Record<
  NonNullable<ActiveReportListItem["incidentType"]>,
  string
>;

export const REPORT_STATUS_LABELS = {
  AI_GATHERING: "AI mengumpulkan data",
  DISPATCH_PENDING: "Menunggu dispatch",
  DISPATCHED: "Unit sudah dikirim",
  HELP_ARRIVED: "Bantuan tiba",
  HELP_EN_ROUTE: "Bantuan menuju lokasi",
  READY_FOR_REVIEW: "Siap ditinjau",
  SUBMITTED: "Baru masuk",
} as const satisfies Record<ActiveReportListItem["status"], string>;

export const LIVE_STATUS_CONFIG = {
  connected: {
    dotClassName: "bg-green-200",
    label: "Live",
  },
  connecting: {
    dotClassName: "bg-yellow-200",
    label: "Menghubungkan",
  },
  reconnecting: {
    dotClassName: "bg-yellow-200",
    label: "Menghubungkan ulang",
  },
  unavailable: {
    dotClassName: "bg-red-200",
    label: "Tidak live",
  },
} as const satisfies Record<
  LiveConnectionStatus,
  { dotClassName: string; label: string }
>;

export const getReportTitle = (
  report: Pick<ActiveReportListItem, "id" | "title">
): string => report.title ?? `Laporan ${report.id.slice(-6).toUpperCase()}`;

export const getDetailTitle = (report: ReportDetail): string =>
  report.title ?? `Laporan ${report.id.slice(-6).toUpperCase()}`;

export const formatReportTime = (dateValue: string): string =>
  new Intl.DateTimeFormat("id-ID", {
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(dateValue));

export const formatReportDateTime = (dateValue: string): string =>
  new Intl.DateTimeFormat("id-ID", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(dateValue));

export const formatCoordinates = (
  latitude: number,
  longitude: number
): string => `${latitude.toFixed(5)}, ${longitude.toFixed(5)}`;
