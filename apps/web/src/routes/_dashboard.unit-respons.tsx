import { UnitResponseScreen } from "@/features/dispatch/components/unit-response-screen";

export const handle = {
  mapLayout: "units",
} as const;

export default function UnitRespons() {
  return <UnitResponseScreen />;
}
