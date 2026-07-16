export function BrandingPanel() {
  return (
    <div className="relative hidden overflow-hidden bg-gradient-to-br from-primary-200 via-primary-400 to-primary-500 lg:flex lg:flex-col lg:justify-between lg:p-12">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(255,255,255,0.12),transparent_45%),radial-gradient(circle_at_80%_80%,rgba(255,255,255,0.08),transparent_40%)]"
      />
      <span className="relative font-sans text-h4 text-primary-foreground">
        SIAGA
      </span>
      <div className="relative space-y-2">
        <p className="text-h2 text-primary-foreground">
          Emergency response, coordinated.
        </p>
        <p className="text-p3 text-primary-foreground/80">
          Operator console for triage, dispatch, and live handoff.
        </p>
      </div>
    </div>
  );
}
