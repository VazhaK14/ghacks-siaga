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

import {
  useAcceptOfflineCallMutation,
  useAppendOperatorTranscriptMutation,
  useEndOperatorCallMutation,
  useOfflineCallDetailQuery,
  useOfflineCallLiveUpdates,
  useOfflineCallsQuery,
  useOperatorConnectionMutation,
} from "./api";
import { useVoiceTranscription } from "./use-voice-transcription";

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

const formatCallTime = (date: Date | string): string =>
  new Intl.DateTimeFormat("id-ID", {
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(date));

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
            {call.status === "ACTIVE" ? "Aktif" : "Menunggu"}
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
            Tidak ada panggilan aktif.
          </CardContent>
        </Card>
      )}
    </section>
  );
};

interface CallDetailCardProps {
  call: OfflineCall;
  interimText: string;
  isAcceptPending: boolean;
  isEndPending: boolean;
  isMuted: boolean;
  isSpeakerEnabled: boolean;
  isTranscriptionUnavailable: boolean;
  onAccept: () => void;
  onEnd: () => void;
  onMute: () => void;
  onReconnect: () => void;
  onSpeaker: () => void;
  room: Room | null;
}

const CallDetailCard = ({
  call,
  interimText,
  isAcceptPending,
  isEndPending,
  isMuted,
  isSpeakerEnabled,
  isTranscriptionUnavailable,
  onAccept,
  onEnd,
  onMute,
  onReconnect,
  onSpeaker,
  room,
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
      {isTranscriptionUnavailable && room ? (
        <Alert>
          <AlertDescription>
            Transkripsi browser tidak tersedia. Audio tetap aktif.
          </AlertDescription>
        </Alert>
      ) : null}
      {interimText.length > 0 ? (
        <p className="rounded-md bg-muted p-3 text-sm">{interimText}</p>
      ) : null}
      <div className="max-h-72 overflow-y-auto rounded-md bg-muted/50 p-3">
        {call.transcripts.length > 0 ? (
          <div className="flex flex-col gap-3">
            {call.transcripts.map((segment) => (
              <div className="flex flex-col gap-1" key={segment.id}>
                <span className="font-semibold text-xs">
                  {segment.speaker === "CALLER" ? "Penelepon" : "Operator"}
                </span>
                <p className="text-sm">{segment.content}</p>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-muted-foreground text-sm">
            Transkrip akan muncul di sini.
          </p>
        )}
      </div>
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
        Konfirmasi lisan; data ini tidak mengubah panggilan menjadi laporan.
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
  const appendTranscript = useAppendOperatorTranscriptMutation();
  const endCall = useEndOperatorCallMutation();
  const [room, setRoom] = useState<Room | null>(null);
  const [isMuted, setIsMuted] = useState(false);
  const [isSpeakerEnabled, setIsSpeakerEnabled] = useState(true);
  const [checkedItems, setCheckedItems] = useState<Set<string>>(new Set());
  const audioRef = useRef<HTMLAudioElement>(null);
  const selectedCall = detailQuery.data;

  useEffect(() => {
    if (!selectedCallId && callsQuery.data?.[0]) {
      setSelectedCallId(callsQuery.data[0].id);
    }
  }, [callsQuery.data, selectedCallId]);

  const connectAudio = useCallback(
    async (connection: { token: string | null; url: string | null }) => {
      if (!(connection.token && connection.url)) {
        toast.error("Koneksi audio LiveKit belum tersedia.");
        return;
      }
      room?.disconnect();
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
          }
        }
      );
      await nextRoom.connect(connection.url, connection.token);
      await nextRoom.startAudio();
      await nextRoom.localParticipant.setMicrophoneEnabled(true);
      setRoom(nextRoom);
    },
    [room]
  );

  useEffect(
    () => () => {
      room?.disconnect();
    },
    [room]
  );

  const handleTranscript = useCallback(
    ({ confidence, text }: { confidence?: number; text: string }) => {
      if (!selectedCallId) {
        return;
      }
      appendTranscript.mutate({
        callId: selectedCallId,
        confidence,
        content: text,
        idempotencyKey: crypto.randomUUID(),
      });
    },
    [appendTranscript, selectedCallId]
  );
  const transcription = useVoiceTranscription({
    enabled: Boolean(room && selectedCall?.status === "ACTIVE" && !isMuted),
    onFinalResult: handleTranscript,
  });

  const handleAccept = async () => {
    if (!selectedCallId) {
      return;
    }
    try {
      const result = await acceptCall.mutateAsync({ callId: selectedCallId });
      await connectAudio(result.connection);
      await detailQuery.refetch();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Panggilan gagal diambil."
      );
    }
  };

  const handleReconnect = async () => {
    if (!selectedCallId) {
      return;
    }
    try {
      const connection = await operatorConnection.mutateAsync({
        callId: selectedCallId,
      });
      await connectAudio(connection);
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Audio gagal tersambung."
      );
    }
  };

  const handleEnd = async () => {
    if (!selectedCallId) {
      return;
    }
    await endCall.mutateAsync({ callId: selectedCallId });
    room?.disconnect();
    setRoom(null);
    setSelectedCallId(null);
    await callsQuery.refetch();
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

  const handleChecklistChange = (item: string, checked: boolean) => {
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

  return (
    <main className="mx-auto flex w-full max-w-7xl flex-col gap-6">
      <audio autoPlay ref={audioRef}>
        <track kind="captions" />
      </audio>
      <header className="flex flex-col gap-1">
        <div className="flex items-center gap-2">
          <h1 className="text-h3">Panggilan Offline</h1>
          <Badge variant="secondary">Demo</Badge>
        </div>
        <p className="text-muted-foreground text-sm">
          Antrean audio tamu terpisah dari laporan dan tidak membuat dispatch
          otomatis.
        </p>
      </header>

      <div className="grid gap-6 xl:grid-cols-[20rem_minmax(0,1fr)]">
        <CallQueue
          calls={callsQuery.data ?? []}
          onSelect={setSelectedCallId}
          selectedCallId={selectedCallId}
        />

        {selectedCall ? (
          <div className="grid gap-6 lg:grid-cols-2">
            <CallDetailCard
              call={selectedCall}
              interimText={transcription.interimText}
              isAcceptPending={acceptCall.isPending}
              isEndPending={endCall.isPending}
              isMuted={isMuted}
              isSpeakerEnabled={isSpeakerEnabled}
              isTranscriptionUnavailable={transcription.isUnavailable}
              onAccept={handleAccept}
              onEnd={handleEnd}
              onMute={handleMute}
              onReconnect={handleReconnect}
              onSpeaker={handleSpeaker}
              room={room}
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
