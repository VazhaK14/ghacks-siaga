import { Alert, AlertDescription } from "@siaga-app/ui/components/alert";
import { Button } from "@siaga-app/ui/components/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@siaga-app/ui/components/card";
import { BellIcon, DownloadIcon } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { usePushNotifications } from "../use-push-notifications";
import { usePwaInstall } from "../use-pwa-install";

export const PwaSettingsCard = () => {
  const install = usePwaInstall();
  const push = usePushNotifications();
  const [error, setError] = useState<string | null>(null);

  const handleInstall = async () => {
    const installed = await install.install();
    if (installed) {
      toast.success("SIAGA berhasil dipasang.");
    }
  };

  const handlePushToggle = async () => {
    setError(null);
    try {
      if (push.status === "enabled") {
        await push.disable();
        toast.success("Notifikasi dinonaktifkan.");
      } else {
        await push.enable();
        toast.success("Notifikasi pembaruan laporan aktif.");
      }
    } catch (pushError) {
      setError(
        pushError instanceof Error
          ? pushError.message
          : "Pengaturan notifikasi belum tersimpan."
      );
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Aplikasi & notifikasi</CardTitle>
        <CardDescription>
          Pasang SIAGA dan dapatkan pembaruan saat bantuan dikirim.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        {install.isInstalled ? (
          <p className="text-muted-foreground text-xs">
            SIAGA sudah berjalan sebagai aplikasi terpasang.
          </p>
        ) : null}
        {error ? (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        ) : null}
        {push.status === "unsupported" ? (
          <Alert>
            <AlertDescription>
              Browser ini belum mendukung push. Di iPhone, pasang SIAGA ke layar
              utama terlebih dahulu.
            </AlertDescription>
          </Alert>
        ) : null}
      </CardContent>
      <CardFooter className="flex flex-wrap gap-2">
        {install.canInstall ? (
          <Button onClick={handleInstall} variant="ghost">
            <DownloadIcon data-icon="inline-start" />
            Pasang SIAGA
          </Button>
        ) : null}
        {push.status === "unsupported" ? null : (
          <Button
            disabled={push.isPending || push.status === "checking"}
            onClick={handlePushToggle}
            variant={push.status === "enabled" ? "secondary" : "primary"}
          >
            <BellIcon data-icon="inline-start" />
            {push.status === "enabled"
              ? "Matikan Notifikasi"
              : "Aktifkan Notifikasi"}
          </Button>
        )}
      </CardFooter>
    </Card>
  );
};
