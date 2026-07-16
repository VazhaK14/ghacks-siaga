import type {
  EmergencyCategory,
  IncidentInstruction,
  ReportModeOption,
} from "./types";

export const EMERGENCY_CATEGORIES: EmergencyCategory[] = [
  "Medis",
  "Kebakaran",
  "Bencana",
  "Kriminal",
  "Kecelakaan",
];

export const REPORT_MODES: ReportModeOption[] = [
  {
    body: "SIAGA mendengarkan dan menampilkan transkrip langsung.",
    icon: "volume-high-outline",
    id: "voice",
    title: "Bicara dengan suara",
  },
  {
    body: "Tanpa panggilan suara, ketik langsung ke SIAGA.",
    icon: "chatbox-ellipses-outline",
    id: "text",
    title: "Chat dengan teks",
  },
  {
    body: "Mikrofon aktif untuk mendengar lingkungan, tetapi perangkat tetap hening.",
    icon: "volume-mute-outline",
    id: "silent",
    title: "Mode senyap",
  },
];

export const SAFETY_INSTRUCTIONS: IncidentInstruction[] = [
  { id: "lock", text: "Kunci pintu dan matikan suara ponsel." },
  { id: "window", text: "Jauh dari jendela dan tetap bersama anak." },
  { id: "update", text: "Balas jika posisi pelaku berubah." },
];
