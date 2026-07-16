import { Badge } from "@siaga-app/ui/components/badge";
import { Button } from "@siaga-app/ui/components/button";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyTitle,
} from "@siaga-app/ui/components/empty";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "@siaga-app/ui/components/input-group";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationNext,
  PaginationPrevious,
} from "@siaga-app/ui/components/pagination";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@siaga-app/ui/components/select";
import { Skeleton } from "@siaga-app/ui/components/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@siaga-app/ui/components/table";
import { EyeIcon, SearchIcon } from "lucide-react";
import {
  type ChangeEvent,
  type MouseEvent,
  useCallback,
  useDeferredValue,
  useState,
} from "react";

import {
  CATEGORY_CONFIG,
  getReportTitle,
  INCIDENT_TYPE_LABELS,
} from "@/features/map/content";

import { useArchivedReportLiveUpdates, useArchivedReportsQuery } from "../api";
import {
  ARCHIVED_CATEGORY_OPTIONS,
  ARCHIVED_STATUS_LABELS,
  ARCHIVED_STATUS_OPTIONS,
  ARCHIVED_STATUS_VARIANTS,
  formatArchivedDateTime,
} from "../content";
import type { ArchivedReportCategory, ArchivedReportStatus } from "../types";
import { ArchivedReportDetailSheet } from "./archived-report-detail-sheet";

const PAGE_SIZE = 10;
const ARCHIVE_LOADING_ROW_IDS = [
  "archive-loading-1",
  "archive-loading-2",
  "archive-loading-3",
  "archive-loading-4",
  "archive-loading-5",
  "archive-loading-6",
] as const;

