import {
  Alert,
  AlertDescription,
  AlertTitle,
} from "@siaga-app/ui/components/alert";
import { Badge } from "@siaga-app/ui/components/badge";
import { Button } from "@siaga-app/ui/components/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@siaga-app/ui/components/card";
import {
  type RemoteParticipant,
  type RemoteTrack,
  type RemoteTrackPublication,
  Room,
  RoomEvent,
  Track,
} from "livekit-client";
import {
  ArrowLeftIcon,
  LocateFixedIcon,
  MicIcon,
  MicOffIcon,
  PhoneCallIcon,
  PhoneOffIcon,
  Volume2Icon,
  VolumeXIcon,
} from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { Link } from "react-router";

import { MobilePage } from "@/components/mobile-page";
import { useVoiceTranscription } from "@/lib/use-voice-transcription";

import {
  useAppendCallerTranscriptMutation,
  useEndOfflineCallMutation,
  useOfflineCallConnectionMutation,
  useOfflineCallQuery,
  useStartOfflineCallMutation,
} from "./api";

const SESSION_KEY = "siaga-offline-call-v1";
const TERMINAL_STATUSES = new Set(["CANCELLED", "ENDED", "FAILED", "MISSED"]);

interface CallCredentials {
  accessToken: string;
  callId: string;
}

interface LocationSample {
  latitude?: number;
  locationAccuracy?: number;
  longitude?: number;
}

const readCredentials = (): CallCredentials | null => {
  if (typeof window === "undefined") {
    return null;
  }
  const raw = window.sessionStorage.getItem(SESSION_KEY);
  if (!raw) {
    return null;
  }
  try {
    const value = JSON.parse(raw) as CallCredentials;
    return value.accessToken && value.callId ? value : null;
  } catch {
    return null;
  }
};

const requestOptionalLocation = (): Promise<LocationSample> =>
  new Promise((resolve) => {
    if (!navigator.geolocation) {
      resolve({});
      return;
    }
    navigator.geolocation.getCurrentPosition(
      ({ coords }) =>
        resolve({
          latitude: coords.latitude,
          locationAccuracy: coords.accuracy,
          longitude: coords.longitude,
        }),
      () => resolve({}),
      { enableHighAccuracy: true, maximumAge: 30_000, timeout: 7000 }
    );
  });

const getCallTitle = (status: string | undefined): string => {
  const titles: Record<string, string> = {
    ACTIVE: "Terhubung dengan operator",
    CANCELLED: "Panggilan berakhir",
    ENDED: "Panggilan berakhir",
    FAILED: "Panggilan gagal",
    MISSED: "Belum ada operator yang menjawab",
    WAITING: "Menunggu operator",
  };
  return status
    ? (titles[status] ?? "Panggilan darurat")
    : "Hubungi operator darurat";
};

interface OfflineCallViewProps {
  audioError: string | null;
  credentials: CallCredentials | null;
  hasLocation: boolean;
  interimText: string;
  isAudioConnected: boolean;
  isEndPending: boolean;
  isMuted: boolean;
  isSpeakerEnabled: boolean;
  isStartPending: boolean;
  isTerminal: boolean;
  isTranscriptionUnavailable: boolean;
  onEnd: () => void;
  onMute: () => void;
  onReconnect: () => void;
  onSpeaker: () => void;
  onStart: () => void;
  status: string | undefined;
}

