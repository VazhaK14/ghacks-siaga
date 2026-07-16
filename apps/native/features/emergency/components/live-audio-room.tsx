import { LiveKitRoom } from "@livekit/react-native";
import type { PropsWithChildren } from "react";
import { useCallback, useEffect, useState } from "react";
import { Text, View } from "react-native";

import {
  useActivateReporterSessionMutation,
  useLiveKitConnectionMutation,
} from "../api";

interface LiveAudioRoomProps {
  reportId: string;
}

export function LiveAudioRoom({
  children,
  reportId,
}: PropsWithChildren<LiveAudioRoomProps>) {
  const connectionMutation = useLiveKitConnectionMutation();
  const activateSession = useActivateReporterSessionMutation();
  const [connectionError, setConnectionError] = useState<string | null>(null);

  useEffect(() => {
    connectionMutation.mutateAsync({ reportId }).catch((error: unknown) => {
      setConnectionError(
        error instanceof Error
          ? error.message
          : "Sesi suara belum dapat dihubungkan."
      );
    });
  }, [connectionMutation, reportId]);

  const handleConnected = useCallback(() => {
    setConnectionError(null);
    activateSession.mutate({ reportId });
  }, [activateSession, reportId]);

  const handleConnectionError = useCallback((error: Error) => {
    setConnectionError(error.message);
  }, []);

  const handleMediaDeviceFailure = useCallback(() => {
    setConnectionError(
      "Izin atau perangkat mikrofon tidak tersedia. Gunakan mode teks."
    );
  }, []);

  const connection = connectionMutation.data;
  const message =
    connectionError ??
    connection?.message ??
    (connectionMutation.isPending ? "Menyiapkan koneksi suara..." : null);

  if (!(connection?.available && connection.token && connection.url)) {
    return (
      <View className="flex-1">
        {message ? (
          <View className="absolute top-14 right-5 left-5 z-50 rounded-xl bg-black/75 px-4 py-3">
            <Text className="text-center text-white text-xs leading-5">
              {message}
            </Text>
          </View>
        ) : null}
        {children}
      </View>
    );
  }

  return (
    <LiveKitRoom
      audio
      connect
      onConnected={handleConnected}
      onError={handleConnectionError}
      onMediaDeviceFailure={handleMediaDeviceFailure}
      serverUrl={connection.url}
      token={connection.token}
      video={false}
    >
      {children}
    </LiveKitRoom>
  );
}
