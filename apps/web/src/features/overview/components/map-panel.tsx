import { Card } from "@siaga-app/ui/components/card";

export function MapPanel() {
  return (
    <Card className="rounded-xl p-5">
      <p className="font-extrabold text-neutral-1000 text-xl">Map Monitor</p>
      <div className="relative mt-4 h-72 overflow-hidden rounded-xl bg-neutral-200">
        <div
          aria-hidden
          className="absolute inset-0 bg-[linear-gradient(rgba(51,51,51,0.06)_1px,transparent_1px),linear-gradient(90deg,rgba(51,51,51,0.06)_1px,transparent_1px)] bg-[size:28px_28px]"
        />
        <span className="absolute top-1/3 left-1/3 size-3 rounded-full bg-primary-300 ring-4 ring-primary-300/20" />
        <span className="absolute top-1/2 left-2/3 size-2.5 rounded-full bg-yellow-200 ring-4 ring-yellow-200/20" />
        <span className="absolute top-2/3 left-1/4 size-2.5 rounded-full bg-green-200 ring-4 ring-green-200/20" />
        <p className="absolute inset-x-0 bottom-3 text-center text-[10px] text-neutral-700">
          Live map integration coming soon
        </p>
      </div>
    </Card>
  );
}
