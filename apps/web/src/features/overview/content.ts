import type {
  DashboardOverview,
  DashboardPeriod,
} from "@/features/overview/types";

export const DASHBOARD_PERIOD_OPTIONS = [
  { label: "24 jam", value: "24H" },
  { label: "7 hari", value: "7D" },
  { label: "30 hari", value: "30D" },
] as const satisfies {
  label: string;
  value: DashboardPeriod;
}[];

export const DASHBOARD_PERIOD_LABELS = {
  "7D": "7 hari terakhir",
  "24H": "24 jam terakhir",
  "30D": "30 hari terakhir",
} as const satisfies Record<DashboardPeriod, string>;

export const INCIDENT_LABELS = {
  CRIME: "Kriminal",
  DOMESTIC_VIOLENCE: "Kekerasan domestik",
  FIRE: "Kebakaran",
  MEDICAL: "Medis",
  MISSING_PERSON: "Orang hilang",
  NATURAL_DISASTER: "Bencana alam",
  OTHER: "Lainnya",
  TRAFFIC_ACCIDENT: "Kecelakaan lalu lintas",
  UNCLASSIFIED: "Belum diklasifikasi",
} as const satisfies Record<
  DashboardOverview["incidentBreakdown"][number]["incidentType"],
  string
>;

export const UNIT_TYPE_LABELS = {
  AMBULANCE: "Ambulans",
  FIRE_DEPARTMENT: "Pemadam",
  OTHER: "Unit umum",
  POLICE: "Polisi",
  SAR: "SAR",
} as const satisfies Record<
  DashboardOverview["unitReadiness"][number]["type"],
  string
>;

export const formatDashboardTime = (value: string): string =>
  new Intl.DateTimeFormat("id-ID", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  }).format(new Date(value));

export const formatResponseTime = (seconds: number | null): string => {
  if (seconds === null) {
    return "Belum ada data";
  }
  if (seconds < 60) {
    return `${seconds} dtk`;
  }

  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  return remainingSeconds > 0
    ? `${minutes} m ${remainingSeconds} dtk`
    : `${minutes} menit`;
};

export const formatReportAge = (ageMinutes: number): string => {
  if (ageMinutes < 1) {
    return "Baru";
  }
  if (ageMinutes < 60) {
    return `${ageMinutes} menit`;
  }

  const hours = Math.floor(ageMinutes / 60);
  return `${hours} jam`;
};

export const formatChartBucket = (
  value: string,
  period: DashboardPeriod
): string =>
  new Intl.DateTimeFormat("id-ID", {
    day: period === "24H" ? undefined : "2-digit",
    hour: period === "24H" ? "2-digit" : undefined,
    minute: period === "24H" ? "2-digit" : undefined,
    month: period === "24H" ? undefined : "short",
    timeZone: "Asia/Jakarta",
  }).format(new Date(value));