const OfflineCallView = ({
  audioError,
  credentials,
  hasLocation,
  interimText,
  isAudioConnected,
  isEndPending,
  isMuted,
  isSpeakerEnabled,
  isStartPending,
  isTerminal,
  isTranscriptionUnavailable,
  onEnd,
  onMute,
  onReconnect,
  onSpeaker,
  onStart,
  status,
}: OfflineCallViewProps) => (
  <>
    <header className="flex items-center justify-between gap-3">
      <Link
        aria-label="Kembali ke halaman masuk"
        className="flex size-10 items-center justify-center rounded-full bg-muted"
        to="/sign-in"
      >
        <ArrowLeftIcon aria-hidden="true" />
      </Link>
      <Badge variant="secondary">Demo</Badge>
    </header>
    <div className="flex flex-col gap-1 text-center">
      <h1 className="text-h3">Panggilan darurat offline</h1>
      <p className="text-muted-foreground text-sm">Penelepon tamu</p>
    </div>
    <Alert>
      <PhoneCallIcon aria-hidden="true" />
      <AlertTitle>Prototype pitching</AlertTitle>
      <AlertDescription>
        Versi ini masih memakai internet untuk audio dan lokasi. Implementasi
        offline sebenarnya membutuhkan integrasi PSTN/SIP dengan penyedia
        telekomunikasi.
      </AlertDescription>
    </Alert>
    <Card className="citizen-glass-surface">
      <CardHeader className="items-center text-center">
        <div className="flex size-20 items-center justify-center rounded-full bg-primary/15 text-primary">
          {status === "ACTIVE" ? (
            <PhoneCallIcon aria-hidden="true" />
          ) : (
            <PhoneOffIcon aria-hidden="true" />
          )}
        </div>
        <CardTitle>{getCallTitle(status)}</CardTitle>
        <CardDescription>
          {hasLocation ? (
            <span className="flex items-center justify-center gap-1">
              <LocateFixedIcon aria-hidden="true" /> Lokasi dibagikan
            </span>
          ) : (
            "Izin lokasi opsional dan tidak menghalangi panggilan."
          )}
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        {audioError ? (
          <Alert variant="destructive">
            <AlertDescription>{audioError}</AlertDescription>
          </Alert>
        ) : null}
        {isTranscriptionUnavailable && isAudioConnected ? (
          <p className="text-center text-muted-foreground text-xs">
            Transkripsi otomatis tidak didukung browser ini. Audio tetap
            berjalan.
          </p>
        ) : null}
        {interimText.length > 0 ? (
          <p className="rounded-md bg-muted p-3 text-sm">{interimText}</p>
        ) : null}
        {credentials && !isAudioConnected && !isTerminal ? (
          <Button onClick={onReconnect} variant="stroke">
            <MicIcon data-icon="inline-start" /> Sambungkan audio
          </Button>
        ) : null}
        {isAudioConnected && !isTerminal ? (
          <div className="grid grid-cols-2 gap-3">
            <Button onClick={onMute} variant="stroke">
              {isMuted ? (
                <MicOffIcon data-icon="inline-start" />
              ) : (
                <MicIcon data-icon="inline-start" />
              )}
              {isMuted ? "Aktifkan mic" : "Bisukan"}
            </Button>
            <Button onClick={onSpeaker} variant="stroke">
              {isSpeakerEnabled ? (
                <Volume2Icon data-icon="inline-start" />
              ) : (
                <VolumeXIcon data-icon="inline-start" />
              )}
              Speaker
            </Button>
          </div>
        ) : null}
      </CardContent>
      <CardFooter className="flex-col gap-3">
        {credentials && !isTerminal ? (
          <Button
            className="w-full"
            disabled={isEndPending}
            onClick={onEnd}
            variant="destructive"
          >
            <PhoneOffIcon data-icon="inline-start" /> Akhiri panggilan
          </Button>
        ) : (
          <Button
            className="w-full"
            disabled={isStartPending}
            onClick={onStart}
            size="lg"
          >
            <PhoneCallIcon data-icon="inline-start" />
            {isStartPending ? "Menghubungkan..." : "Mulai panggilan demo"}
          </Button>
        )}
      </CardFooter>
    </Card>
  </>
);

