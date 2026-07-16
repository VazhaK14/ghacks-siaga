import { useCallback, useState } from "react";
import { CreateOperatorDialog } from "@/features/operators/components/create-operator-dialog";
import { OperatorList } from "@/features/operators/components/operator-list";

export const handle = {
  dashboardSurface: "standard",
} as const;

export default function Operators() {
  const [page, setPage] = useState(1);
  const handleOperatorCreated = useCallback(() => {
    setPage(1);
  }, []);

  return (
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <header>
          <p className="text-neutral-700 text-xs uppercase tracking-wider">
            Akses command center
          </p>
          <h1 className="mt-1 font-extrabold text-3xl text-foreground">
            Manajemen Operator
          </h1>
        </header>
        <CreateOperatorDialog onCreated={handleOperatorCreated} />
      </div>

      <section className="overflow-hidden rounded-lg bg-popover/95 shadow-xl ring-1 ring-foreground/10">
        <OperatorList onPageChange={setPage} page={page} pageSize={10} />
      </section>
    </div>
  );
}
