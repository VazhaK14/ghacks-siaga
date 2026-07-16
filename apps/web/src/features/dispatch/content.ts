import {
  AmbulanceIcon,
  CarFrontIcon,
  LifeBuoyIcon,
  ShieldIcon,
  TruckIcon,
} from "lucide-react";

import type {
  DispatchAgencyAvailability,
  DispatchAgencyType,
  DispatchStatus,
} from "./types";

export const AGENCY_TYPE_CONFIG = {
  AMBULANCE: {
    icon: AmbulanceIcon,
    label: "Ambulans",
    markerClassName: "border-green-100 bg-green-200 text-neutral-1000",
    routeColor: "#1fc16b",
    vehicleIcon: AmbulanceIcon,
  },
  FIRE_DEPARTMENT: {
    icon: TruckIcon,
    label: "Pemadam",
    markerClassName: "border-red-100 bg-red-200 text-neutral-100",
    routeColor: "#d00416",
    vehicleIcon: TruckIcon,
  },
  OTHER: {
    icon: CarFrontIcon,
    label: "Unit umum",
    markerClassName: "border-neutral-400 bg-neutral-700 text-neutral-100",
    routeColor: "#777777",
    vehicleIcon: CarFrontIcon,
  },
  POLICE: {
    icon: ShieldIcon,
    label: "Polisi",
    markerClassName: "border-blue-300 bg-blue-600 text-white",
    routeColor: "#2563eb",
    vehicleIcon: CarFrontIcon,
  },
  SAR: {
    icon: LifeBuoyIcon,
    label: "SAR",
    markerClassName: "border-yellow-100 bg-yellow-200 text-neutral-1000",
    routeColor: "#dfb400",
    vehicleIcon: LifeBuoyIcon,
  },
} as const satisfies Record<
  DispatchAgencyType,
  {
    icon: typeof AmbulanceIcon;
    label: string;
    markerClassName: string;
    routeColor: string;
    vehicleIcon: typeof AmbulanceIcon;
  }
>;

export const AGENCY_AVAILABILITY_CONFIG = {
  AVAILABLE: {
    dotClassName: "bg-green-200",
    label: "Tersedia",
  },
  BUSY: {
    dotClassName: "bg-yellow-200",
    label: "Sibuk",
  },
  OFFLINE: {
    dotClassName: "bg-neutral-500",
    label: "Offline",
  },
} as const satisfies Record<
  DispatchAgencyAvailability,
  { dotClassName: string; label: string }
>;

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
} as const satisfies Record<
  DispatchStatus,
  { label: string; progressLabel: string }
>;
