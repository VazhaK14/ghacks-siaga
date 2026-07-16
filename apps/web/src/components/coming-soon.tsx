export function ComingSoon({ title }: { title: string }) {
  return (
    <div>
      <h1 className="font-extrabold text-3xl text-neutral-1000">{title}</h1>
      <div className="mt-6 flex h-96 items-center justify-center rounded-xl bg-neutral-100 ring-1 ring-foreground/10">
        <p className="text-neutral-700 text-sm">Coming soon</p>
      </div>
    </div>
  );
}
