import { useCallback, useEffect, useState } from "react";

import {
  usePushPublicKeyQuery,
  useRemovePushSubscriptionMutation,
  useSavePushSubscriptionMutation,
} from "./api";
import {
  ensurePushSubscription,
  serializePushSubscription,
  supportsPushNotifications,
} from "./push-subscription";
import { registerCitizenServiceWorker } from "./service-worker-registration";
import type { NotificationSetupStatus } from "./types";

export const usePushNotifications = () => {
  const publicKeyQuery = usePushPublicKeyQuery();
  const saveSubscription = useSavePushSubscriptionMutation();
  const removeSubscription = useRemovePushSubscriptionMutation();
  const [status, setStatus] = useState<NotificationSetupStatus>("checking");

  useEffect(() => {
    if (!supportsPushNotifications()) {
      setStatus("unsupported");
      return;
    }
    if (Notification.permission === "denied") {
      setStatus("denied");
      return;
    }
    let cancelled = false;
    registerCitizenServiceWorker()
      .then((registration) => registration?.pushManager.getSubscription())
      .then((subscription) => {
        if (!cancelled) {
          setStatus(subscription ? "enabled" : "disabled");
        }
      })
      .catch(() => {
        if (!cancelled) {
          setStatus("disabled");
        }
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const enable = useCallback(async (): Promise<void> => {
    if (!supportsPushNotifications()) {
      setStatus("unsupported");
      return;
    }
    const publicKey = publicKeyQuery.data?.publicKey;
    if (!publicKey) {
      throw new Error("Kunci notifikasi server belum dikonfigurasi.");
    }
    const permission = await Notification.requestPermission();
    if (permission !== "granted") {
      if (permission === "denied") {
        setStatus("denied");
      }
      throw new Error("Izin notifikasi belum diberikan.");
    }
    const registration = await registerCitizenServiceWorker();
    if (!registration) {
      throw new Error("Service worker notifikasi tidak tersedia.");
    }
    const subscription = await ensurePushSubscription(registration, publicKey);
    const serialized = serializePushSubscription(subscription);
    if (!serialized) {
      await subscription.unsubscribe();
      throw new Error("Browser tidak mengembalikan kunci langganan push.");
    }
    await saveSubscription.mutateAsync(serialized);
    setStatus("enabled");
  }, [publicKeyQuery.data?.publicKey, saveSubscription]);

  const disable = useCallback(async (): Promise<void> => {
    if (!supportsPushNotifications()) {
      return;
    }
    const registration = await registerCitizenServiceWorker();
    if (!registration) {
      setStatus("disabled");
      return;
    }
    const subscription = await registration.pushManager.getSubscription();
    if (subscription) {
      await removeSubscription.mutateAsync({ endpoint: subscription.endpoint });
      await subscription.unsubscribe();
    }
    setStatus("disabled");
  }, [removeSubscription]);

  return {
    disable,
    enable,
    isPending:
      publicKeyQuery.isPending ||
      saveSubscription.isPending ||
      removeSubscription.isPending,
    status,
  };
};
