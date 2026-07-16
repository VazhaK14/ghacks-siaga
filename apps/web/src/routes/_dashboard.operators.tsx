import { CreateOperatorDialog } from "@/features/operators/components/create-operator-dialog";
import { OperatorList } from "@/features/operators/components/operator-list";

export const handle = {
  dashboardSurface: "standard",
} as const;

export default function Operators() {
  return (
    <div>
      <div className="flex items-center justify-between">
        <h1 className="font-extrabold text-3xl text-neutral-1000">
          Manajemen Operator
        </h1>
        <CreateOperatorDialog />
      </div>

      <div className="mt-6">
        <OperatorList />
      </div>
    </div>
  );
}
