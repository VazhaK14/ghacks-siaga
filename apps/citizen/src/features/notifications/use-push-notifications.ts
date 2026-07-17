import { useCallback, useEffect, useState } from "react";

import {
  usePushPublicKeyQuery,
  useRemovePushSubscriptionMutation,
  useSavePushSubscriptionMutation,
} from "./api";
import { registerCitizenServiceWorker } from "./service-worker-registration";
import type { NotificationSetupStatus } from "./types";

const urlBase64ToUint8Array = (value: string): Uint8Array<ArrayBuffer> => {
  const padding = "=".repeat((4 - (value.length % 4)) % 4);
  const normalized = (value + padding).replace(/-/g, "+").replace(/_/g, "/");
  const decoded = window.atob(normalized);
  const bytes = new Uint8Array(decoded.length);
  for (let index = 0; index < decoded.length; index += 1) {
    bytes[index] = decoded.charCodeAt(index);
  }
  return bytes;
};

const supportsPush = (): boolean =>
  "serviceWorker" in navigator &&
  "PushManager" in window &&
  "Notification" in window;

export const usePushNotifications = () => {
  const publicKeyQuery = usePushPublicKeyQuery();
  const saveSubscription = useSavePushSubscriptionMutation();
  const removeSubscription = useRemovePushSubscriptionMutation();
  const [status, setStatus] = useState<NotificationSetupStatus>("checking");

  useEffect(() => {
    if (!supportsPush()) {
      setStatus("unsupported");
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
    if (!supportsPush()) {
      setStatus("unsupported");
      return;
    }
    const publicKey = publicKeyQuery.data?.publicKey;
    if (!publicKey) {
      throw new Error("Kunci notifikasi server belum dikonfigurasi.");
    }
    const permission = await Notification.requestPermission();
    if (permission !== "granted") {
      throw new Error("Izin notifikasi belum diberikan.");
    }
    const registration = await registerCitizenServiceWorker();
    if (!registration) {
      throw new Error("Service worker notifikasi tidak tersedia.");
    }
    const subscription = await registration.pushManager.subscribe({
      applicationServerKey: urlBase64ToUint8Array(publicKey),
      userVisibleOnly: true,
    });
    const serialized = subscription.toJSON();
    const auth = serialized.keys?.auth;
    const p256dh = serialized.keys?.p256dh;
    if (!(auth && p256dh)) {
      await subscription.unsubscribe();
      throw new Error("Browser tidak mengembalikan kunci langganan push.");
    }
    await saveSubscription.mutateAsync({
      auth,
      endpoint: subscription.endpoint,
      expirationTime: subscription.expirationTime
        ? new Date(subscription.expirationTime).toISOString()
        : null,
      p256dh,
      userAgent: navigator.userAgent,
    });
    setStatus("enabled");
  }, [publicKeyQuery.data?.publicKey, saveSubscription]);

  const disable = useCallback(async (): Promise<void> => {
    if (!supportsPush()) {
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
