export type Priority = "HIGH" | "MEDIUM" | "LOW";

export const priorityStyles: Record<Priority, { bar: string; badge: string }> =
  {
    HIGH: { badge: "bg-primary-300", bar: "bg-primary-300" },
    LOW: { badge: "bg-green-200", bar: "bg-green-200" },
    MEDIUM: { badge: "bg-yellow-200", bar: "bg-yellow-200" },
  };

export interface Metric {
  dot: string;
  label: string;
  value: number;
}

export const metrics: Metric[] = [
  { dot: "bg-primary-300", label: "HIGH", value: 1 },
  { dot: "bg-yellow-200", label: "MEDIUM", value: 1 },
  { dot: "bg-green-200", label: "LOW", value: 1 },
  { dot: "bg-neutral-500", label: "REPORT COMPLETE", value: 3 },
];

export interface Ticket {
  id: string;
  meta: string;
  priority: Priority;
  status: string;
  title: string;
}

export const tickets: Ticket[] = [
  {
    id: "SOS-1048",
    meta: "SOS-1048 · baru · 19:42",
    priority: "HIGH",
    status: "REPORT COMPLETE",
    title: "Penyusup membawa pisau",
  },
  {
    id: "SOS-1047",
    meta: "SOS-1047 · 2 menit",
    priority: "MEDIUM",
    status: "REPORT COMPLETE",
    title: "Kecelakaan motor",
  },
  {
    id: "SOS-1046",
    meta: "SOS-1046 · 4 menit",
    priority: "LOW",
    status: "REPORT COMPLETE",
    title: "Asap panel listrik",
  },
  {
    id: "SOS-1045",
    meta: "SOS-1045 · 5 menit",
    priority: "LOW",
    status: "REPORT COMPLETE",
    title: "Kertas terbakar",
  },
];

export interface ActivityEntry {
  event: string;
  highlighted?: boolean;
  time: string;
}

export const activityFeed: ActivityEntry[] = [
  {
    event: "Report SOS-1048 selesai → ticket dipublikasikan",
    highlighted: true,
    time: "19:42:08",
  },
  {
    event: "Fase report · lokasi & risiko dianalisis",
    time: "19:42:06",
  },
  {
    event: "Fase report · transkrip pelapor dirangkum",
    time: "19:42:03",
  },
];
