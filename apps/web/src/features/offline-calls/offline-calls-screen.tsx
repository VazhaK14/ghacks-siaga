import type { AppRouter } from "@siaga-app/api/routers/index";
import { Alert, AlertDescription } from "@siaga-app/ui/components/alert";
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
import { Checkbox } from "@siaga-app/ui/components/checkbox";
import { Field, FieldGroup, FieldLabel } from "@siaga-app/ui/components/field";
import type { inferRouterOutputs } from "@trpc/server";
import {
  type RemoteParticipant,
  type RemoteTrack,
  type RemoteTrackPublication,
  Room,
  RoomEvent,
  Track,
} from "livekit-client";
import {
  BrainCircuitIcon,
  Clock3Icon,
  LocateFixedIcon,
  MicIcon,
  MicOffIcon,
  PhoneCallIcon,
  PhoneIncomingIcon,
  PhoneOffIcon,
  Volume2Icon,
  VolumeXIcon,
} from "lucide-react";
import type { MouseEventHandler } from "react";
import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";

import type {
  CallTranscriptionStatus,
  CallTranscriptSegment,
  TranscriptSpeaker,
} from "@/features/calls/types";
import { useCallTranscription } from "@/features/calls/use-call-transcription";

import {
  useAcceptOfflineCallMutation,
  useEndOperatorCallMutation,
  useFinalizeOfflineCallMutation,
  useOfflineCallDetailQuery,
  useOfflineCallLiveUpdates,
  useOfflineCallsQuery,
  useOperatorConnectionMutation,
} from "./api";
import { ConvertCallDialog } from "./convert-call-dialog";

type OfflineCall = inferRouterOutputs<AppRouter>["offlineCall"]["list"][number];

const CHECKLIST = [
  "Lokasi pasti dan patokan terdekat",
  "Jenis kejadian",
  "Bahaya yang masih berlangsung",
  "Jumlah dan kondisi korban",
  "Nama dan nomor panggilan balik",
  "Keamanan penelepon saat ini",
  "Jenis respons yang dibutuhkan",
] as const;
const MAX_TRANSCRIPT_SEGMENTS = 200;
const TERMINAL_STATUSES = new Set(["CANCELLED", "ENDED", "FAILED", "MISSED"]);

