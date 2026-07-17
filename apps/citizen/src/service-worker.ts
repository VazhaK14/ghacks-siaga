/// <reference lib="webworker" />

import { cleanupOutdatedCaches, precacheAndRoute } from "workbox-precaching";

declare const self: ServiceWorkerGlobalScope & {
  __WB_MANIFEST: Parameters<typeof precacheAndRoute>[0][number][];
};

interface PushPayload {
  body?: string;
  data?: { reportId?: string; url?: string };
  tag?: string;
  title?: string;
}

const DEFAULT_NOTIFICATION_TITLE = "Pembaruan SIAGA";

cleanupOutdatedCaches();
precacheAndRoute(self.__WB_MANIFEST);
self.skipWaiting();

self.addEventListener("activate", (event: ExtendableEvent) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener("push", (event: PushEvent) => {
  let payload: PushPayload = {};
  if (event.data) {
    try {
      payload = event.data.json() as PushPayload;
    } catch {
      payload = { body: event.data.text() };
    }
  }

  event.waitUntil(
    self.registration.showNotification(
      payload.title ?? DEFAULT_NOTIFICATION_TITLE,
      {
        badge: "icons/siaga.svg",
        body: payload.body,
        data: payload.data,
        icon: "icons/siaga.svg",
        tag: payload.tag,
      }
    )
  );
});

self.addEventListener("notificationclick", (event: NotificationEvent) => {
  event.notification.close();
  const notificationData = event.notification.data as
    | PushPayload["data"]
    | undefined;
  const targetUrl = new URL(
    notificationData?.url ?? ".",
    self.registration.scope
  ).href;

  event.waitUntil(
    self.clients
      .matchAll({ includeUncontrolled: true, type: "window" })
      .then((clients) => {
        const existingClient = clients.find(
          (client) => new URL(client.url).origin === new URL(targetUrl).origin
        );
        if (!existingClient) {
          return self.clients.openWindow(targetUrl);
        }
        return existingClient
          .navigate(targetUrl)
          .then(() => existingClient.focus());
      })
  );
});
