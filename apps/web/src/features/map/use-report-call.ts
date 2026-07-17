import { LocalAudioTrack, Room, RoomEvent, Track } from "livekit-client";
import { useCallback, useEffect, useRef, useState } from "react";

import type {
  CallTranscriptSegment,
  OperatorCallSession,
  TranscriptSpeaker,
} from "@/features/calls/types";
import { useCallTranscription } from "@/features/calls/use-call-transcription";

import {
  useCancelOperatorCallMutation,
  useEndOperatorCallMutation,
  useOperatorCallStateQuery,
  useStartOperatorCallMutation,
} from "./api";

const IDLE_SESSION: OperatorCallSession = {
  connectedAt: null,
  durationSeconds: 0,
  error: null,
  interimOperatorText: "",
  interimReporterText: "",
  phase: "idle",
  summary: null,
  transcript: [],
};

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

const requireCallConnection = (connection: {
  available: boolean;
  message: string | null;
  token: string | null;
  url: string | null;
}): { token: string; url: string } => {
  if (!(connection.available && connection.token && connection.url)) {
    throw new Error(connection.message ?? "LiveKit belum tersedia.");
  }
  return { token: connection.token, url: connection.url };
};

export const useReportCall = (selectedReportId: string | null) => {
  const startMutation = useStartOperatorCallMutation();
  const cancelMutation = useCancelOperatorCallMutation();
  const endMutation = useEndOperatorCallMutation();
  const [callSessionId, setCallSessionId] = useState<string | null>(null);
  const [activeReportId, setActiveReportId] = useState<string | null>(null);
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
  const [phase, setPhase] = useState<OperatorCallSession["phase"]>("idle");
  const [error, setError] = useState<string | null>(null);
  const [completedSession, setCompletedSession] =
    useState<OperatorCallSession | null>(null);
  const transcriptRef = useRef<CallTranscriptSegment[]>([]);
  const [transcript, setTranscript] = useState<CallTranscriptSegment[]>([]);
  const roomRef = useRef<Room | null>(null);
  const localTrackRef = useRef<LocalAudioTrack | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const finalizingRef = useRef(false);
  const callStateQuery = useOperatorCallStateQuery(callSessionId);

  const appendTranscript = useCallback(
    (speaker: TranscriptSpeaker, text: string): void => {
      const segment = { speaker, text, timestampMs: Date.now() } as const;
      transcriptRef.current = [...transcriptRef.current, segment].slice(-200);
      setTranscript(transcriptRef.current);
    },
    []
  );
  const onOperatorText = useCallback(
    (text: string) => appendTranscript("OPERATOR", text),
    [appendTranscript]
  );
  const onReporterText = useCallback(
    (text: string) => appendTranscript("REPORTER", text),
    [appendTranscript]
  );
  const operatorTranscription = useCallTranscription({
    enabled: phase === "connected",
    mediaStream: localStream,
    onCommittedText: onOperatorText,
  });
  const reporterTranscription = useCallTranscription({
    enabled: phase === "connected",
    mediaStream: remoteStream,
    onCommittedText: onReporterText,
  });

  const disconnectMedia = useCallback((): void => {
    roomRef.current?.disconnect();
    roomRef.current = null;
    localTrackRef.current?.stop();
    localTrackRef.current = null;
    for (const track of localStream?.getTracks() ?? []) {
      track.stop();
    }
    audioRef.current?.remove();
    audioRef.current = null;
    setLocalStream(null);
    setRemoteStream(null);
  }, [localStream]);

  const finalizeCall = useCallback(
    async (origin: "operator" | "remote" = "operator"): Promise<void> => {
      if (!callSessionId || finalizingRef.current) {
        return;
      }
      finalizingRef.current = true;
      setPhase("finalizing");
      disconnectMedia();
      try {
        if (!callStateQuery.data?.answeredAt) {
          await cancelMutation.mutateAsync({ callSessionId });
          setCallSessionId(null);
          setCompletedSession(null);
          setError(
            origin === "remote"
              ? "Panggilan ditolak atau tidak dijawab oleh pelapor."
              : null
          );
          setPhase(origin === "remote" ? "failed" : "idle");
          return;
        }
        const ended = await endMutation.mutateAsync({
          callSessionId,
          transcript: transcriptRef.current,
        });
        setCompletedSession({
          connectedAt: new Date(callStateQuery.data.answeredAt).getTime(),
          durationSeconds: ended.durationSeconds,
          error: null,
          interimOperatorText: "",
          interimReporterText: "",
          phase: "completed",
          summary: ended.summary,
          transcript: transcriptRef.current,
        });
        setPhase("completed");
      } catch (caughtError) {
        setError(
          caughtError instanceof Error
            ? caughtError.message
            : "Panggilan gagal diakhiri."
        );
        setPhase("failed");
      } finally {
        finalizingRef.current = false;
      }
    },
    [
      callSessionId,
      callStateQuery.data?.answeredAt,
      cancelMutation.mutateAsync,
      disconnectMedia,
      endMutation.mutateAsync,
    ]
  );

  useEffect(() => {
    const call = callStateQuery.data;
    if (!call) {
      return;
    }
    if (call.status === "ACTIVE") {
      setPhase("connected");
    } else if (call.status === "ENDED" || call.status === "FAILED") {
      finalizeCall("remote").catch(() => undefined);
    }
  }, [callStateQuery.data, finalizeCall]);

  useEffect(
    () => () => {
      roomRef.current?.disconnect();
      localTrackRef.current?.stop();
      audioRef.current?.remove();
    },
    []
  );

  const startCall = useCallback(
    async (reportId: string): Promise<void> => {
      if (
        ["requesting", "ringing", "connected", "finalizing"].includes(phase)
      ) {
        return;
      }
      setPhase("requesting");
      setError(null);
      setCompletedSession(null);
      transcriptRef.current = [];
      setTranscript([]);
      let microphone: MediaStream | null = null;
      let room: Room | null = null;
      let startedCallSessionId: string | null = null;
      let shouldCancelStartedCall = false;
      try {
        microphone = await requestMicrophone();
        const started = await startMutation.mutateAsync({ reportId });
        startedCallSessionId = started.call.callSessionId;
        setActiveReportId(reportId);
        const connection = requireCallConnection(started.connection);
        shouldCancelStartedCall = true;
        const [microphoneTrack] = microphone.getAudioTracks();
        if (!microphoneTrack) {
          throw new Error("Track mikrofon tidak tersedia.");
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
          setRemoteStream(new MediaStream([track.mediaStreamTrack]));
        });
        await room.connect(connection.url, connection.token);
        const localTrack = new LocalAudioTrack(
          microphoneTrack,
          undefined,
          true
        );
        await room.localParticipant.publishTrack(localTrack, {
          source: Track.Source.Microphone,
        });
        roomRef.current = room;
        localTrackRef.current = localTrack;
        setLocalStream(microphone);
        setCallSessionId(started.call.callSessionId);
        setPhase("ringing");
      } catch (caughtError) {
        room?.disconnect();
        for (const track of microphone?.getTracks() ?? []) {
          track.stop();
        }
        if (shouldCancelStartedCall && startedCallSessionId) {
          await cancelMutation
            .mutateAsync({ callSessionId: startedCallSessionId })
            .catch(() => undefined);
        }
        setCallSessionId(null);
        setError(
          caughtError instanceof Error
            ? caughtError.message
            : "Panggilan gagal dimulai."
        );
        setPhase("failed");
      }
    },
    [cancelMutation.mutateAsync, phase, startMutation.mutateAsync]
  );

  const currentCall = callStateQuery.data;
  const activeSession: OperatorCallSession = {
    connectedAt: currentCall?.answeredAt
      ? new Date(currentCall.answeredAt).getTime()
      : null,
    durationSeconds: currentCall?.durationSeconds ?? 0,
    error,
    interimOperatorText: operatorTranscription.interimText,
    interimReporterText: reporterTranscription.interimText,
    phase,
    summary: currentCall?.summary ?? null,
    transcript,
  };
  const session =
    selectedReportId && selectedReportId === activeReportId
      ? (completedSession ?? activeSession)
      : IDLE_SESSION;

  return {
    endCall: () => finalizeCall("operator"),
    session,
    startCall,
  };
};