const formatCallTime = (date: Date | string): string =>
  new Intl.DateTimeFormat("id-ID", {
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(date));

const getQueueStatus = (call: OfflineCall): string => {
  if (call.status === "WAITING") {
    return "Menunggu";
  }
  if (call.status === "ACTIVE") {
    return "Aktif";
  }
  return call.summary ? "Siap ditinjau" : "Perlu diringkas";
};

const QueueCard = ({
  call,
  isSelected,
  onSelect,
}: {
  call: OfflineCall;
  isSelected: boolean;
  onSelect: MouseEventHandler<HTMLButtonElement>;
}) => (
  <button
    className="w-full text-left"
    onClick={onSelect}
    type="button"
    value={call.id}
  >
    <Card className={isSelected ? "ring-2 ring-primary" : undefined} size="sm">
      <CardHeader>
        <CardTitle className="flex items-center justify-between gap-2">
          <span>Penelepon tamu</span>
          <Badge variant={call.status === "ACTIVE" ? "default" : "secondary"}>
            {getQueueStatus(call)}
          </Badge>
        </CardTitle>
        <CardDescription className="flex items-center gap-2">
          <Clock3Icon aria-hidden="true" /> {formatCallTime(call.createdAt)}
        </CardDescription>
      </CardHeader>
    </Card>
  </button>
);

const CallQueue = ({
  calls,
  onSelect,
  selectedCallId,
}: {
  calls: OfflineCall[];
  onSelect: (callId: string) => void;
  selectedCallId: string | null;
}) => {
  const handleSelect: MouseEventHandler<HTMLButtonElement> = (event) => {
    onSelect(event.currentTarget.value);
  };
  return (
    <section aria-label="Antrean panggilan" className="flex flex-col gap-3">
      <h2 className="font-semibold">Antrean ({calls.length})</h2>
      {calls.length > 0 ? (
        calls.map((call) => (
          <QueueCard
            call={call}
            isSelected={selectedCallId === call.id}
            key={call.id}
            onSelect={handleSelect}
          />
        ))
      ) : (
        <Card>
          <CardContent className="py-8 text-center text-muted-foreground text-sm">
            Tidak ada panggilan yang perlu ditangani.
          </CardContent>
        </Card>
      )}
    </section>
  );
};

const getTranscriptionMessage = (input: {
  operatorError: string | null;
  operatorStatus: CallTranscriptionStatus;
  reporterError: string | null;
  reporterStatus: CallTranscriptionStatus;
}): string | null => {
  const hasFailure = [input.operatorStatus, input.reporterStatus].some(
    (status) => status === "failed" || status === "unavailable"
  );
  if (!hasFailure) {
    return null;
  }
  return (
    input.operatorError ??
    input.reporterError ??
    "Transkripsi AI tidak tersedia. Audio tetap aktif."
  );
};

const TemporaryTranscript = ({
  active,
  interimOperatorText,
  interimReporterText,
  transcript,
}: {
  active: boolean;
  interimOperatorText: string;
  interimReporterText: string;
  transcript: CallTranscriptSegment[];
}) => {
  if (!active) {
    return null;
  }
  const hasTranscript = Boolean(
    transcript.length > 0 || interimOperatorText || interimReporterText
  );
  return (
    <div className="max-h-72 overflow-y-auto rounded-md bg-muted/50 p-3">
      {hasTranscript ? (
        <div aria-live="polite" className="flex flex-col gap-3">
          {transcript.slice(-12).map((segment) => (
            <div
              className="flex flex-col gap-1"
              key={`${segment.timestampMs}-${segment.speaker}`}
            >
              <span className="font-semibold text-xs">
                {segment.speaker === "REPORTER" ? "Penelepon" : "Operator"}
              </span>
              <p className="text-sm">{segment.text}</p>
            </div>
          ))}
          {interimOperatorText ? (
            <p className="text-muted-foreground text-sm italic">
              Operator: {interimOperatorText}
            </p>
          ) : null}
          {interimReporterText ? (
            <p className="text-muted-foreground text-sm italic">
              Penelepon: {interimReporterText}
            </p>
          ) : null}
        </div>
      ) : (
        <p className="text-muted-foreground text-sm">
          Transkrip sementara akan muncul di sini dan dibuang setelah ringkasan
          dibuat.
        </p>
      )}
    </div>
  );
};

const CallSummaryPanel = ({ call }: { call: OfflineCall }) => {
  if (!call.summary) {
    return null;
  }
  return (
    <div className="flex flex-col gap-4 rounded-md border bg-muted/30 p-4">
      <div className="flex items-center justify-between gap-3">
        <span className="flex items-center gap-2 font-semibold text-sm">
          <BrainCircuitIcon aria-hidden="true" /> Ringkasan AI
        </span>
        <Badge variant="secondary">
          Confidence {call.summary.confidencePercent}%
        </Badge>
      </div>
      <p className="text-sm leading-relaxed">{call.summary.summary}</p>
      <ul className="list-disc space-y-1 pl-5 text-muted-foreground text-sm">
        {call.summary.keyPoints.map((keyPoint) => (
          <li key={keyPoint}>{keyPoint}</li>
        ))}
      </ul>
      <p className="text-sm">
        <span className="font-semibold">Kondisi penelepon: </span>
        {call.summary.callerCondition}
      </p>
      <p className="text-sm">
        <span className="font-semibold">Tindak lanjut: </span>
        {call.summary.followUp}
      </p>
      <ConvertCallDialog
        callId={call.id}
        convertedReportId={call.convertedReportId}
        defaultSummary={call.summary.summary}
      />
    </div>
  );
};

interface CallDetailCardProps {
  call: OfflineCall;
  interimOperatorText: string;
  interimReporterText: string;
  isAcceptPending: boolean;
  isEndPending: boolean;
  isFinalizing: boolean;
  isMuted: boolean;
  isSpeakerEnabled: boolean;
  onAccept: () => void;
  onEnd: () => void;
  onFinalize: () => void;
  onMute: () => void;
  onReconnect: () => void;
  onSpeaker: () => void;
  room: Room | null;
  transcript: CallTranscriptSegment[];
  transcriptionMessage: string | null;
}

const CallDetailCard = ({
  call,
  interimOperatorText,
  interimReporterText,
  isAcceptPending,
  isEndPending,
  isFinalizing,
  isMuted,
  isSpeakerEnabled,
  onAccept,
  onEnd,
  onFinalize,
  onMute,
  onReconnect,
  onSpeaker,
  room,
  transcript,
  transcriptionMessage,
}: CallDetailCardProps) => (
  <Card>
    <CardHeader>
      <CardTitle className="flex items-center gap-2">
        <PhoneIncomingIcon aria-hidden="true" /> Penelepon tamu
      </CardTitle>
      <CardDescription>
        {call.latitude && call.longitude ? (
          <span className="flex items-center gap-1">
            <LocateFixedIcon aria-hidden="true" />
            {call.latitude.toFixed(5)}, {call.longitude.toFixed(5)}
            {call.locationAccuracy
              ? ` (akurasi ±${Math.round(call.locationAccuracy)} m)`
              : ""}
          </span>
        ) : (
          "Lokasi tidak dibagikan"
        )}
      </CardDescription>
    </CardHeader>
    <CardContent className="flex flex-col gap-4">
      {call.status === "WAITING" ? (
        <Button disabled={isAcceptPending} onClick={onAccept} size="lg">
          <PhoneCallIcon data-icon="inline-start" /> Ambil panggilan
        </Button>
      ) : null}
      {call.status === "ACTIVE" && !room ? (
        <Button onClick={onReconnect} variant="stroke">
          <MicIcon data-icon="inline-start" /> Sambungkan audio
        </Button>
      ) : null}
      {room ? (
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
      {transcriptionMessage ? (
        <Alert>
          <AlertDescription>{transcriptionMessage}</AlertDescription>
        </Alert>
      ) : null}
      <TemporaryTranscript
        active={call.status === "ACTIVE"}
        interimOperatorText={interimOperatorText}
        interimReporterText={interimReporterText}
        transcript={transcript}
      />
      {isFinalizing ? (
        <p className="text-muted-foreground text-sm">
          AI sedang menyusun ringkasan panggilan…
        </p>
      ) : null}
      {TERMINAL_STATUSES.has(call.status) && !call.summary ? (
        <Button disabled={isFinalizing} onClick={onFinalize} variant="stroke">
          <BrainCircuitIcon data-icon="inline-start" /> Buat ringkasan
        </Button>
      ) : null}
      <CallSummaryPanel call={call} />
    </CardContent>
    {call.status === "ACTIVE" ? (
      <CardFooter>
        <Button disabled={isEndPending} onClick={onEnd} variant="destructive">
          <PhoneOffIcon data-icon="inline-start" /> Akhiri panggilan
        </Button>
      </CardFooter>
    ) : null}
  </Card>
);

const ChecklistItem = ({
  checked,
  item,
  onChange,
}: {
  checked: boolean;
  item: string;
  onChange: (item: string, checked: boolean) => void;
}) => {
  const handleChange = (value: boolean | "indeterminate") => {
    onChange(item, value === true);
  };
  return (
    <Field className="flex-row items-center">
      <Checkbox
        checked={checked}
        id={`check-${item}`}
        onCheckedChange={handleChange}
      />
      <FieldLabel htmlFor={`check-${item}`}>{item}</FieldLabel>
    </Field>
  );
};

const ChecklistCard = ({
  checkedItems,
  onChange,
}: {
  checkedItems: Set<string>;
  onChange: (item: string, checked: boolean) => void;
}) => (
  <Card>
    <CardHeader>
      <CardTitle>Checklist operator</CardTitle>
      <CardDescription>
        Konfirmasi lisan sebelum menjadikan ringkasan sebagai laporan.
      </CardDescription>
    </CardHeader>
    <CardContent>
      <FieldGroup>
        {CHECKLIST.map((item) => (
          <ChecklistItem
            checked={checkedItems.has(item)}
            item={item}
            key={item}
            onChange={onChange}
          />
        ))}
      </FieldGroup>
    </CardContent>
  </Card>
);

export const OfflineCallsScreen = () => {
  useOfflineCallLiveUpdates();
  const callsQuery = useOfflineCallsQuery();
  const [selectedCallId, setSelectedCallId] = useState<string | null>(null);
  const detailQuery = useOfflineCallDetailQuery(selectedCallId);
  const acceptCall = useAcceptOfflineCallMutation();
  const operatorConnection = useOperatorConnectionMutation();
  const endCall = useEndOperatorCallMutation();
  const finalizeCall = useFinalizeOfflineCallMutation();
  const [room, setRoom] = useState<Room | null>(null);
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
  const [isMuted, setIsMuted] = useState(false);
  const [isSpeakerEnabled, setIsSpeakerEnabled] = useState(true);
  const [checkedItems, setCheckedItems] = useState<Set<string>>(new Set());
  const [transcript, setTranscript] = useState<CallTranscriptSegment[]>([]);
  const audioRef = useRef<HTMLAudioElement>(null);
  const roomRef = useRef<Room | null>(null);
  const activeCallIdRef = useRef<string | null>(null);
  const transcriptRef = useRef<CallTranscriptSegment[]>([]);
  const finalizingCallIdsRef = useRef<Set<string>>(new Set());
  const autoFinalizedCallIdsRef = useRef<Set<string>>(new Set());
  const selectedCall = detailQuery.data;

  useEffect(() => {
    if (!selectedCallId && callsQuery.data?.[0]) {
      setSelectedCallId(callsQuery.data[0].id);
    }
  }, [callsQuery.data, selectedCallId]);

  const disconnectAudio = useCallback((): void => {
    roomRef.current?.disconnect();
    roomRef.current = null;
    setRoom(null);
    setLocalStream(null);
    setRemoteStream(null);
  }, []);

  const connectAudio = useCallback(
    async (
      callId: string,
      connection: { token: string | null; url: string | null }
    ): Promise<void> => {
      if (!(connection.token && connection.url)) {
        throw new Error("Koneksi audio LiveKit belum tersedia.");
      }
      disconnectAudio();
      const nextRoom = new Room({ adaptiveStream: true, dynacast: true });
      nextRoom.on(
        RoomEvent.TrackSubscribed,
        (
          track: RemoteTrack,
          _publication: RemoteTrackPublication,
          _participant: RemoteParticipant
        ) => {
          if (track.kind === Track.Kind.Audio && audioRef.current) {
            track.attach(audioRef.current);
            setRemoteStream(new MediaStream([track.mediaStreamTrack]));
          }
        }
      );
      await nextRoom.connect(connection.url, connection.token);
      await nextRoom.startAudio();
      await nextRoom.localParticipant.setMicrophoneEnabled(true);
      const microphonePublication =
        nextRoom.localParticipant.getTrackPublication(Track.Source.Microphone);
      const microphoneTrack = microphonePublication?.track?.mediaStreamTrack;
      if (!microphoneTrack) {
        nextRoom.disconnect();
        throw new Error("Track mikrofon operator tidak tersedia.");
      }
      roomRef.current = nextRoom;
      activeCallIdRef.current = callId;
      setLocalStream(new MediaStream([microphoneTrack]));
      setRoom(nextRoom);
    },
    [disconnectAudio]
  );

  useEffect(
    () => () => {
      roomRef.current?.disconnect();
    },
    []
  );

  useEffect(() => {
    if (!room) {
      return;
    }
    const warnBeforeUnload = (event: BeforeUnloadEvent): void => {
      event.preventDefault();
    };
    window.addEventListener("beforeunload", warnBeforeUnload);
    return () => window.removeEventListener("beforeunload", warnBeforeUnload);
  }, [room]);

  const appendTranscript = useCallback(
    (speaker: TranscriptSpeaker, text: string): void => {
      const segment = { speaker, text, timestampMs: Date.now() } as const;
      const nextTranscript = [...transcriptRef.current, segment].slice(
        -MAX_TRANSCRIPT_SEGMENTS
      );
      transcriptRef.current = nextTranscript;
      setTranscript(nextTranscript);
    },
    []
  );
  const handleOperatorText = useCallback(
    (text: string) => appendTranscript("OPERATOR", text),
    [appendTranscript]
  );
  const handleReporterText = useCallback(
    (text: string) => appendTranscript("REPORTER", text),
    [appendTranscript]
  );
  const transcriptionEnabled = Boolean(
    room && selectedCall?.status === "ACTIVE"
  );
  const operatorTranscription = useCallTranscription({
    enabled: transcriptionEnabled && !isMuted,
    mediaStream: localStream,
    onCommittedText: handleOperatorText,
  });
  const reporterTranscription = useCallTranscription({
    enabled: transcriptionEnabled,
    mediaStream: remoteStream,
    onCommittedText: handleReporterText,
  });

  const finalizeSelectedCall = useCallback(
    async (callId: string): Promise<void> => {
      if (finalizingCallIdsRef.current.has(callId)) {
        return;
      }
      finalizingCallIdsRef.current.add(callId);
      try {
        await finalizeCall.mutateAsync({
          callId,
          transcript: transcriptRef.current,
        });
        transcriptRef.current = [];
        setTranscript([]);
        await detailQuery.refetch();
      } catch (error) {
        toast.error(
          error instanceof Error
            ? error.message
            : "Ringkasan panggilan gagal dibuat."
        );
      } finally {
        finalizingCallIdsRef.current.delete(callId);
      }
    },
    [detailQuery, finalizeCall]
  );

  useEffect(() => {
    if (
      selectedCall &&
      activeCallIdRef.current === selectedCall.id &&
      TERMINAL_STATUSES.has(selectedCall.status) &&
      !selectedCall.summary &&
      !autoFinalizedCallIdsRef.current.has(selectedCall.id)
    ) {
      autoFinalizedCallIdsRef.current.add(selectedCall.id);
      disconnectAudio();
      finalizeSelectedCall(selectedCall.id).catch(() => undefined);
    }
  }, [disconnectAudio, finalizeSelectedCall, selectedCall]);

  const handleSelectCall = useCallback(
    (callId: string): void => {
      if (room && activeCallIdRef.current !== callId) {
        toast.error("Akhiri panggilan aktif sebelum membuka panggilan lain.");
        return;
      }
      if (activeCallIdRef.current !== callId) {
        transcriptRef.current = [];
        setTranscript([]);
        setCheckedItems(new Set());
      }
      setSelectedCallId(callId);
    },
    [room]
  );

  const handleAccept = async (): Promise<void> => {
    if (!selectedCallId) {
      return;
    }
    try {
      const result = await acceptCall.mutateAsync({ callId: selectedCallId });
      await connectAudio(selectedCallId, result.connection);
      await detailQuery.refetch();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Panggilan gagal diambil."
      );
    }
  };

  const handleReconnect = async (): Promise<void> => {
    if (!selectedCallId) {
      return;
    }
    try {
      const connection = await operatorConnection.mutateAsync({
        callId: selectedCallId,
      });
      await connectAudio(selectedCallId, connection);
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Audio gagal tersambung."
      );
    }
  };

  const handleEnd = async (): Promise<void> => {
    if (!selectedCallId) {
      return;
    }
    try {
      await endCall.mutateAsync({ callId: selectedCallId });
      disconnectAudio();
      await finalizeSelectedCall(selectedCallId);
      await callsQuery.refetch();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Panggilan gagal diakhiri."
      );
    }
  };

  const handleMute = async (): Promise<void> => {
    const currentRoom = roomRef.current;
    if (!currentRoom) {
      return;
    }
    const nextMuted = !isMuted;
    const microphoneTrack = currentRoom.localParticipant.getTrackPublication(
      Track.Source.Microphone
    )?.track;
    if (!microphoneTrack) {
      toast.error("Track mikrofon operator tidak tersedia.");
      return;
    }
    if (nextMuted) {
      await microphoneTrack.mute();
    } else {
      await microphoneTrack.unmute();
    }
    setIsMuted(nextMuted);
  };

  const handleFinalize = (): void => {
    if (selectedCallId) {
      finalizeSelectedCall(selectedCallId).catch(() => undefined);
    }
  };

  const handleSpeaker = (): void => {
    const nextEnabled = !isSpeakerEnabled;
    if (audioRef.current) {
      audioRef.current.muted = !nextEnabled;
    }
    setIsSpeakerEnabled(nextEnabled);
  };

  const handleChecklistChange = (item: string, checked: boolean): void => {
    setCheckedItems((current) => {
      const next = new Set(current);
      if (checked) {
        next.add(item);
      } else {
        next.delete(item);
      }
      return next;
    });
  };

  const transcriptionMessage = getTranscriptionMessage({
    operatorError: operatorTranscription.error,
    operatorStatus: operatorTranscription.status,
    reporterError: reporterTranscription.error,
    reporterStatus: reporterTranscription.status,
  });

  return (
    <main className="mx-auto flex w-full max-w-7xl flex-col gap-6">
      <audio autoPlay ref={audioRef}>
        <track kind="captions" />
      </audio>
      <header className="flex flex-col gap-1">
        <div className="flex items-center gap-2">
          <h1 className="text-h3">Panggilan Tanpa Akun</h1>
          <Badge variant="secondary">Demo online</Badge>
        </div>
        <p className="text-muted-foreground text-sm">
          Operator berbicara langsung. AI membuat transkrip sementara dan hanya
          menyimpan ringkasan.
        </p>
      </header>

      <div className="grid gap-6 xl:grid-cols-[20rem_minmax(0,1fr)]">
        <CallQueue
          calls={callsQuery.data ?? []}
          onSelect={handleSelectCall}
          selectedCallId={selectedCallId}
        />

        {selectedCall ? (
          <div className="grid gap-6 lg:grid-cols-2">
            <CallDetailCard
              call={selectedCall}
              interimOperatorText={operatorTranscription.interimText}
              interimReporterText={reporterTranscription.interimText}
              isAcceptPending={acceptCall.isPending}
              isEndPending={endCall.isPending}
              isFinalizing={finalizeCall.isPending}
              isMuted={isMuted}
              isSpeakerEnabled={isSpeakerEnabled}
              onAccept={handleAccept}
              onEnd={handleEnd}
              onFinalize={handleFinalize}
              onMute={handleMute}
              onReconnect={handleReconnect}
              onSpeaker={handleSpeaker}
              room={room}
              transcript={transcript}
              transcriptionMessage={transcriptionMessage}
            />
            <ChecklistCard
              checkedItems={checkedItems}
              onChange={handleChecklistChange}
            />
          </div>
        ) : null}
      </div>
    </main>
  );
};
