import { Avatar, AvatarFallback } from "@siaga-app/ui/components/avatar";
import { Badge } from "@siaga-app/ui/components/badge";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyTitle,
} from "@siaga-app/ui/components/empty";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationNext,
  PaginationPrevious,
} from "@siaga-app/ui/components/pagination";
import { Skeleton } from "@siaga-app/ui/components/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@siaga-app/ui/components/table";
import type { MouseEvent } from "react";
import { useCallback } from "react";

import { getInitials } from "@/lib/get-initials";

import { useOperatorsQuery } from "../api";

interface OperatorListProps {
  onPageChange: (page: number) => void;
  page: number;
  pageSize: number;
}

const OPERATOR_LOADING_ROW_IDS = [
  "operator-loading-1",
  "operator-loading-2",
  "operator-loading-3",
  "operator-loading-4",
  "operator-loading-5",
  "operator-loading-6",
] as const;

const formatOperatorDate = (value: Date): string =>
  new Intl.DateTimeFormat("id-ID", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));

export function OperatorList({
  onPageChange,
  page,
  pageSize,
}: OperatorListProps) {
  const operatorsQuery = useOperatorsQuery({ page, pageSize });
  const handlePrevious = useCallback(
    (event: MouseEvent<HTMLAnchorElement>) => {
      event.preventDefault();
      onPageChange(Math.max(1, page - 1));
    },
    [onPageChange, page]
  );
  const handleNext = useCallback(
    (event: MouseEvent<HTMLAnchorElement>) => {
      event.preventDefault();
      onPageChange(Math.min(operatorsQuery.data?.totalPages ?? page, page + 1));
    },
    [onPageChange, operatorsQuery.data?.totalPages, page]
  );

  if (operatorsQuery.isPending) {
    return (
      <div className="flex flex-col gap-2 p-4">
        {OPERATOR_LOADING_ROW_IDS.map((rowId) => (
          <Skeleton className="h-12 w-full" key={rowId} />
        ))}
      </div>
    );
  }

  if (operatorsQuery.error) {
    return (
      <Empty className="min-h-72">
        <EmptyHeader>
          <EmptyTitle>Operator tidak dapat dimuat</EmptyTitle>
          <EmptyDescription>{operatorsQuery.error.message}</EmptyDescription>
        </EmptyHeader>
      </Empty>
    );
  }

  if (!operatorsQuery.data || operatorsQuery.data.items.length === 0) {
    return (
      <Empty className="min-h-72">
        <EmptyHeader>
          <EmptyTitle>Belum ada operator</EmptyTitle>
          <EmptyDescription>
            Tambahkan akun operator pertama melalui tombol di atas.
          </EmptyDescription>
        </EmptyHeader>
      </Empty>
    );
  }

  return (
    <>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Operator</TableHead>
            <TableHead className="hidden sm:table-cell">Email</TableHead>
            <TableHead className="hidden md:table-cell">Role</TableHead>
            <TableHead>Status akun</TableHead>
            <TableHead className="hidden lg:table-cell">Dibuat</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {operatorsQuery.data.items.map((operator) => (
            <TableRow key={operator.id}>
              <TableCell>
                <div className="flex items-center gap-3">
                  <Avatar>
                    <AvatarFallback>
                      {getInitials(operator.name)}
                    </AvatarFallback>
                  </Avatar>
                  <span className="font-semibold text-foreground">
                    {operator.name}
                  </span>
                </div>
              </TableCell>
              <TableCell className="hidden text-muted-foreground sm:table-cell">
                {operator.email}
              </TableCell>
              <TableCell className="hidden md:table-cell">
                <Badge variant="outline">Operator</Badge>
              </TableCell>
              <TableCell>
                <Badge variant={operator.banned ? "destructive" : "secondary"}>
                  {operator.banned ? "Dinonaktifkan" : "Aktif"}
                </Badge>
              </TableCell>
              <TableCell className="hidden text-muted-foreground lg:table-cell">
                {formatOperatorDate(operator.createdAt)}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      <footer className="flex flex-col gap-3 border-t p-4 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-muted-foreground text-xs">
          {operatorsQuery.data.total} operator · Halaman{" "}
          {operatorsQuery.data.page} dari{" "}
          {Math.max(operatorsQuery.data.totalPages, 1)}
        </p>
        {operatorsQuery.data.totalPages > 1 ? (
          <Pagination className="mx-0 w-auto">
            <PaginationContent>
              <PaginationItem>
                <PaginationPrevious
                  aria-disabled={page <= 1}
                  className={page <= 1 ? "pointer-events-none opacity-50" : ""}
                  href="#"
                  onClick={handlePrevious}
                  text="Sebelumnya"
                />
              </PaginationItem>
              <PaginationItem>
                <PaginationNext
                  aria-disabled={page >= operatorsQuery.data.totalPages}
                  className={
                    page >= operatorsQuery.data.totalPages
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
  );
}
