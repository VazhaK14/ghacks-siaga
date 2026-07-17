import {
  Alert,
  AlertDescription,
  AlertTitle,
} from "@siaga-app/ui/components/alert";
import { Button } from "@siaga-app/ui/components/button";
import { BellRingIcon, XIcon } from "lucide-react";
import { useCallback, useState } from "react";
import { toast } from "sonner";

import { usePushNotifications } from "../use-push-notifications";

export const PushNotificationPrompt = () => {
  const { enable, isPending, status } = usePushNotifications();
  const [dismissed, setDismissed] = useState(false);

  const handleEnable = useCallback(async (): Promise<void> => {
    try {
      await enable();
      toast.success("Notifikasi panggilan SIAGA sudah aktif.");
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Notifikasi belum dapat diaktifkan."
      );
    }
  }, [enable]);
  const handleDismiss = useCallback((): void => {
    setDismissed(true);
  }, []);

  const isDenied = status === "denied";
  if (dismissed || (status !== "disabled" && !isDenied)) {
    return null;
  }

  return (
    <Alert className="citizen-glass-surface fixed inset-x-4 bottom-[calc(7rem+env(safe-area-inset-bottom))] z-40 mx-auto max-w-md grid-cols-[auto_1fr_auto] items-start p-3 shadow-lg">
      <BellRingIcon aria-hidden className="mt-0.5" />
      <div>
        <AlertTitle>
          {isDenied ? "Notifikasi sedang diblokir" : "Aktifkan panggilan masuk"}
        </AlertTitle>
        <AlertDescription>
          {isDenied
            ? "Buka pengaturan situs atau aplikasi SIAGA di Android, lalu ubah izin Notifikasi menjadi Izinkan."
            : "Izinkan notifikasi agar panggilan operator tetap masuk saat SIAGA tidak sedang terbuka."}
        </AlertDescription>
        {isDenied ? null : (
          <Button
            className="mt-2"
            disabled={isPending}
            onClick={handleEnable}
            size="sm"
            type="button"
          >
            Aktifkan Notifikasi
          </Button>
        )}
      </div>
      <Button
        aria-label="Tutup pengingat notifikasi"
        className="-mt-1 -mr-1"
        onClick={handleDismiss}
        size="icon-xs"
        type="button"
        variant="ghost"
      >
        <XIcon aria-hidden />
      </Button>
    </Alert>
  );
};
