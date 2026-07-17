export interface SerializedPushSubscription {
  auth: string;
  endpoint: string;
  expirationTime: string | null;
  p256dh: string;
  userAgent: string | null;
}

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

const applicationServerKeysMatch = (
  currentKey: ArrayBuffer | null,
  expectedKey: Uint8Array<ArrayBuffer>
): boolean => {
  if (!currentKey) {
    return true;
  }
  const currentBytes = new Uint8Array(currentKey);
  if (currentBytes.length !== expectedKey.length) {
    return false;
  }
  return currentBytes.every((value, index) => value === expectedKey[index]);
};

export const supportsPushNotifications = (): boolean =>
  typeof navigator !== "undefined" &&
  "serviceWorker" in navigator &&
  typeof window !== "undefined" &&
  "PushManager" in window &&
  "Notification" in window;

export const ensurePushSubscription = async (
  registration: ServiceWorkerRegistration,
  publicKey: string
): Promise<PushSubscription> => {
  const expectedKey = urlBase64ToUint8Array(publicKey);
  const existingSubscription = await registration.pushManager.getSubscription();
  if (
    existingSubscription &&
    applicationServerKeysMatch(
      existingSubscription.options.applicationServerKey,
      expectedKey
    )
  ) {
    return existingSubscription;
  }
  if (existingSubscription) {
    await existingSubscription.unsubscribe();
  }
  return registration.pushManager.subscribe({
    applicationServerKey: expectedKey,
    userVisibleOnly: true,
  });
};

export const serializePushSubscription = (
  subscription: PushSubscription
): SerializedPushSubscription | null => {
  const serialized = subscription.toJSON();
  const auth = serialized.keys?.auth;
  const p256dh = serialized.keys?.p256dh;
  if (!(auth && p256dh)) {
    return null;
  }
  return {
    auth,
    endpoint: subscription.endpoint,
    expirationTime: subscription.expirationTime
      ? new Date(subscription.expirationTime).toISOString()
      : null,
    p256dh,
    userAgent: navigator.userAgent,
  };
};
