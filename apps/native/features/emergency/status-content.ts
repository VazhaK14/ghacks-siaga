import type { Ionicons } from "@expo/vector-icons";

/**
 * Manual, intentional duplicate of the status/category/dispatch vocabulary
 * defined for the operator dashboard in:
 *   apps/web/src/features/map/content.ts (REPORT_STATUS_LABELS, CATEGORY_CONFIG, INCIDENT_TYPE_LABELS)
 *   apps/web/src/features/dispatch/content.ts (DISPATCH_STATUS_CONFIG, AGENCY_TYPE_CONFIG)
 * Kept in sync by hand (no shared package exists yet) so the citizen app and
 * operator dashboard always show the same Indonesian status vocabulary for
 * the same backend enums (packages/db/prisma/schema/report.prisma,
 * dispatch.prisma).
 */

type IoniconName = keyof typeof Ionicons.glyphMap;

// ReportStatus (packages/db/prisma/schema/report.prisma) — full lifecycle,
// including the terminal statuses the web map view omits but the native
// Complete screen needs.
export const REPORT_STATUS_LABELS = {
  AI_GATHERING: "AI mengumpulkan data",
  CANCELLED: "Dibatalkan",
  CLOSED: "Ditutup",
  DISPATCH_PENDING: "Menunggu dispatch",
  DISPATCHED: "Unit sudah dikirim",
  HELP_ARRIVED: "Bantuan tiba",
  HELP_EN_ROUTE: "Bantuan menuju lokasi",
  READY_FOR_REVIEW: "Siap ditinjau",
  RESOLVED: "Terselesaikan",
  SUBMITTED: "Baru masuk",
} as const;

export type ReportStatusValue = keyof typeof REPORT_STATUS_LABELS;

// ReportCategory (severity assigned by AI/operator triage) — a different
// axis than IncidentType (what happened, picked by the reporter pre-report
// on the SOS screen). Colors are the theme-invariant palette scale from
// global.css (--color-red/yellow/green-100/200), safe to hardcode since
// they never change between light/dark.
export const CATEGORY_CONFIG = {
  CRITICAL: {
    badgeClassName: "bg-red-10 text-red-100",
    color: "#d00416",
    icon: "alert-circle" satisfies IoniconName,
    label: "Kritis",
  },
  HIGH: {
    badgeClassName: "bg-siaga-soft text-siaga-priority",
    color: "#d20000",
    icon: "shield-half-outline" satisfies IoniconName,
    label: "Tinggi",
  },
  LOW: {
    badgeClassName: "bg-green-10 text-green-200",
    color: "#1fc16b",
    icon: "ellipse-outline" satisfies IoniconName,
    label: "Rendah",
  },
  MEDIUM: {
    badgeClassName: "bg-yellow-10 text-yellow-200",
    color: "#dfb400",
    icon: "warning-outline" satisfies IoniconName,
    label: "Sedang",
  },
  UNCATEGORIZED: {
    badgeClassName: "bg-neutral-10 text-neutral-700",
    color: "#777777",
    icon: "flame-outline" satisfies IoniconName,
    label: "Belum dinilai",
  },
} as const;

export type ReportCategoryValue = keyof typeof CATEGORY_CONFIG;

// IncidentType (what happened) — reporter-selected on the SOS screen.
export const INCIDENT_TYPE_LABELS = {
  CRIME: "Kriminal",
  DOMESTIC_VIOLENCE: "Kekerasan domestik",
  FIRE: "Kebakaran",
  MEDICAL: "Medis",
  MISSING_PERSON: "Orang hilang",
  NATURAL_DISASTER: "Bencana alam",
  OTHER: "Lainnya",
  TRAFFIC_ACCIDENT: "Kecelakaan lalu lintas",
} as const;

export type IncidentTypeValue = keyof typeof INCIDENT_TYPE_LABELS;

// DispatchStatus (packages/db/prisma/schema/dispatch.prisma) — the step
// sequence rendered by DispatchTimeline (Gojek-style order-status list,
// no live map this pass).
export const DISPATCH_STATUS_CONFIG = {
  ACKNOWLEDGED: {
    label: "Permintaan diterima",
    progressLabel: "Unit menyiapkan keberangkatan",
  },
  ARRIVED: {
    label: "Unit tiba",
    progressLabel: "Penanganan di lokasi berlangsung",
  },
  CANCELLED: {
    label: "Dibatalkan",
    progressLabel: "Dispatch dibatalkan",
  },
  COMPLETED: {
    label: "Terselesaikan",
    progressLabel: "Laporan telah diselesaikan",
  },
  EN_ROUTE: {
    label: "Menuju lokasi",
    progressLabel: "Unit sedang dalam perjalanan",
  },
  REQUESTED: {
    label: "Menghubungi unit",
    progressLabel: "Menunggu konfirmasi unit",
  },
  RETURNED_TO_BASE: {
    label: "Tiba di rumah sakit",
    progressLabel: "Ambulans siap menyelesaikan laporan",
  },
  RETURNING_TO_BASE: {
    label: "Kembali ke rumah sakit",
    progressLabel: "Ambulans sedang dalam perjalanan pulang",
  },
} as const;

export type DispatchStatusValue = keyof typeof DISPATCH_STATUS_CONFIG;

// The ordered step sequence DispatchTimeline highlights against — mirrors
// apps/web/src/features/dispatch/report-dispatch-section.tsx's
// DispatchTimeline/ActiveDispatchTracker step semantics.
export const DISPATCH_TIMELINE_STEPS: readonly DispatchStatusValue[] = [
  "REQUESTED",
  "ACKNOWLEDGED",
  "EN_ROUTE",
  "ARRIVED",
  "COMPLETED",
];

export const AGENCY_TYPE_CONFIG = {
  AMBULANCE: {
    color: "#1fc16b",
    icon: "medkit-outline" satisfies IoniconName,
    label: "Ambulans",
  },
  FIRE_DEPARTMENT: {
    color: "#d00416",
    icon: "flame-outline" satisfies IoniconName,
    label: "Pemadam",
  },
  OTHER: {
    color: "#777777",
    icon: "car-outline" satisfies IoniconName,
    label: "Unit umum",
  },
  POLICE: {
    color: "#2563eb",
    icon: "shield-outline" satisfies IoniconName,
    label: "Polisi",
  },
  SAR: {
    color: "#dfb400",
    icon: "boat-outline" satisfies IoniconName,
    label: "SAR",
  },
} as const;

export type AgencyTypeValue = keyof typeof AGENCY_TYPE_CONFIG;