export function ArchivedReportsScreen() {
  const [page, setPage] = useState(1);
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<ArchivedReportStatus | "ALL">("ALL");
  const [category, setCategory] = useState<ArchivedReportCategory | "ALL">(
    "ALL"
  );
  const [selectedReportId, setSelectedReportId] = useState<string | null>(null);
  const deferredQuery = useDeferredValue(query);
  const archiveQuery = useArchivedReportsQuery({
    category: category === "ALL" ? undefined : category,
    page,
    pageSize: PAGE_SIZE,
    query: deferredQuery || undefined,
    status: status === "ALL" ? undefined : status,
  });
  useArchivedReportLiveUpdates();

  const handleQueryChange = useCallback(
    (event: ChangeEvent<HTMLInputElement>) => {
      setQuery(event.target.value);
      setPage(1);
    },
    []
  );
  const handleStatusChange = useCallback((value: string | null) => {
    if (value) {
      setStatus(value as ArchivedReportStatus | "ALL");
      setPage(1);
    }
  }, []);
  const handleCategoryChange = useCallback((value: string | null) => {
    if (value) {
      setCategory(value as ArchivedReportCategory | "ALL");
      setPage(1);
    }
  }, []);
  const handlePrevious = useCallback((event: MouseEvent<HTMLAnchorElement>) => {
    event.preventDefault();
    setPage((currentPage) => Math.max(1, currentPage - 1));
  }, []);
  const handleNext = useCallback(
    (event: MouseEvent<HTMLAnchorElement>) => {
      event.preventDefault();
      setPage((currentPage) =>
        Math.min(archiveQuery.data?.totalPages ?? currentPage, currentPage + 1)
      );
    },
    [archiveQuery.data?.totalPages]
  );
  const handleDetailOpenChange = useCallback((open: boolean) => {
    if (!open) {
      setSelectedReportId(null);
    }
  }, []);
  const handleOpenDetail = useCallback(
    (event: MouseEvent<HTMLButtonElement>) => {
      const { reportId } = event.currentTarget.dataset;
      if (reportId) {
        setSelectedReportId(reportId);
      }
    },
    []
  );

  return (
    <div className="mx-auto flex w-full max-w-[90rem] flex-col gap-6">
      <header>
        <p className="text-neutral-700 text-xs uppercase tracking-wider">
          Audit dan histori penanganan
        </p>
        <h1 className="mt-1 font-extrabold text-3xl text-foreground">
          Riwayat Laporan
        </h1>
      </header>

      <section className="overflow-hidden rounded-lg bg-popover/95 shadow-xl ring-1 ring-foreground/10">
        <div className="flex flex-col gap-3 border-b p-4 lg:flex-row lg:items-center lg:justify-between">
          <InputGroup className="max-w-md">
            <InputGroupAddon>
              <SearchIcon aria-hidden />
            </InputGroupAddon>
            <InputGroupInput
              aria-label="Cari laporan terminal"
              onChange={handleQueryChange}
              placeholder="Cari judul, alamat, atau pelapor"
              value={query}
            />
          </InputGroup>

          <div className="flex flex-wrap gap-2">
            <Select onValueChange={handleStatusChange} value={status}>
              <SelectTrigger aria-label="Filter status" className="min-w-40">
                <SelectValue>
                  {
                    ARCHIVED_STATUS_OPTIONS.find(
                      (option) => option.value === status
                    )?.label
                  }
                </SelectValue>
              </SelectTrigger>
              <SelectContent align="start">
                <SelectGroup>
                  {ARCHIVED_STATUS_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectGroup>
              </SelectContent>
            </Select>
            <Select onValueChange={handleCategoryChange} value={category}>
              <SelectTrigger aria-label="Filter prioritas" className="min-w-40">
                <SelectValue>
                  {
                    ARCHIVED_CATEGORY_OPTIONS.find(
                      (option) => option.value === category
                    )?.label
                  }
                </SelectValue>
              </SelectTrigger>
              <SelectContent align="start">
                <SelectGroup>
                  {ARCHIVED_CATEGORY_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectGroup>
              </SelectContent>
            </Select>
          </div>
        </div>

        {archiveQuery.isPending ? (
          <div className="flex flex-col gap-2 p-4">
            {ARCHIVE_LOADING_ROW_IDS.map((rowId) => (
              <Skeleton className="h-12 w-full" key={rowId} />
            ))}
          </div>
        ) : null}

        {archiveQuery.error ? (
          <Empty className="min-h-80">
            <EmptyHeader>
              <EmptyTitle>Riwayat tidak dapat dimuat</EmptyTitle>
              <EmptyDescription>{archiveQuery.error.message}</EmptyDescription>
            </EmptyHeader>
          </Empty>
        ) : null}

        {archiveQuery.data?.items.length === 0 ? (
          <Empty className="min-h-80">
            <EmptyHeader>
              <EmptyTitle>Tidak ada laporan terminal</EmptyTitle>
              <EmptyDescription>
                Ubah filter atau kata pencarian untuk melihat data lain.
              </EmptyDescription>
            </EmptyHeader>
          </Empty>
        ) : null}

        {archiveQuery.data && archiveQuery.data.items.length > 0 ? (
          <>
            <Table className="table-fixed md:table-auto">
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[60%] md:w-auto">Laporan</TableHead>
                  <TableHead className="hidden md:table-cell">
                    Pelapor
                  </TableHead>
                  <TableHead className="hidden sm:table-cell">
                    Prioritas
                  </TableHead>
                  <TableHead className="hidden xl:table-cell">
                    Jenis kejadian
                  </TableHead>
                  <TableHead className="w-[28%] md:w-auto">
                    Status akhir
                  </TableHead>
                  <TableHead className="hidden xl:table-cell">
                    Unit terakhir
                  </TableHead>
                  <TableHead className="hidden lg:table-cell">
                    Waktu akhir
                  </TableHead>
                  <TableHead className="w-10 md:w-16">
                    <span className="sr-only">Aksi</span>
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {archiveQuery.data.items.map((report) => {
                  const categoryConfig = CATEGORY_CONFIG[report.category];
                  return (
                    <TableRow key={report.id}>
                      <TableCell className="max-w-72 whitespace-normal">
                        <p className="truncate font-semibold text-foreground">
                          {getReportTitle(report)}
                        </p>
                        <p className="mt-1 truncate text-[10px] text-muted-foreground">
                          {report.id.slice(-8).toUpperCase()} ·{" "}
                          {report.address ?? "Alamat tidak tersedia"}
                        </p>
                      </TableCell>
                      <TableCell className="hidden md:table-cell">
                        {report.reporter.name}
                      </TableCell>
                      <TableCell className="hidden sm:table-cell">
                        <Badge
                          className={categoryConfig.badgeClassName}
                          variant="outline"
                        >
                          {categoryConfig.label}
                        </Badge>
                      </TableCell>
                      <TableCell className="hidden xl:table-cell">
                        {report.incidentType
                          ? INCIDENT_TYPE_LABELS[report.incidentType]
                          : "Belum diklasifikasi"}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={ARCHIVED_STATUS_VARIANTS[report.status]}
                        >
                          {ARCHIVED_STATUS_LABELS[report.status]}
                        </Badge>
                      </TableCell>
                      <TableCell className="hidden xl:table-cell">
                        {report.latestDispatch?.unitCode ??
                          report.latestDispatch?.agencyName ??
                          "Tidak ada"}
                      </TableCell>
                      <TableCell className="hidden lg:table-cell">
                        {formatArchivedDateTime(report.terminalAt)}
                      </TableCell>
                      <TableCell>
                        <Button
                          aria-label={`Lihat ${getReportTitle(report)}`}
                          data-report-id={report.id}
                          onClick={handleOpenDetail}
                          size="icon-sm"
                          title="Lihat detail"
                          type="button"
                          variant="ghost"
                        >
                          <EyeIcon />
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>

            <footer className="flex flex-col gap-3 border-t p-4 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-muted-foreground text-xs">
                {archiveQuery.data.total} laporan terminal · Halaman{" "}
                {archiveQuery.data.page} dari{" "}
                {Math.max(archiveQuery.data.totalPages, 1)}
              </p>
              {archiveQuery.data.totalPages > 1 ? (
                <Pagination className="mx-0 w-auto">
                  <PaginationContent>
                    <PaginationItem>
                      <PaginationPrevious
                        aria-disabled={page <= 1}
                        className={
                          page <= 1 ? "pointer-events-none opacity-50" : ""
                        }
                        href="#"
                        onClick={handlePrevious}
                        text="Sebelumnya"
                      />
                    </PaginationItem>
                    <PaginationItem>
                      <PaginationNext
                        aria-disabled={page >= archiveQuery.data.totalPages}
                        className={
                          page >= archiveQuery.data.totalPages
                            ? "pointer-events-none opacity-50"
                            : ""
                        }
                        href="#"
                        onClick={handleNext}
                        text="Berikutnya"
                      />
                    </PaginationItem>
                  </PaginationContent>
                </Pagination>
              ) : null}
            </footer>
          </>
        ) : null}
      </section>

      <ArchivedReportDetailSheet
        onOpenChange={handleDetailOpenChange}
        reportId={selectedReportId}
      />
    </div>
  );
}
