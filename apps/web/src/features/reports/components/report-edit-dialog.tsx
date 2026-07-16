import {
  Alert,
  AlertDescription,
  AlertTitle,
} from "@siaga-app/ui/components/alert";
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
  FieldGroup,
  FieldLabel,
} from "@siaga-app/ui/components/field";
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
import {
  AlertTriangleIcon,
  PencilLineIcon,
  PlusIcon,
  Trash2Icon,
} from "lucide-react";
import {
  type ChangeEvent,
  type FormEvent,
  lazy,
  Suspense,
  useCallback,
  useMemo,
  useState,
} from "react";
import { toast } from "sonner";

import { CATEGORY_CONFIG, INCIDENT_TYPE_LABELS } from "@/features/map/content";
import type { ReportDetail } from "@/features/map/types";
import { useUpdateReportDetailMutation } from "../api";
import { type ReportEditFormValues, reportEditFormSchema } from "../types";

const ReportLocationPicker = lazy(async () => {
  const module = await import("./report-location-picker");
  return { default: module.ReportLocationPicker };
});

const CATEGORY_OPTIONS = [
  "UNCATEGORIZED",
  "LOW",
  "MEDIUM",
  "HIGH",
  "CRITICAL",
] as const;

const INCIDENT_TYPE_OPTIONS = [
  "CRIME",
  "FIRE",
  "MEDICAL",
  "TRAFFIC_ACCIDENT",
  "NATURAL_DISASTER",
  "DOMESTIC_VIOLENCE",
  "MISSING_PERSON",
  "OTHER",
] as const;

const UNCLASSIFIED_INCIDENT = "UNCLASSIFIED";

const toAdditionalDataRows = (
  extractedData: unknown
): ReportEditFormValues["additionalData"] => {
  if (
    typeof extractedData !== "object" ||
    extractedData === null ||
    Array.isArray(extractedData)
  ) {
    return [];
  }

  return Object.entries(extractedData).map(([key, value], index) => ({
    id: `existing-${index}-${key}`,
    key,
    value:
      typeof value === "object" && value !== null
        ? JSON.stringify(value)
        : String(value ?? ""),
  }));
};

const toFormValues = (report: ReportDetail): ReportEditFormValues => ({
  additionalData: toAdditionalDataRows(report.extractedData),
  address: report.address ?? "",
  category: report.category,
  incidentType: report.incidentType ?? "",
  latitude: report.latitude?.toString() ?? "",
  longitude: report.longitude?.toString() ?? "",
  recommendation: report.recommendation ?? "",
  summary: report.summary ?? "",
  title: report.title ?? "",
});

const nullableText = (value: string): string | null => {
  const normalizedValue = value.trim();
  return normalizedValue.length > 0 ? normalizedValue : null;
};

const toExtractedData = (
  rows: ReportEditFormValues["additionalData"]
): Record<string, string> =>
  Object.fromEntries(
    rows.flatMap((row) => {
      const normalizedKey = row.key.trim();
      return normalizedKey.length > 0
        ? [[normalizedKey, row.value.trim()]]
        : [];
    })
  );

