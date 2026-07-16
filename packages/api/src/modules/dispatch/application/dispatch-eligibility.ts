const TERMINAL_REPORT_STATUSES = new Set(["RESOLVED", "CLOSED", "CANCELLED"]);

export const getDispatchBlockReason = ({
  hasActiveDispatch,
  latitude,
  longitude,
  status,
}: {
  hasActiveDispatch: boolean;
  latitude: number | null;
  longitude: number | null;
  status: string;
}): string | null => {
  if (hasActiveDispatch) {
    return "Laporan sudah memiliki dispatch aktif";
  }
  if (TERMINAL_REPORT_STATUSES.has(status)) {
    return "Laporan terminal tidak dapat menerima dispatch baru";
  }
  if (latitude === null || longitude === null) {
    return "Lokasi laporan belum tersedia";
  }

  return null;
};
