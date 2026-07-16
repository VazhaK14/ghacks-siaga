import { Badge } from "@siaga-app/ui/components/badge";
import { Button } from "@siaga-app/ui/components/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@siaga-app/ui/components/card";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyTitle,
} from "@siaga-app/ui/components/empty";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@siaga-app/ui/components/table";
import { MapPinnedIcon } from "lucide-react";
import { Link } from "react-router";

import {
  CATEGORY_CONFIG,
  getReportTitle,
  REPORT_STATUS_LABELS,
} from "@/features/map/content";
import { formatReportAge } from "../content";
import type { DashboardOverview } from "../types";

export function AttentionQueue({
  reports,
}: {
  reports: DashboardOverview["attentionQueue"];
}) {
  return (
    <Card className="h-full gap-0 rounded-lg py-0">
      <CardHeader className="border-b py-4">
        <CardTitle>Antrean perhatian</CardTitle>
        <CardDescription>
          Laporan aktif teratas berdasarkan prioritas dan usia.
        </CardDescription>
      </CardHeader>
      <CardContent className="px-0 py-0">
        {reports.length === 0 ? (
          <Empty className="min-h-72">
            <EmptyHeader>
              <EmptyTitle>Tidak ada laporan aktif</EmptyTitle>
              <EmptyDescription>
                Antrean operator sedang bersih.
              </EmptyDescription>
            </EmptyHeader>
          </Empty>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Laporan</TableHead>
                <TableHead className="w-20">Usia</TableHead>
                <TableHead className="w-12">
                  <span className="sr-only">Buka</span>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {reports.map((report) => {
                const category = CATEGORY_CONFIG[report.category];
                const statusLabel =
                  REPORT_STATUS_LABELS[
                    report.status as keyof typeof REPORT_STATUS_LABELS
                  ] ?? report.status.replaceAll("_", " ");

                return (
                  <TableRow key={report.id}>
                    <TableCell className="max-w-64 whitespace-normal">
                      <p className="truncate font-semibold text-foreground">
                        {getReportTitle(report)}
                      </p>
                      <span className="mt-1 flex flex-wrap items-center gap-2">
                        <Badge
                          className={category.badgeClassName}
                          variant="outline"
                        >
                          {category.label}
                        </Badge>
                        <span className="text-[9px] text-muted-foreground">
                          {statusLabel}
                        </span>
                      </span>
                    </TableCell>
                    <TableCell className="font-mono text-[10px] text-muted-foreground">
                      {formatReportAge(report.ageMinutes)}
                    </TableCell>
                    <TableCell>
                      <Button
                        aria-label={`Buka ${getReportTitle(report)} di Map Monitor`}
                        render={
                          <Link to={`/map-monitor?reportId=${report.id}`} />
                        }
                        size="icon-sm"
                        title="Buka di Map Monitor"
                        variant="ghost"
                      >
                        <MapPinnedIcon />
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}
