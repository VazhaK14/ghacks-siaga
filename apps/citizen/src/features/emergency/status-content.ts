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

export const DISPATCH_TIMELINE_STEPS: readonly DispatchStatusValue[] = [
  "REQUESTED",
  "ACKNOWLEDGED",
  "EN_ROUTE",
  "ARRIVED",
  "COMPLETED",
];
