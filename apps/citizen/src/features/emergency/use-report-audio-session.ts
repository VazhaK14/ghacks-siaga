import { LocalAudioTrack, Room, Track } from "livekit-client";
import { useEffect, useState } from "react";

import {
  useActivateReporterSessionMutation,
  useGetReporterLiveKitConnectionMutation,
} from "./api";

export type ReportAudioSessionStatus =
  | "idle"
  | "starting"
  | "active"
  | "degraded"
  | "unavailable";

interface ReportAudioSession {
  error: string | null;
  mediaStream: MediaStream | null;
  status: ReportAudioSessionStatus;
}

interface LiveKitConnectionData {
  available: boolean;
  message: string | null;
  token: string | null;
  url: string | null;
}

interface LiveKitResources {
  localTrack: LocalAudioTrack;
  room: Room;
}

type OperationResult<T> =
  | { data: T; error: null }
  | { data: null; error: string };

const requestMicrophone = (): Promise<MediaStream> =>
  navigator.mediaDevices.getUserMedia({
    audio: {
      autoGainControl: true,
      channelCount: 1,
      echoCancellation: true,
      noiseSuppression: true,
    },
    video: false,
  });

const connectLiveKit = async (
  reportId: string,
  mediaStream: MediaStream,
  getConnection: (input: {
    reportId: string;
  }) => Promise<LiveKitConnectionData>,
  activate: (input: { reportId: string }) => Promise<unknown>
): Promise<LiveKitResources> => {
  const connection = await getConnection({ reportId });
  if (!(connection.available && connection.token && connection.url)) {
    throw new Error(connection.message ?? "Recording LiveKit belum tersedia.");
  }
  const [microphoneTrack] = mediaStream.getAudioTracks();
  if (!microphoneTrack) {
    throw new Error("Track mikrofon tidak tersedia.");
  }
  const room = new Room({ adaptiveStream: true, dynacast: true });
  let localTrack: LocalAudioTrack | null = null;
  try {
    await room.connect(connection.url, connection.token);
    localTrack = new LocalAudioTrack(microphoneTrack, undefined, true);
    await room.localParticipant.publishTrack(localTrack, {
      source: Track.Source.Microphone,
    });
    await activate({ reportId });
    return { localTrack, room };
  } catch (error) {
    localTrack?.stop();
    room.disconnect();
    throw error;
  }
};

const acquireMicrophone = async (): Promise<OperationResult<MediaStream>> => {
  try {
    return { data: await requestMicrophone(), error: null };
  } catch {
    return {
      data: null,
      error: "Izin mikrofon ditolak atau perangkat tidak tersedia.",
    };
  }
};

const establishLiveKit = async (
  reportId: string,
  mediaStream: MediaStream,
  getConnection: (input: {
    reportId: string;
  }) => Promise<LiveKitConnectionData>,
  activate: (input: { reportId: string }) => Promise<unknown>
): Promise<OperationResult<LiveKitResources>> => {
  try {
    const data = await connectLiveKit(
      reportId,
      mediaStream,
      getConnection,
      activate
    );
    return { data, error: null };
  } catch (error) {
    return {
      data: null,
      error:
        error instanceof Error
          ? error.message
          : "Recording pusat sedang tidak tersedia.",
    };
  }
};

export const useReportAudioSession = (
  reportId: string | null,
  enabled: boolean
): ReportAudioSession => {
  const getLiveKitConnection = useGetReporterLiveKitConnectionMutation();
  const activateSession = useActivateReporterSessionMutation();
  const [session, setSession] = useState<ReportAudioSession>({
    error: null,
    mediaStream: null,
    status: "idle",
  });

  useEffect(() => {
    if (!(enabled && reportId)) {
      return;
    }
    let cancelled = false;
    let room: Room | null = null;
    let localTrack: LocalAudioTrack | null = null;
    let mediaStream: MediaStream | null = null;

    const start = async (): Promise<void> => {
      setSession({ error: null, mediaStream: null, status: "starting" });
      const microphoneResult = await acquireMicrophone();
      if (!microphoneResult.data) {
        if (!cancelled) {
          setSession({
            error: microphoneResult.error,
            mediaStream: null,
            status: "unavailable",
          });
        }
        return;
      }
      mediaStream = microphoneResult.data;
      if (cancelled) {
        for (const track of mediaStream.getTracks()) {
          track.stop();
        }
        return;
      }

      setSession({ error: null, mediaStream, status: "active" });
      const connectionResult = await establishLiveKit(
        reportId,
        mediaStream,
        getLiveKitConnection.mutateAsync,
        activateSession.mutateAsync
      );
      if (connectionResult.data) {
        ({ localTrack, room } = connectionResult.data);
        return;
      }
      if (!cancelled) {
        setSession({
          error: connectionResult.error,
          mediaStream,
          status: "degraded",
        });
      }
    };

    start();
    return () => {
      cancelled = true;
      room?.disconnect();
      localTrack?.stop();
      for (const track of mediaStream?.getTracks() ?? []) {
        track.stop();
      }
    };
  }, [
    activateSession.mutateAsync,
    enabled,
    getLiveKitConnection.mutateAsync,
    reportId,
  ]);

  return session;
};
