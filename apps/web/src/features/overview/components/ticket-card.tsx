import { cn } from "@siaga-app/ui/lib/utils";
import type { Ticket } from "../content";
import { priorityStyles } from "../content";

export function TicketCard({ ticket }: { ticket: Ticket }) {
  const styles = priorityStyles[ticket.priority];

  return (
    <div className="relative overflow-hidden rounded-xl bg-neutral-100 p-4 pl-6 ring-1 ring-foreground/10">
      <span className={cn("absolute inset-y-0 left-0 w-1.5", styles.bar)} />
      <div className="flex items-start justify-between gap-3">
        <p className="text-[10px] text-neutral-700">{ticket.meta}</p>
        <span
          className={cn(
            "shrink-0 rounded-md px-3 py-1 font-extrabold text-[9px] text-neutral-100",
            styles.badge
          )}
        >
          {ticket.priority}
        </span>
      </div>
      <p className="mt-2 font-extrabold text-lg text-neutral-1000">
        {ticket.title}
      </p>
      <p className="mt-3 text-[10px] text-neutral-700">{ticket.status}</p>
    </div>
  );
}
