import { Alert, AlertDescription } from "@siaga-app/ui/components/alert";
import { Button } from "@siaga-app/ui/components/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@siaga-app/ui/components/dialog";
import { Field, FieldGroup, FieldLabel } from "@siaga-app/ui/components/field";
import { Input } from "@siaga-app/ui/components/input";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@siaga-app/ui/components/select";
import { Textarea } from "@siaga-app/ui/components/textarea";
import { FilePlus2Icon } from "lucide-react";
import { type ChangeEvent, type FormEvent, useCallback, useState } from "react";
import { useNavigate } from "react-router";
import { toast } from "sonner";

import { INCIDENT_TYPE_LABELS } from "@/features/map/content";

import { useConvertOfflineCallMutation } from "./api";

const INCIDENT_TYPES = [
  "CRIME",
  "FIRE",
  "MEDICAL",
  "TRAFFIC_ACCIDENT",
  "NATURAL_DISASTER",
  "DOMESTIC_VIOLENCE",
  "MISSING_PERSON",
  "OTHER",
] as const;

type IncidentType = (typeof INCIDENT_TYPES)[number];

interface ConvertCallDialogProps {
  callId: string;
  convertedReportId: string | null;
  defaultSummary: string;
}

export const ConvertCallDialog = ({
  callId,
  convertedReportId,
  defaultSummary,
}: ConvertCallDialogProps) => {
  const navigate = useNavigate();
  const mutation = useConvertOfflineCallMutation();
  const [open, setOpen] = useState(false);
  const [incidentType, setIncidentType] = useState<IncidentType>("OTHER");
  const [title, setTitle] = useState("Panggilan darurat tanpa akun");
  const [summary, setSummary] = useState(defaultSummary);
  const [address, setAddress] = useState("");
  const [error, setError] = useState<string | null>(null);

  const handleOpenChange = useCallback(
    (nextOpen: boolean) => {
      if (convertedReportId && nextOpen) {
        navigate(`/map-monitor?reportId=${convertedReportId}`);
        return;
      }
      setOpen(nextOpen);
      if (nextOpen) {
        setSummary(defaultSummary);
        setError(null);
      }
    },
    [convertedReportId, defaultSummary, navigate]
  );
  const handleIncidentTypeChange = useCallback((value: string | null) => {
    const nextType = INCIDENT_TYPES.find((type) => type === value);
    if (nextType) {
      setIncidentType(nextType);
    }
  }, []);
  const handleTextChange = useCallback(
    (event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      const { name, value } = event.currentTarget;
      if (name === "title") {
        setTitle(value);
      } else if (name === "summary") {
        setSummary(value);
      } else if (name === "address") {
        setAddress(value);
      }
    },
    []
  );
  const handleSubmit = useCallback(
    async (event: FormEvent<HTMLFormElement>): Promise<void> => {
      event.preventDefault();
      const normalizedTitle = title.trim();
      const normalizedSummary = summary.trim();
      if (normalizedTitle.length < 3 || normalizedSummary.length < 3) {
        setError("Judul dan ringkasan minimal tiga karakter.");
        return;
      }
      try {
        const result = await mutation.mutateAsync({
          address: address.trim() || undefined,
          callId,
          incidentType,
          summary: normalizedSummary,
          title: normalizedTitle,
        });
        toast.success("Panggilan berhasil dijadikan laporan.");
        setOpen(false);
        navigate(`/map-monitor?reportId=${result.reportId}`);
      } catch (caughtError) {
        setError(
          caughtError instanceof Error
            ? caughtError.message
            : "Laporan belum dapat dibuat."
        );
      }
    },
    [address, callId, incidentType, mutation, navigate, summary, title]
  );

  return (
    <Dialog onOpenChange={handleOpenChange} open={open}>
      <DialogTrigger
        render={<Button className="w-full" type="button" variant="stroke" />}
      >
        <FilePlus2Icon data-icon="inline-start" />
        {convertedReportId ? "Buka laporan" : "Jadikan laporan"}
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Jadikan panggilan sebagai laporan</DialogTitle>
          <DialogDescription>
            Tinjau hasil AI. Keputusan dan isi laporan tetap menjadi tanggung
            jawab operator.
          </DialogDescription>
        </DialogHeader>
        <form className="flex flex-col gap-4" onSubmit={handleSubmit}>
          <FieldGroup>
            {error ? (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            ) : null}
            <Field>
              <FieldLabel htmlFor="guest-call-incident-type">
                Jenis kejadian
              </FieldLabel>
              <Select
                onValueChange={handleIncidentTypeChange}
                value={incidentType}
              >
                <SelectTrigger className="w-full" id="guest-call-incident-type">
                  <SelectValue>
                    {INCIDENT_TYPE_LABELS[incidentType]}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    {INCIDENT_TYPES.map((type) => (
                      <SelectItem key={type} value={type}>
                        {INCIDENT_TYPE_LABELS[type]}
                      </SelectItem>
                    ))}
                  </SelectGroup>
                </SelectContent>
              </Select>
            </Field>
            <Field>
              <FieldLabel htmlFor="guest-call-title">Judul</FieldLabel>
              <Input
                id="guest-call-title"
                maxLength={250}
                name="title"
                onChange={handleTextChange}
                required
                value={title}
              />
            </Field>
            <Field>
              <FieldLabel htmlFor="guest-call-summary">Ringkasan</FieldLabel>
              <Textarea
                id="guest-call-summary"
                maxLength={5000}
                name="summary"
                onChange={handleTextChange}
                required
                value={summary}
              />
            </Field>
            <Field>
              <FieldLabel htmlFor="guest-call-address">
                Alamat atau patokan
              </FieldLabel>
              <Input
                id="guest-call-address"
                maxLength={500}
                name="address"
                onChange={handleTextChange}
                value={address}
              />
            </Field>
          </FieldGroup>
          <DialogFooter>
            <Button disabled={mutation.isPending} type="submit">
              Simpan sebagai laporan
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
