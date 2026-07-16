import type { AppRouter } from "@siaga-app/api/routers/index";
import type { inferRouterInputs, inferRouterOutputs } from "@trpc/server";
import { z } from "zod";

type RouterInputs = inferRouterInputs<AppRouter>;
type RouterOutputs = inferRouterOutputs<AppRouter>;

export type ArchivedReportListInput = RouterInputs["report"]["listArchived"];
export type ArchivedReportPage = RouterOutputs["report"]["listArchived"];
export type ArchivedReportListItem = ArchivedReportPage["items"][number];
export type ArchivedReportDetail = RouterOutputs["report"]["getArchivedDetail"];
export type ArchivedReportStatus = ArchivedReportListItem["status"];
export type ArchivedReportCategory = ArchivedReportListItem["category"];
export type UpdateReportDetailInput = RouterInputs["report"]["updateDetail"];

const nullableCoordinateSchema = z
  .string()
  .trim()
  .refine(
    (value) => value.length === 0 || Number.isFinite(Number(value)),
    "Koordinat harus berupa angka"
  );

export const reportEditFormSchema = z
  .object({
    additionalData: z
      .array(
        z.object({
          id: z.string(),
          key: z.string().max(100),
          value: z.string().max(1000),
        })
      )
      .max(50)
      .superRefine((rows, context) => {
        const usedKeys = new Set<string>();
        for (const [index, row] of rows.entries()) {
          const normalizedKey = row.key.trim();
          const hasValue = row.value.trim().length > 0;
          if (normalizedKey.length === 0 && hasValue) {
            context.addIssue({
              code: "custom",
              message: "Nama data wajib diisi jika nilai tersedia",
              path: [index, "key"],
            });
            continue;
          }
          if (normalizedKey.length === 0) {
            continue;
          }
          if (usedKeys.has(normalizedKey)) {
            context.addIssue({
              code: "custom",
              message: `Nama data "${normalizedKey}" digunakan lebih dari sekali`,
              path: [index, "key"],
            });
          }
          usedKeys.add(normalizedKey);
        }
      }),
    address: z.string().max(500),
    category: z.enum(["UNCATEGORIZED", "LOW", "MEDIUM", "HIGH", "CRITICAL"]),
    incidentType: z.union([
      z.literal(""),
      z.enum([
        "CRIME",
        "FIRE",
        "MEDICAL",
        "TRAFFIC_ACCIDENT",
        "NATURAL_DISASTER",
        "DOMESTIC_VIOLENCE",
        "MISSING_PERSON",
        "OTHER",
      ]),
    ]),
    latitude: nullableCoordinateSchema,
    longitude: nullableCoordinateSchema,
    recommendation: z.string().max(2000),
    summary: z.string().max(5000),
    title: z.string().max(250),
  })
  .superRefine((value, context) => {
    const hasLatitude = value.latitude.length > 0;
    const hasLongitude = value.longitude.length > 0;
    if (hasLatitude !== hasLongitude) {
      context.addIssue({
        code: "custom",
        message: "Latitude dan longitude harus diisi bersama",
        path: hasLatitude ? ["longitude"] : ["latitude"],
      });
    }
  });

export type ReportEditFormValues = z.infer<typeof reportEditFormSchema>;
