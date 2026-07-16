import { Card } from "@siaga-app/ui/components/card";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyTitle,
} from "@siaga-app/ui/components/empty";
import { Skeleton } from "@siaga-app/ui/components/skeleton";

import { getInitials } from "@/lib/get-initials";

import { useOperatorsQuery } from "../api";

export function OperatorList() {
  const operatorsQuery = useOperatorsQuery();

  if (operatorsQuery.isPending) {
    return (
      <div className="space-y-3">
        <Skeleton className="h-16 w-full rounded-xl" />
        <Skeleton className="h-16 w-full rounded-xl" />
        <Skeleton className="h-16 w-full rounded-xl" />
      </div>
    );
  }

  if (operatorsQuery.data?.length === 0) {
    return (
      <Empty className="rounded-xl bg-neutral-100 ring-1 ring-foreground/10">
        <EmptyHeader>
          <EmptyTitle>Belum ada operator</EmptyTitle>
          <EmptyDescription>
            Tambahkan akun operator pertama lewat tombol "Tambah Operator".
          </EmptyDescription>
        </EmptyHeader>
      </Empty>
    );
  }

  return (
    <div className="space-y-3">
      {operatorsQuery.data?.map((operator) => (
        <Card
          className="flex-row items-center justify-between gap-4 rounded-xl p-4"
          key={operator.id}
        >
          <div className="flex min-w-0 items-center gap-3">
            <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-primary-10 font-extrabold text-primary-300 text-xs">
              {getInitials(operator.name)}
            </span>
            <div className="min-w-0">
              <p className="truncate font-semibold text-neutral-50 text-sm">
                {operator.name}
              </p>
              <p className="truncate text-neutral-400 text-xs">
                {operator.email}
              </p>
            </div>
          </div>
          <span className="shrink-0 rounded-md bg-primary-10 px-3 py-1 font-semibold text-primary-300 text-xs">
            Operator
          </span>
        </Card>
      ))}
    </div>
  );
}
