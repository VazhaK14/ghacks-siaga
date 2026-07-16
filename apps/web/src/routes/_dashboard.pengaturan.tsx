import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@siaga-app/ui/components/card";

import { ModeToggle } from "@/components/mode-toggle";

export const handle = {
  dashboardSurface: "standard",
} as const;

export default function Pengaturan() {
  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-6">
      <header>
        <p className="text-muted-foreground text-xs uppercase tracking-wider">
          Preferensi command center
        </p>
        <h1 className="mt-1 font-extrabold text-3xl text-foreground">
          Pengaturan
        </h1>
      </header>

      <Card className="rounded-2xl">
        <CardHeader>
          <CardTitle>Tampilan aplikasi</CardTitle>
          <CardDescription>
            Pilih tampilan yang paling nyaman untuk memantau laporan dan unit
            respons.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex items-center justify-between gap-4 border-t pt-4">
          <div>
            <p className="font-semibold text-sm">Mode warna</p>
            <p className="text-muted-foreground text-xs">
              Atur tampilan warna aplikasi sesuai kebutuhan.
            </p>
          </div>
          <ModeToggle />
        </CardContent>
      </Card>
    </div>
  );
}
