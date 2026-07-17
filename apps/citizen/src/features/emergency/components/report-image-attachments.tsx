import { Button } from "@siaga-app/ui/components/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@siaga-app/ui/components/dialog";
import { CameraIcon, ImageIcon, LoaderCircleIcon, XIcon } from "lucide-react";
import type { ChangeEvent, MouseEvent } from "react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";

import {
  useCompleteReportImageUploadsMutation,
  usePrepareReportImageUploadsMutation,
  useReporterImageAccessQuery,
} from "../api";
import type { ReporterReport } from "../types";

const MAX_FILE_BYTES = 5 * 1024 * 1024;
const MAX_BATCH_FILES = 3;
const MAX_REPORT_FILES = 20;
const ACCEPTED_MIME_TYPES = new Set([
  "image/heic",
  "image/heif",
  "image/jpeg",
  "image/png",
  "image/webp",
]);

type ImageAttachment = ReporterReport["imageAttachments"][number];

interface PendingImage {
  error: string | null;
  file: File;
  id: string;
  previewUrl: string;
  progress: number;
  status: "queued" | "uploading" | "failed";
}

interface CloudinaryUploadResponse {
  asset_id: string;
  bytes: number;
  format: string;
  height: number;
  public_id: string;
  resource_type: string;
  signature: string;
  type: string;
  version: number;
  width: number;
}

interface PreparedUpload {
  apiKey: string;
  attachmentId: string;
  cloudName: string;
  deliveryType: "authenticated";
  overwrite: false;
  publicId: string;
  signature: string;
  timestamp: number;
  uploadPreset: string;
}

const normalizeMimeType = (file: File): string => {
  if (ACCEPTED_MIME_TYPES.has(file.type)) {
    return file.type;
  }
  const extension = file.name.split(".").at(-1)?.toLowerCase();
  if (extension === "heic" || extension === "heif") {
    return `image/${extension}`;
  }
  return file.type;
};

const isCloudinaryUploadResponse = (
  value: unknown
): value is CloudinaryUploadResponse => {
  if (typeof value !== "object" || value === null) {
    return false;
  }
  const response = value as Record<string, unknown>;
  return (
    typeof response.asset_id === "string" &&
    typeof response.bytes === "number" &&
    typeof response.format === "string" &&
    typeof response.height === "number" &&
    typeof response.public_id === "string" &&
    typeof response.resource_type === "string" &&
    typeof response.signature === "string" &&
    typeof response.type === "string" &&
    typeof response.version === "number" &&
    typeof response.width === "number"
  );
};

const uploadToCloudinary = (
  image: PendingImage,
  intent: PreparedUpload,
  onProgress: (progress: number) => void
): Promise<CloudinaryUploadResponse> =>
  new Promise((resolve, reject) => {
    const request = new XMLHttpRequest();
    request.open(
      "POST",
      `https://api.cloudinary.com/v1_1/${intent.cloudName}/image/upload`
    );
    request.upload.addEventListener("progress", (event) => {
      if (event.lengthComputable) {
        onProgress(Math.round((event.loaded / event.total) * 100));
      }
    });
    request.addEventListener("load", () => {
      try {
        const response: unknown = JSON.parse(request.responseText);
        if (request.status >= 200 && request.status < 300) {
          if (isCloudinaryUploadResponse(response)) {
            resolve(response);
            return;
          }
          reject(new Error("Respons penyimpanan gambar tidak valid"));
          return;
        }
        reject(new Error("Penyimpanan gambar menolak unggahan"));
      } catch {
        reject(new Error("Respons penyimpanan gambar tidak dapat dibaca"));
      }
    });
    request.addEventListener("error", () => {
      reject(new Error("Koneksi unggah gambar terputus"));
    });

    const form = new FormData();
    form.append("file", image.file);
    form.append("api_key", intent.apiKey);
    form.append("timestamp", String(intent.timestamp));
    form.append("signature", intent.signature);
    form.append("upload_preset", intent.uploadPreset);
    form.append("public_id", intent.publicId);
    form.append("overwrite", String(intent.overwrite));
    form.append("type", intent.deliveryType);
    request.send(form);
  });

