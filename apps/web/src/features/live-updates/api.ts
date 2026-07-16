import { env } from "@siaga-app/env/web";
import { useEffect, useState } from "react";

import { getServerUrl } from "@/lib/get-server-url";
import {
  OPERATIONAL_EVENT_NAMES,
  type OperationalConnectionStatus,
  type OperationalEventName,
  type OperationalLiveEvent,
} from "./types";

const isOperationalEventName = (
  value: unknown
): value is OperationalEventName =>
  typeof value === "string" &&
  OPERATIONAL_EVENT_NAMES.some((eventName) => eventName === value);

export function useOperationalLiveEvents(
  onEvent: (event: OperationalLiveEvent) => void | Promise<void>
): OperationalConnectionStatus {
  const [connectionStatus, setConnectionStatus] =
    useState<OperationalConnectionStatus>("connecting");

  useEffect(() => {
    const serverUrl = getServerUrl(env.VITE_SERVER_URL);
    const eventSource = new EventSource(`${serverUrl}/sse/reports/live`, {
      withCredentials: true,
    });
    const handleConnected = () => {
      setConnectionStatus("connected");
    };
    const handleEvent = (event: Event) => {
      const messageEvent = event as MessageEvent<string>;
      try {
        const payload = JSON.parse(messageEvent.data) as {
          reportId?: unknown;
          type?: unknown;
        };
        if (!isOperationalEventName(payload.type)) {
          return;
        }
        setConnectionStatus("connected");
        Promise.resolve(
          onEvent({
            reportId:
              typeof payload.reportId === "string"
                ? payload.reportId
                : undefined,
            type: payload.type,
          })
        ).catch(() => {
          setConnectionStatus("unavailable");
        });
      } catch {
        setConnectionStatus("unavailable");
      }
    };
    const handleError = () => {
      setConnectionStatus("reconnecting");
    };

    eventSource.addEventListener("connected", handleConnected);
    for (const eventName of OPERATIONAL_EVENT_NAMES) {
      eventSource.addEventListener(eventName, handleEvent);
    }
    eventSource.onerror = handleError;

    return () => {
      eventSource.removeEventListener("connected", handleConnected);
      for (const eventName of OPERATIONAL_EVENT_NAMES) {
        eventSource.removeEventListener(eventName, handleEvent);
      }
      eventSource.close();
    };
  }, [onEvent]);

  return connectionStatus;
}