export function ReportEditDialog({ report }: { report: ReportDetail }) {
  const initialValues = useMemo(() => toFormValues(report), [report]);
  const [open, setOpen] = useState(false);
  const [values, setValues] = useState(initialValues);
  const [validationMessage, setValidationMessage] = useState<string | null>(
    null
  );
  const updateMutation = useUpdateReportDetailMutation();

  const handleOpenChange = useCallback(
    (nextOpen: boolean) => {
      setOpen(nextOpen);
      if (nextOpen) {
        setValues(initialValues);
        setValidationMessage(null);
      }
    },
    [initialValues]
  );

  const handleTextChange = useCallback(
    (event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      const fieldName = event.target.name as keyof ReportEditFormValues;
      setValues((currentValues) => ({
        ...currentValues,
        [fieldName]: event.target.value,
      }));
    },
    []
  );
  const handleAdditionalDataChange = useCallback(
    (event: ChangeEvent<HTMLInputElement>) => {
      const {
        dataset: { field: fieldName, rowId },
        value: nextValue,
      } = event.currentTarget;
      if (!rowId || (fieldName !== "key" && fieldName !== "value")) {
        return;
      }
      setValues((currentValues) => ({
        ...currentValues,
        additionalData: currentValues.additionalData.map((row) =>
          row.id === rowId ? { ...row, [fieldName]: nextValue } : row
        ),
      }));
    },
    []
  );
  const handleAddAdditionalData = useCallback(() => {
    setValues((currentValues) => ({
      ...currentValues,
      additionalData: [
        ...currentValues.additionalData,
        {
          id: crypto.randomUUID(),
          key: "",
          value: "",
        },
      ],
    }));
  }, []);
  const handleRemoveAdditionalData = useCallback(
    (event: React.MouseEvent<HTMLButtonElement>) => {
      const rowId = event.currentTarget.value;
      setValues((currentValues) => ({
        ...currentValues,
        additionalData: currentValues.additionalData.filter(
          (row) => row.id !== rowId
        ),
      }));
    },
    []
  );

  const handleSubmit = useCallback(
    async (event: FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      const parsedValues = reportEditFormSchema.safeParse(values);
      if (!parsedValues.success) {
        setValidationMessage(
          parsedValues.error.issues[0]?.message ??
            "Periksa kembali detail laporan"
        );
        return;
      }

      try {
        await updateMutation.mutateAsync({
          detail: {
            address: nullableText(parsedValues.data.address),
            category: parsedValues.data.category,
            extractedData: toExtractedData(parsedValues.data.additionalData),
            incidentType: parsedValues.data.incidentType || null,
            latitude: parsedValues.data.latitude
              ? Number(parsedValues.data.latitude)
              : null,
            longitude: parsedValues.data.longitude
              ? Number(parsedValues.data.longitude)
              : null,
            recommendation: nullableText(parsedValues.data.recommendation),
            summary: nullableText(parsedValues.data.summary),
            title: nullableText(parsedValues.data.title),
          },
          expectedUpdatedAt: report.updatedAt,
          reportId: report.id,
        });
        toast.success("Detail laporan berhasil diperbarui");
        setOpen(false);
      } catch (error) {
        const message =
          error instanceof Error
            ? error.message
            : "Detail laporan gagal disimpan";
        setValidationMessage(message);
        toast.error(message);
      }
    },
    [report.id, report.updatedAt, updateMutation, values]
  );
  const handleCategoryChange = useCallback((category: string | null) => {
    const matchingCategory = CATEGORY_OPTIONS.find(
      (option) => option === category
    );
    if (matchingCategory) {
      setValues((currentValues) => ({
        ...currentValues,
        category: matchingCategory,
      }));
    }
  }, []);
  const handleIncidentTypeChange = useCallback(
    (incidentType: string | null) => {
      const normalizedIncidentType =
        incidentType === UNCLASSIFIED_INCIDENT
          ? ""
          : (INCIDENT_TYPE_OPTIONS.find((option) => option === incidentType) ??
            "");
      setValues((currentValues) => ({
        ...currentValues,
        incidentType: normalizedIncidentType,
      }));
    },
    []
  );
  const handleLocationChange = useCallback(
    (coordinates: { latitude: number; longitude: number }) => {
      setValues((currentValues) => ({
        ...currentValues,
        latitude: coordinates.latitude.toFixed(6),
        longitude: coordinates.longitude.toFixed(6),
      }));
    },
    []
  );
  const handleCancel = useCallback(() => {
    setOpen(false);
  }, []);

  const latitude = values.latitude ? Number(values.latitude) : null;
  const longitude = values.longitude ? Number(values.longitude) : null;
  const validLatitude = Number.isFinite(latitude) ? latitude : null;
  const validLongitude = Number.isFinite(longitude) ? longitude : null;

  return (
    <Dialog onOpenChange={handleOpenChange} open={open}>
      <DialogTrigger
        render={
          <Button
            className="w-full"
            disabled={!report.canEdit}
            size="sm"
            title={report.editBlockReason ?? "Edit detail laporan"}
            variant="stroke"
          />
        }
      >
        <PencilLineIcon aria-hidden data-icon="inline-start" />
        Edit laporan
      </DialogTrigger>
      <DialogContent className="max-h-[92vh] max-w-4xl grid-rows-[auto_minmax(0,1fr)] overflow-hidden">
        <DialogHeader>
          <DialogTitle>Edit detail laporan</DialogTitle>
          <DialogDescription>
            Perubahan langsung mengganti detail laporan. Identitas pelapor dan
            status penanganan tidak dapat diubah.
          </DialogDescription>
        </DialogHeader>

        <form
          className="flex min-h-0 flex-col gap-4 overflow-hidden"
          onSubmit={handleSubmit}
        >
          <div className="min-h-0 flex-1 overflow-y-auto pr-1">
            <FieldGroup>
              {validationMessage ? (
                <Alert variant="destructive">
                  <AlertTriangleIcon aria-hidden />
                  <AlertTitle>Perubahan belum disimpan</AlertTitle>
                  <AlertDescription>{validationMessage}</AlertDescription>
                </Alert>
              ) : null}

              <div className="grid gap-4 md:grid-cols-2">
                <Field>
                  <FieldLabel htmlFor="report-title">Judul</FieldLabel>
                  <Input
                    id="report-title"
                    maxLength={250}
                    name="title"
                    onChange={handleTextChange}
                    value={values.title}
                  />
                </Field>

                <Field>
                  <FieldLabel htmlFor="report-category">Prioritas</FieldLabel>
                  <Select
                    onValueChange={handleCategoryChange}
                    value={values.category}
                  >
                    <SelectTrigger className="w-full" id="report-category">
                      <SelectValue>
                        {CATEGORY_CONFIG[values.category].label}
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      <SelectGroup>
                        {CATEGORY_OPTIONS.map((category) => (
                          <SelectItem key={category} value={category}>
                            {CATEGORY_CONFIG[category].label}
                          </SelectItem>
                        ))}
                      </SelectGroup>
                    </SelectContent>
                  </Select>
                </Field>
              </div>

              <Field>
                <FieldLabel htmlFor="report-summary">
                  Ringkasan kejadian
                </FieldLabel>
                <Textarea
                  id="report-summary"
                  maxLength={5000}
                  name="summary"
                  onChange={handleTextChange}
                  value={values.summary}
                />
              </Field>

              <div className="grid gap-4 md:grid-cols-2">
                <Field>
                  <FieldLabel htmlFor="report-incident-type">
                    Jenis kejadian
                  </FieldLabel>
                  <Select
                    onValueChange={handleIncidentTypeChange}
                    value={values.incidentType || UNCLASSIFIED_INCIDENT}
                  >
                    <SelectTrigger className="w-full" id="report-incident-type">
                      <SelectValue>
                        {values.incidentType
                          ? INCIDENT_TYPE_LABELS[values.incidentType]
                          : "Belum diklasifikasi"}
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      <SelectGroup>
                        <SelectItem value={UNCLASSIFIED_INCIDENT}>
                          Belum diklasifikasi
                        </SelectItem>
                        {INCIDENT_TYPE_OPTIONS.map((incidentType) => (
                          <SelectItem key={incidentType} value={incidentType}>
                            {INCIDENT_TYPE_LABELS[incidentType]}
                          </SelectItem>
                        ))}
                      </SelectGroup>
                    </SelectContent>
                  </Select>
                </Field>

                <Field>
                  <FieldLabel htmlFor="report-address">Alamat</FieldLabel>
                  <Input
                    id="report-address"
                    maxLength={500}
                    name="address"
                    onChange={handleTextChange}
                    value={values.address}
                  />
                </Field>
              </div>

              <Field>
                <FieldLabel htmlFor="report-latitude">
                  Pilih koordinat pada peta
                </FieldLabel>
                <FieldDescription>
                  Klik peta atau geser marker. Alamat tetap dapat diketik
                  manual.
                </FieldDescription>
                <Suspense
                  fallback={
                    <div className="h-64 animate-pulse rounded-md bg-muted" />
                  }
                >
                  <ReportLocationPicker
                    latitude={validLatitude}
                    longitude={validLongitude}
                    onChange={handleLocationChange}
                  />
                </Suspense>
              </Field>

              <div className="grid gap-4 md:grid-cols-2">
                <Field>
                  <FieldLabel htmlFor="report-latitude">Latitude</FieldLabel>
                  <Input
                    id="report-latitude"
                    inputMode="decimal"
                    name="latitude"
                    onChange={handleTextChange}
                    value={values.latitude}
                  />
                </Field>
                <Field>
                  <FieldLabel htmlFor="report-longitude">Longitude</FieldLabel>
                  <Input
                    id="report-longitude"
                    inputMode="decimal"
                    name="longitude"
                    onChange={handleTextChange}
                    value={values.longitude}
                  />
                </Field>
              </div>

              <Field>
                <FieldLabel htmlFor="report-recommendation">
                  Rekomendasi
                </FieldLabel>
                <Textarea
                  id="report-recommendation"
                  maxLength={2000}
                  name="recommendation"
                  onChange={handleTextChange}
                  value={values.recommendation}
                />
              </Field>

              <Field>
                <div className="flex items-start justify-between gap-3">
                  <span>
                    <FieldLabel htmlFor="additional-data-key-0">
                      Data tambahan
                    </FieldLabel>
                    <FieldDescription>
                      Tambahkan informasi pendukung dalam pasangan nama dan
                      nilai.
                    </FieldDescription>
                  </span>
                  <Button
                    onClick={handleAddAdditionalData}
                    size="sm"
                    type="button"
                    variant="ghost"
                  >
                    <PlusIcon aria-hidden data-icon="inline-start" />
                    Tambah baris
                  </Button>
                </div>
                {values.additionalData.length > 0 ? (
                  <div className="flex flex-col gap-2">
                    {values.additionalData.map((row, index) => (
                      <div
                        className="grid grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto] items-end gap-2"
                        key={row.id}
                      >
                        <Field>
                          <FieldLabel
                            className="sr-only"
                            htmlFor={`additional-data-key-${index}`}
                          >
                            Nama data baris {index + 1}
                          </FieldLabel>
                          <Input
                            data-field="key"
                            data-row-id={row.id}
                            id={`additional-data-key-${index}`}
                            maxLength={100}
                            onChange={handleAdditionalDataChange}
                            placeholder="Nama data"
                            value={row.key}
                          />
                        </Field>
                        <Field>
                          <FieldLabel
                            className="sr-only"
                            htmlFor={`additional-data-value-${index}`}
                          >
                            Nilai data baris {index + 1}
                          </FieldLabel>
                          <Input
                            data-field="value"
                            data-row-id={row.id}
                            id={`additional-data-value-${index}`}
                            maxLength={1000}
                            onChange={handleAdditionalDataChange}
                            placeholder="Nilai"
                            value={row.value}
                          />
                        </Field>
                        <Button
                          aria-label={`Hapus data tambahan baris ${index + 1}`}
                          onClick={handleRemoveAdditionalData}
                          size="icon-sm"
                          type="button"
                          value={row.id}
                          variant="ghost"
                        >
                          <Trash2Icon aria-hidden />
                        </Button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <FieldDescription>
                    Belum ada data tambahan. Pilih “Tambah baris” jika
                    diperlukan.
                  </FieldDescription>
                )}
              </Field>
            </FieldGroup>
          </div>

          <DialogFooter>
            <Button onClick={handleCancel} type="button" variant="ghost">
              Batal
            </Button>
            <Button disabled={updateMutation.isPending} type="submit">
              {updateMutation.isPending ? "Menyimpan..." : "Simpan perubahan"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
