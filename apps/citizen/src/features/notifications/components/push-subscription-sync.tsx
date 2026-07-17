import { useEffect } from "react";

import { usePushPublicKeyQuery, useSavePushSubscriptionMutation } from "../api";
import {
  ensurePushSubscription,
  serializePushSubscription,
  supportsPushNotifications,
} from "../push-subscription";
import { registerCitizenServiceWorker } from "../service-worker-registration";

export const PushSubscriptionSync = () => {
  const publicKeyQuery = usePushPublicKeyQuery();
  const { mutateAsync: saveSubscription } = useSavePushSubscriptionMutation();
  const publicKey = publicKeyQuery.data?.publicKey;

  useEffect(() => {
    let cancelled = false;

    const syncSubscription = async (): Promise<void> => {
      if (
        !supportsPushNotifications() ||
        Notification.permission !== "granted" ||
        !publicKey
      ) {
        return;
      }
      const registration = await registerCitizenServiceWorker();
      if (!(registration && !cancelled)) {
        return;
      }
      const subscription = await ensurePushSubscription(
        registration,
        publicKey
      );
      const serialized = serializePushSubscription(subscription);
      if (!serialized) {
        return;
      }
      await saveSubscription(serialized);
    };

    syncSubscription().catch(() => undefined);
    return () => {
      cancelled = true;
    };
  }, [publicKey, saveSubscription]);

  return null;
};
