import { LocalAudioTrack, Room, RoomEvent, Track } from "livekit-client";
import { useCallback, useEffect, useRef, useState } from "react";

import {
  useAcceptIncomingCallMutation,
  useEndIncomingCallMutation,
  useIncomingOperatorCallQuery,
  useRejectIncomingCallMutation,
} from "@/features/emergency/api";

export type IncomingCallPhase =
  | "loading"
  | "ringing"
  | "connecting"
  | "active"
  | "ended"
  | "error";

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

export const useIncomingCall = (callSessionId: string | null) => {
  const callQuery = useIncomingOperatorCallQuery(callSessionId);
  const acceptMutation = useAcceptIncomingCallMutation();
  const rejectMutation = useRejectIncomingCallMutation();
  const endMutation = useEndIncomingCallMutation();
  const [phase, setPhase] = useState<IncomingCallPhase>("loading");
  const [error, setError] = useState<string | null>(null);
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const roomRef = useRef<Room | null>(null);
  const localTrackRef = useRef<LocalAudioTrack | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const disconnect = useCallback((): void => {
    roomRef.current?.disconnect();
    roomRef.current = null;
    localTrackRef.current?.stop();
    localTrackRef.current = null;
    for (const track of mediaStreamRef.current?.getTracks() ?? []) {
      track.stop();
    }
    mediaStreamRef.current = null;
    audioRef.current?.remove();
    audioRef.current = null;
  }, []);

  useEffect(() => {
    if (callQuery.isPending) {
      setPhase("loading");
      return;
    }
    if (callQuery.error) {
      setError(callQuery.error.message);
      setPhase("error");
      return;
    }
    if (callQuery.data?.status === "ACTIVE") {
      setPhase("active");
    } else if (
      callQuery.data?.status === "ENDED" ||
      callQuery.data?.status === "FAILED"
    ) {
      disconnect();
      setPhase("ended");
    } else if (callQuery.data?.status === "CONNECTING") {
      setPhase((current) => (current === "connecting" ? current : "ringing"));
    }
  }, [
    callQuery.data?.status,
    callQuery.error,
    callQuery.isPending,
    disconnect,
  ]);

  useEffect(() => disconnect, [disconnect]);

  const accept = useCallback(async (): Promise<void> => {
    if (!callSessionId) {
      return;
    }
    setPhase("connecting");
    setError(null);
    let mediaStream: MediaStream | null = null;
    let room: Room | null = null;
    let callAccepted = false;
    try {
      mediaStream = await requestMicrophone();
      const result = await acceptMutation.mutateAsync({ callSessionId });
      callAccepted = true;
      if (
        !(
          result.connection.available &&
          result.connection.token &&
          result.connection.url
        )
      ) {
        throw new Error(result.connection.message ?? "LiveKit belum tersedia.");
      }
      const [microphoneTrack] = mediaStream.getAudioTracks();
      if (!microphoneTrack) {
        throw new Error("Mikrofon tidak tersedia.");
      }
      room = new Room({ adaptiveStream: true, dynacast: true });
      room.on(RoomEvent.TrackSubscribed, (track) => {
        if (track.kind !== Track.Kind.Audio) {
          return;
        }
        const audio = track.attach();
        audio.autoplay = true;
        audioRef.current?.remove();
        audioRef.current = audio;
        document.body.append(audio);
      });
      await room.connect(result.connection.url, result.connection.token);
      const localTrack = new LocalAudioTrack(microphoneTrack, undefined, true);
      await room.localParticipant.publishTrack(localTrack, {
        source: Track.Source.Microphone,
      });
      roomRef.current = room;
      localTrackRef.current = localTrack;
      mediaStreamRef.current = mediaStream;
      setPhase("active");
    } catch (caughtError) {
      room?.disconnect();
      for (const track of mediaStream?.getTracks() ?? []) {
        track.stop();
      }
      if (callAccepted) {
        await endMutation.mutateAsync({ callSessionId }).catch(() => undefined);
      }
      setError(
        caughtError instanceof Error
          ? caughtError.message
          : "Panggilan gagal disambungkan."
      );
      setPhase("error");
    }
  }, [acceptMutation.mutateAsync, callSessionId, endMutation.mutateAsync]);

  const reject = useCallback(async (): Promise<void> => {
    if (!callSessionId) {
      return;
    }
    await rejectMutation.mutateAsync({ callSessionId });
    disconnect();
    setPhase("ended");
  }, [callSessionId, disconnect, rejectMutation.mutateAsync]);

  const end = useCallback(async (): Promise<void> => {
    if (!callSessionId) {
      return;
    }
    disconnect();
    await endMutation.mutateAsync({ callSessionId });
    setPhase("ended");
  }, [callSessionId, disconnect, endMutation.mutateAsync]);

  const toggleMute = useCallback(async (): Promise<void> => {
    const localTrack = localTrackRef.current;
    if (!localTrack) {
      return;
    }
    if (isMuted) {
      await localTrack.unmute();
    } else {
      await localTrack.mute();
    }
    setIsMuted((current) => !current);
  }, [isMuted]);

  return {
    accept,
    call: callQuery.data ?? null,
    end,
    error,
    isMuted,
    phase,
    reject,
    toggleMute,
  };
};
