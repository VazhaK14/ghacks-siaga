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
import {
  Field,
  FieldDescription,
  FieldLabel,
} from "@siaga-app/ui/components/field";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@siaga-app/ui/components/select";
import { Textarea } from "@siaga-app/ui/components/textarea";
import { BanIcon } from "lucide-react";
import { type ChangeEvent, type FormEvent, useCallback, useState } from "react";
import { toast } from "sonner";

import { useCloseReportMutation } from "@/features/dispatch/api";
import type { ReportDetail } from "@/features/map/types";

const CLOSURE_REASON_OPTIONS = [
  { label: "Prank call", value: "PRANK_CALL" },
  { label: "Laporan tidak lengkap", value: "INCOMPLETE_REPORT" },
  { label: "Lainnya", value: "OTHER" },
] as const;

type ClosureReason = (typeof CLOSURE_REASON_OPTIONS)[number]["value"];

export function CloseReportDialog({
  onReportClosed,
  report,
}: {
  onReportClosed: (reportId: string) => void;
  report: ReportDetail;
}) {
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState<ClosureReason>("PRANK_CALL");
  const [note, setNote] = useState("");
  const closeMutation = useCloseReportMutation(onReportClosed);

  const handleSubmit = useCallback(
    async (event: FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      try {
        await closeMutation.mutateAsync({
          note: note.trim() || undefined,
          reason,
          reportId: report.id,
        });
        toast.success("Laporan ditutup dan dipindahkan ke arsip");
        setOpen(false);
      } catch (error) {
        toast.error(
          error instanceof Error ? error.message : "Laporan gagal ditutup"
        );
      }
    },
    [closeMutation, note, reason, report.id]
  );
  const handleReasonChange = useCallback((nextReason: string | null) => {
    const matchingReason = CLOSURE_REASON_OPTIONS.find(
      (option) => option.value === nextReason
    )?.value;
    if (matchingReason) {
      setReason(matchingReason);
    }
  }, []);
  const handleNoteChange = useCallback(
    (event: ChangeEvent<HTMLTextAreaElement>) => {
      setNote(event.target.value);
    },
    []
  );
  const handleCancel = useCallback(() => {
    setOpen(false);
  }, []);

  return (
    <Dialog onOpenChange={setOpen} open={open}>
      <DialogTrigger
        render={
          <Button
            className="w-full"
            disabled={!report.canClose}
            size="sm"
            title={report.closeBlockReason ?? "Tutup laporan"}
            variant="destructive"
          />
        }
      >
        <BanIcon aria-hidden data-icon="inline-start" />
        Tutup laporan
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Tutup laporan ini?</DialogTitle>
          <DialogDescription>
            Laporan akan langsung hilang dari peta dan masuk ke arsip. Dispatch
            yang masih menunggu atau baru diterima akan dibatalkan.
          </DialogDescription>
        </DialogHeader>

        <form className="flex flex-col gap-5" onSubmit={handleSubmit}>
          <Field>
            <FieldLabel htmlFor="closure-reason">Alasan penutupan</FieldLabel>
            <Select onValueChange={handleReasonChange} value={reason}>
              <SelectTrigger className="w-full" id="closure-reason">
                <SelectValue>
                  {
                    CLOSURE_REASON_OPTIONS.find(
                      (option) => option.value === reason
                    )?.label
                  }
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  {CLOSURE_REASON_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectGroup>
              </SelectContent>
            </Select>
          </Field>

          <Field>
            <FieldLabel htmlFor="closure-note">Catatan (opsional)</FieldLabel>
            <Textarea
              id="closure-note"
              maxLength={1000}
              onChange={handleNoteChange}
              placeholder="Tambahkan konteks hasil verifikasi operator"
              value={note}
            />
            <FieldDescription>
              Keputusan penutupan sepenuhnya dibuat oleh operator.
            </FieldDescription>
          </Field>

          <DialogFooter>
            <Button onClick={handleCancel} type="button" variant="ghost">
              Kembali
            </Button>
            <Button
              disabled={closeMutation.isPending}
              type="submit"
              variant="destructive"
            >
              {closeMutation.isPending ? "Menutup..." : "Tutup laporan"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
