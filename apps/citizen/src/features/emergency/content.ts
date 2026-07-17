import { MessageCircleIcon, Volume2Icon, VolumeXIcon } from "lucide-react";

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
    body: "Ceritakan kejadian, SIAGA akan memandu.",
    icon: Volume2Icon,
    id: "voice",
    title: "Bicara dengan suara",
  },
  {
    body: "Ketik laporan tanpa panggilan suara.",
    icon: MessageCircleIcon,
    id: "text",
    title: "Chat dengan teks",
  },
  {
    body: "Kirim sinyal bahaya tanpa suara.",
    icon: VolumeXIcon,
    id: "silent",
    title: "Mode senyap",
  },
];

export const SAFETY_INSTRUCTIONS: IncidentInstruction[] = [
  { id: "lock", text: "Kunci pintu dan matikan suara ponsel." },
  { id: "window", text: "Jauhi jendela dan tetap bersama orang terdekat." },
  { id: "update", text: "Kirim perubahan situasi melalui chat jika aman." },
];
