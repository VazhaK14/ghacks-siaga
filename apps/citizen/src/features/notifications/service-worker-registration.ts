const SERVICE_WORKER_SCOPE = import.meta.env.BASE_URL;
const SERVICE_WORKER_URL = `${SERVICE_WORKER_SCOPE}service-worker.js`;

let registrationPromise: Promise<ServiceWorkerRegistration | null> | null =
  null;

const supportsServiceWorker = (): boolean =>
  typeof navigator !== "undefined" && "serviceWorker" in navigator;

const registerServiceWorker = (): Promise<ServiceWorkerRegistration | null> => {
  if (!supportsServiceWorker()) {
    return Promise.resolve(null);
  }
  return navigator.serviceWorker.register(SERVICE_WORKER_URL, {
    scope: SERVICE_WORKER_SCOPE,
  });
};

export const registerCitizenServiceWorker =
  (): Promise<ServiceWorkerRegistration | null> => {
    if (!registrationPromise) {
      registrationPromise = registerServiceWorker().catch((error: unknown) => {
        registrationPromise = null;
        throw error;
      });
    }
    return registrationPromise;
  };
