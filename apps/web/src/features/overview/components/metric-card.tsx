import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@siaga-app/ui/components/card";
import { cn } from "@siaga-app/ui/lib/utils";
import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";

interface MetricCardProps {
  description: ReactNode;
  icon: LucideIcon;
  label: string;
  tone: "critical" | "neutral" | "success" | "warning";
  value: ReactNode;
}

const TONE_CONFIG = {
  critical: "bg-destructive/15 text-destructive",
  neutral: "bg-muted text-muted-foreground",
  success: "bg-success/15 text-success",
  warning: "bg-warning/15 text-warning",
} as const;

export function MetricCard({
  description,
  icon: Icon,
  label,
  tone,
  value,
}: MetricCardProps) {
  return (
    <Card className="gap-3 rounded-lg py-4">
      <CardHeader className="grid grid-cols-[1fr_auto] items-start px-4">
        <CardTitle className="text-muted-foreground text-xs">{label}</CardTitle>
        <span
          className={cn(
            "flex size-8 items-center justify-center rounded-md",
            TONE_CONFIG[tone]
          )}
        >
          <Icon aria-hidden className="size-4" />
        </span>
      </CardHeader>
      <CardContent className="px-4">
        <p className="font-bold text-2xl text-foreground tabular-nums">
          {value}
        </p>
        <div className="mt-1 text-[10px] text-muted-foreground">
          {description}
        </div>
      </CardContent>
    </Card>
  );
}