interface ReportImageAttachmentsProps {
  attachments: ImageAttachment[];
  reportId: string;
}

export function ReportImageAttachments({
  attachments,
  reportId,
}: ReportImageAttachmentsProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const previewUrlsRef = useRef(new Set<string>());
  const prepareUploads = usePrepareReportImageUploadsMutation();
  const completeUploads = useCompleteReportImageUploadsMutation();
  const [pendingImages, setPendingImages] = useState<PendingImage[]>([]);
  const [selectedAttachmentId, setSelectedAttachmentId] = useState<
    string | null
  >(null);
  const attachmentIds = useMemo(
    () => attachments.map(({ id }) => id),
    [attachments]
  );
  const accessQuery = useReporterImageAccessQuery(reportId, attachmentIds);
  const accessUrls = useMemo(
    () =>
      new Map(
        accessQuery.data?.map(({ attachmentId, url }) => [attachmentId, url])
      ),
    [accessQuery.data]
  );
  const selectedAttachment = attachments.find(
    ({ id }) => id === selectedAttachmentId
  );
  const isUploading = pendingImages.some(
    ({ status }) => status === "uploading"
  );

  useEffect(
    () => () => {
      for (const previewUrl of previewUrlsRef.current) {
        URL.revokeObjectURL(previewUrl);
      }
      previewUrlsRef.current.clear();
    },
    []
  );

  const updatePendingImage = useCallback(
    (imageId: string, update: Partial<PendingImage>): void => {
      setPendingImages((current) =>
        current.map((image) =>
          image.id === imageId ? { ...image, ...update } : image
        )
      );
    },
    []
  );

  const handleFilesSelected = useCallback(
    (event: ChangeEvent<HTMLInputElement>): void => {
      const selectedFiles = Array.from(event.target.files ?? []);
      event.target.value = "";
      const remainingBatchSlots = MAX_BATCH_FILES - pendingImages.length;
      const remainingReportSlots = MAX_REPORT_FILES - attachments.length;
      const availableSlots = Math.min(
        remainingBatchSlots,
        remainingReportSlots
      );
      if (availableSlots <= 0) {
        toast.error("Batas gambar untuk laporan ini sudah tercapai.");
        return;
      }
      const acceptedFiles = selectedFiles
        .slice(0, availableSlots)
        .filter((file) => {
          const isAcceptedType = ACCEPTED_MIME_TYPES.has(
            normalizeMimeType(file)
          );
          const isAcceptedSize = file.size > 0 && file.size <= MAX_FILE_BYTES;
          if (!(isAcceptedType && isAcceptedSize)) {
            toast.error(
              `${file.name} bukan gambar yang didukung atau melebihi 5 MB.`
            );
          }
          return isAcceptedType && isAcceptedSize;
        });
      if (selectedFiles.length > availableSlots) {
        toast.info(`Maksimal ${MAX_BATCH_FILES} gambar per kiriman.`);
      }
      const selectedImages = acceptedFiles.map((file) => {
        const previewUrl = URL.createObjectURL(file);
        previewUrlsRef.current.add(previewUrl);
        return {
          error: null,
          file,
          id: crypto.randomUUID(),
          previewUrl,
          progress: 0,
          status: "queued" as const,
        };
      });
      setPendingImages((current) => [...current, ...selectedImages]);
    },
    [attachments.length, pendingImages.length]
  );

  const handleRemovePending = useCallback(
    (event: MouseEvent<HTMLButtonElement>): void => {
      const { imageId } = event.currentTarget.dataset;
      if (!imageId) {
        return;
      }
      setPendingImages((current) => {
        const removed = current.find(({ id }) => id === imageId);
        if (removed) {
          URL.revokeObjectURL(removed.previewUrl);
          previewUrlsRef.current.delete(removed.previewUrl);
        }
        return current.filter(({ id }) => id !== imageId);
      });
    },
    []
  );

  const handleUpload = useCallback(async (): Promise<void> => {
    const targets = pendingImages.filter(
      ({ status }) => status === "queued" || status === "failed"
    );
    if (targets.length === 0) {
      return;
    }
    try {
      for (const target of targets) {
        updatePendingImage(target.id, {
          error: null,
          progress: 0,
          status: "uploading",
        });
      }
      const intents = await prepareUploads.mutateAsync({
        files: targets.map(({ file }) => ({
          bytes: file.size,
          mimeType: normalizeMimeType(file) as
            | "image/heic"
            | "image/heif"
            | "image/jpeg"
            | "image/png"
            | "image/webp",
          originalFilename: file.name,
        })),
        reportId,
      });
      const uploadTarget = async (target: PendingImage, index: number) => {
        const intent = intents[index];
        if (!intent) {
          throw new Error("Sesi unggah tidak tersedia");
        }
        try {
          const response = await uploadToCloudinary(
            target,
            intent,
            (progress) => updatePendingImage(target.id, { progress })
          );
          return { intent, response, target };
        } catch (error) {
          updatePendingImage(target.id, {
            error: error instanceof Error ? error.message : "Unggah gagal",
            status: "failed",
          });
          return null;
        }
      };
      const firstBatch = await Promise.all(
        targets.slice(0, 2).map((target, index) => uploadTarget(target, index))
      );
      const thirdResult = targets[2] ? await uploadTarget(targets[2], 2) : null;
      const successes = [...firstBatch, thirdResult].filter(
        (result): result is NonNullable<typeof result> => result !== null
      );
      if (successes.length > 0) {
        await completeUploads.mutateAsync({
          reportId,
          uploads: successes.map(({ intent, response }) => ({
            assetId: response.asset_id,
            attachmentId: intent.attachmentId,
            bytes: response.bytes,
            deliveryType: response.type,
            format: response.format,
            height: response.height,
            publicId: response.public_id,
            resourceType: response.resource_type,
            signature: response.signature,
            version: response.version,
            width: response.width,
          })),
        });
        const successfulIds = new Set(successes.map(({ target }) => target.id));
        for (const { target } of successes) {
          URL.revokeObjectURL(target.previewUrl);
          previewUrlsRef.current.delete(target.previewUrl);
        }
        setPendingImages((current) =>
          current.filter(({ id }) => !successfulIds.has(id))
        );
        toast.success(
          `${successes.length} gambar berhasil dikirim ke operator.`
        );
      }
    } catch (error) {
      setPendingImages((current) =>
        current.map((image) =>
          image.status === "uploading"
            ? {
                ...image,
                error: error instanceof Error ? error.message : "Unggah gagal",
                status: "failed",
              }
            : image
        )
      );
      toast.error(
        error instanceof Error ? error.message : "Gambar belum dapat dikirim."
      );
    }
  }, [
    completeUploads,
    pendingImages,
    prepareUploads,
    reportId,
    updatePendingImage,
  ]);

  const handleChooseFiles = useCallback((): void => {
    fileInputRef.current?.click();
  }, []);

  const handleSelectAttachment = useCallback(
    (event: MouseEvent<HTMLButtonElement>): void => {
      setSelectedAttachmentId(event.currentTarget.dataset.attachmentId ?? null);
    },
    []
  );

  const handleDialogOpenChange = useCallback((open: boolean): void => {
    if (!open) {
      setSelectedAttachmentId(null);
    }
  }, []);

  return (
    <section className="citizen-glass-surface space-y-3 p-3">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 className="font-semibold text-sm">Galeri bukti laporan</h2>
          <p className="text-muted-foreground text-xs">
            Maksimal 3 gambar sekali kirim, masing-masing 5 MB.
          </p>
        </div>
        <Button
          disabled={
            isUploading ||
            pendingImages.length >= MAX_BATCH_FILES ||
            attachments.length >= MAX_REPORT_FILES
          }
          onClick={handleChooseFiles}
          size="sm"
          type="button"
          variant="stroke"
        >
          <CameraIcon data-icon="inline-start" />
          Tambah
        </Button>
        <input
          accept="image/jpeg,image/png,image/webp,image/heic,image/heif,.heic,.heif"
          className="sr-only"
          multiple
          onChange={handleFilesSelected}
          ref={fileInputRef}
          type="file"
        />
      </div>

      {attachments.length > 0 ? (
        <div className="grid grid-cols-3 gap-2">
          {attachments.map((attachment) => {
            const url = accessUrls.get(attachment.id);
            return (
              <button
                className="aspect-square overflow-hidden rounded-xl border bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                data-attachment-id={attachment.id}
                disabled={!url}
                key={attachment.id}
                onClick={handleSelectAttachment}
                type="button"
              >
                {url ? (
                  <img
                    alt={`Bukti laporan ${attachment.originalFilename}`}
                    className="size-full object-cover"
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
      ) : null}

      {pendingImages.length > 0 ? (
        <div className="space-y-2">
          {pendingImages.map((image) => (
            <div className="flex items-center gap-3" key={image.id}>
              <img
                alt={`Pratinjau ${image.file.name}`}
                className="size-12 rounded-lg object-cover"
                height={48}
                src={image.previewUrl}
                width={48}
              />
              <div className="min-w-0 flex-1">
                <p className="truncate text-xs">{image.file.name}</p>
                {image.status === "uploading" ? (
                  <div
                    aria-label={`Progres unggah ${image.progress}%`}
                    aria-valuemax={100}
                    aria-valuemin={0}
                    aria-valuenow={image.progress}
                    className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-muted"
                    role="progressbar"
                  >
                    <div
                      className="h-full rounded-full bg-primary transition-[width]"
                      style={{ width: `${image.progress}%` }}
                    />
                  </div>
                ) : null}
                {image.error ? (
                  <p className="mt-1 text-[10px] text-destructive">
                    {image.error}
                  </p>
                ) : null}
              </div>
              <Button
                aria-label={`Hapus ${image.file.name}`}
                data-image-id={image.id}
                disabled={image.status === "uploading"}
                onClick={handleRemovePending}
                size="icon-xs"
                type="button"
                variant="ghost"
              >
                <XIcon />
              </Button>
            </div>
          ))}
          <Button
            className="w-full"
            disabled={isUploading}
            onClick={handleUpload}
            size="sm"
            type="button"
          >
            {isUploading ? (
              <LoaderCircleIcon
                className="animate-spin"
                data-icon="inline-start"
              />
            ) : (
              <CameraIcon data-icon="inline-start" />
            )}
            {isUploading
              ? "Mengunggah..."
              : `Kirim ${pendingImages.length} gambar`}
          </Button>
        </div>
      ) : null}

      <Dialog
        onOpenChange={handleDialogOpenChange}
        open={selectedAttachmentId !== null}
      >
        <DialogContent className="max-w-[calc(100%-2rem)] p-3">
          <DialogHeader className="sr-only">
            <DialogTitle>Bukti laporan</DialogTitle>
            <DialogDescription>
              Gambar yang dikirim kepada operator.
            </DialogDescription>
          </DialogHeader>
          {selectedAttachment && accessUrls.get(selectedAttachment.id) ? (
            <img
              alt={`Bukti laporan ${selectedAttachment.originalFilename}`}
              className="max-h-[75vh] w-full rounded-lg object-contain"
              height={selectedAttachment.height ?? 720}
              src={accessUrls.get(selectedAttachment.id) ?? ""}
              width={selectedAttachment.width ?? 1280}
            />
          ) : null}
        </DialogContent>
      </Dialog>
    </section>
  );
}
