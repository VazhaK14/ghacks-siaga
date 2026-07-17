import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@siaga-app/ui/components/dialog";
import { ImageIcon } from "lucide-react";
import type { MouseEvent } from "react";
import { useCallback, useMemo, useState } from "react";

import { useOperatorReportImageAccessQuery } from "../api";

interface ReportImageGalleryAttachment {
  height: number | null;
  id: string;
  originalFilename: string;
  width: number | null;
}

interface ReportImageGalleryProps {
  attachments: ReportImageGalleryAttachment[];
  reportId: string;
}

export function ReportImageGallery({
  attachments,
  reportId,
}: ReportImageGalleryProps) {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const attachmentIds = useMemo(
    () => attachments.map(({ id }) => id),
    [attachments]
  );
  const accessQuery = useOperatorReportImageAccessQuery(
    reportId,
    attachmentIds
  );
  const accessUrls = useMemo(
    () =>
      new Map(
        accessQuery.data?.map(({ attachmentId, url }) => [attachmentId, url])
      ),
    [accessQuery.data]
  );
  const selectedAttachment = attachments.find(({ id }) => id === selectedId);
  const selectedUrl = selectedId ? accessUrls.get(selectedId) : undefined;
  const handleSelect = useCallback(
    (event: MouseEvent<HTMLButtonElement>): void => {
      setSelectedId(event.currentTarget.dataset.attachmentId ?? null);
    },
    []
  );
  const handleOpenChange = useCallback((open: boolean): void => {
    if (!open) {
      setSelectedId(null);
    }
  }, []);

  if (attachments.length === 0) {
    return null;
  }

  return (
    <section>
      <h2 className="flex items-center gap-2 font-semibold text-foreground text-sm">
        <ImageIcon aria-hidden className="size-4" />
        Galeri bukti laporan
      </h2>
      <p className="mt-1 text-[10px] text-muted-foreground">
        {attachments.length} gambar dikirim oleh pelapor.
      </p>
      <div className="mt-3 grid grid-cols-3 gap-2">
        {attachments.map((attachment) => {
          const url = accessUrls.get(attachment.id);
          return (
            <button
              className="group relative aspect-square overflow-hidden rounded-md border bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              data-attachment-id={attachment.id}
              disabled={!url}
              key={attachment.id}
              onClick={handleSelect}
              type="button"
            >
              {url ? (
                <img
                  alt={`Bukti ${attachment.originalFilename}`}
                  className="size-full object-cover transition-transform group-hover:scale-105"
                  height={attachment.height ?? 320}
                  src={url}
                  width={attachment.width ?? 320}
                />
              ) : (
                <ImageIcon className="m-auto size-5 text-muted-foreground" />
              )}
            </button>
          );
        })}
      </div>

      <Dialog onOpenChange={handleOpenChange} open={selectedId !== null}>
        <DialogContent className="max-w-3xl p-4">
          <DialogHeader>
            <DialogTitle>{selectedAttachment?.originalFilename}</DialogTitle>
            <DialogDescription className="sr-only">
              Pratinjau bukti laporan
            </DialogDescription>
          </DialogHeader>
          {selectedUrl && selectedAttachment ? (
            <img
              alt={`Bukti ${selectedAttachment.originalFilename}`}
              className="max-h-[75vh] w-full rounded-lg object-contain"
              height={selectedAttachment.height ?? 720}
              src={selectedUrl}
              width={selectedAttachment.width ?? 1280}
            />
          ) : null}
        </DialogContent>
      </Dialog>
    </section>
  );
}