export const OfflineCallScreen = () => {
  const [credentials, setCredentials] = useState<CallCredentials | null>(
    readCredentials
  );
  const [room, setRoom] = useState<Room | null>(null);
  const [isAudioConnected, setIsAudioConnected] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isSpeakerEnabled, setIsSpeakerEnabled] = useState(true);
  const [audioError, setAudioError] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement>(null);
  const startCall = useStartOfflineCallMutation();
  const getConnection = useOfflineCallConnectionMutation();
  const appendTranscript = useAppendCallerTranscriptMutation();
  const endCall = useEndOfflineCallMutation();
  const callQuery = useOfflineCallQuery(
    credentials ?? { accessToken: "", callId: "" },
    Boolean(credentials)
  );
  const status = callQuery.data?.status;
  const isTerminal = status ? TERMINAL_STATUSES.has(status) : false;

  const connectAudio = useCallback(
    async (connection: { token: string | null; url: string | null }) => {
      if (!(connection.token && connection.url)) {
        setAudioError(
          "Audio demo belum tersedia, tetapi antrean panggilan tetap aktif."
        );
        return;
      }
      const nextRoom = new Room({ adaptiveStream: true, dynacast: true });
      const handleTrackSubscribed = (
        track: RemoteTrack,
        _publication: RemoteTrackPublication,
        _participant: RemoteParticipant
      ) => {
        if (track.kind === Track.Kind.Audio && audioRef.current) {
          track.attach(audioRef.current);
        }
      };
      nextRoom.on(RoomEvent.TrackSubscribed, handleTrackSubscribed);
      try {
        await nextRoom.connect(connection.url, connection.token);
        await nextRoom.startAudio();
        await nextRoom.localParticipant.setMicrophoneEnabled(true);
        setRoom(nextRoom);
        setIsAudioConnected(true);
        setAudioError(null);
      } catch (error) {
        nextRoom.disconnect();
        setAudioError(
          error instanceof Error
            ? error.message
            : "Mikrofon belum dapat tersambung."
        );
      }
    },
    []
  );

  useEffect(
    () => () => {
      room?.disconnect();
    },
    [room]
  );

  const handleFinalTranscript = useCallback(
    ({ confidence, text }: { confidence?: number; text: string }) => {
      if (!credentials) {
        return;
      }
      appendTranscript.mutate({
        ...credentials,
        confidence,
        content: text,
        idempotencyKey: crypto.randomUUID(),
      });
    },
    [appendTranscript, credentials]
  );
  const transcription = useVoiceTranscription({
    enabled: isAudioConnected && !isMuted && !isTerminal,
    onFinalResult: handleFinalTranscript,
  });

  const handleStart = async () => {
    setAudioError(null);
    const location = await requestOptionalLocation();
    try {
      const result = await startCall.mutateAsync({
        ...location,
        idempotencyKey: crypto.randomUUID(),
      });
      const nextCredentials = {
        accessToken: result.accessToken,
        callId: result.call.id,
      };
      window.sessionStorage.setItem(
        SESSION_KEY,
        JSON.stringify(nextCredentials)
      );
      setCredentials(nextCredentials);
      await connectAudio(result.connection);
    } catch (error) {
      setAudioError(
        error instanceof Error
          ? error.message
          : "Panggilan belum dapat dimulai."
      );
    }
  };

  const handleReconnect = async () => {
    if (!credentials) {
      return;
    }
    try {
      const connection = await getConnection.mutateAsync(credentials);
      await connectAudio(connection);
    } catch (error) {
      setAudioError(
        error instanceof Error
          ? error.message
          : "Audio belum dapat disambungkan."
      );
    }
  };

  const handleMute = async () => {
    if (!room) {
      return;
    }
    const nextMuted = !isMuted;
    await room.localParticipant.setMicrophoneEnabled(!nextMuted);
    setIsMuted(nextMuted);
  };

  const handleSpeaker = () => {
    const nextEnabled = !isSpeakerEnabled;
    if (audioRef.current) {
      audioRef.current.muted = !nextEnabled;
    }
    setIsSpeakerEnabled(nextEnabled);
  };

  const handleEnd = async () => {
    if (!credentials) {
      return;
    }
    try {
      await endCall.mutateAsync(credentials);
    } finally {
      room?.disconnect();
      setRoom(null);
      setIsAudioConnected(false);
      window.sessionStorage.removeItem(SESSION_KEY);
      await callQuery.refetch();
    }
  };

  return (
    <MobilePage className="gap-5 pb-8" title="Panggilan Offline Demo">
      <audio autoPlay ref={audioRef}>
        <track kind="captions" />
      </audio>
      <OfflineCallView
        audioError={audioError}
        credentials={credentials}
        hasLocation={Boolean(callQuery.data?.latitude)}
        interimText={transcription.interimText}
        isAudioConnected={isAudioConnected}
        isEndPending={endCall.isPending}
        isMuted={isMuted}
        isSpeakerEnabled={isSpeakerEnabled}
        isStartPending={startCall.isPending}
        isTerminal={isTerminal}
        isTranscriptionUnavailable={transcription.status === "unavailable"}
        onEnd={handleEnd}
        onMute={handleMute}
        onReconnect={handleReconnect}
        onSpeaker={handleSpeaker}
        onStart={handleStart}
        status={status}
      />
    </MobilePage>
  );
};
