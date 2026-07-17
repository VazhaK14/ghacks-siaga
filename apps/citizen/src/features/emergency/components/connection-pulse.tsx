import type { LucideIcon } from "lucide-react";

interface ConnectionPulseProps {
  icon: LucideIcon;
  label: string;
}

export const ConnectionPulse = ({
  icon: ConnectionIcon,
  label,
}: ConnectionPulseProps) => (
  <div
    aria-label={label}
    className="citizen-connection-pulse relative flex size-72 items-center justify-center"
    role="status"
  >
    <span className="citizen-connection-ring citizen-connection-ring-far absolute size-full rounded-full border border-primary/10 bg-primary/5" />
    <span className="citizen-connection-ring citizen-connection-ring-near absolute size-44 rounded-full border border-primary/15 bg-primary/8" />
    <span className="citizen-connection-core relative flex size-20 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg shadow-primary/25">
      <ConnectionIcon aria-hidden="true" className="size-9" />
    </span>
  </div>
);
