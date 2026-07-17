import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@siaga-app/ui/components/tabs";
import { cn } from "@siaga-app/ui/lib/utils";
import { BrainCircuitIcon, FileTextIcon } from "lucide-react";

import type { OperatorCallSession } from "@/features/calls/types";
import type { DisplayError, ReportDetail } from "@/features/map/types";
import { ReportCallSummaryPanel } from "./report-call-summary-panel";
import { ReportDetailPanel } from "./report-detail-panel";

interface ReportDetailWorkspaceProps {
  className?: string;
  error: DisplayError | null;
  isPending: boolean;
  mode: "desktop" | "mobile";
  onEndCall: () => Promise<void>;
  onReportResolved: (reportId: string) => void;
  onSelectAgency: (agencyId: string) => void;
  onStartCall: (reportId: string) => Promise<void>;
  report: ReportDetail | null;
  selectedAgencyId: string | null;
  session: OperatorCallSession;
}

export function ReportDetailWorkspace({
  className,
  error,
  isPending,
  mode,
  onEndCall,
  onReportResolved,
  onSelectAgency,
  onStartCall,
  report,
  selectedAgencyId,
  session,
}: ReportDetailWorkspaceProps) {
  if (mode === "mobile") {
    return (
      <Tabs
        className={cn("size-full min-h-0 gap-0", className)}
        defaultValue="detail"
      >
        <TabsList className="w-full shrink-0 border-b pr-12" variant="line">
          <TabsTrigger value="detail">
            <FileTextIcon aria-hidden data-icon="inline-start" />
            Detail
          </TabsTrigger>
          <TabsTrigger value="summary">
            <BrainCircuitIcon aria-hidden data-icon="inline-start" />
            Ringkasan AI
          </TabsTrigger>
        </TabsList>
        <TabsContent className="min-h-0 overflow-hidden" value="detail">
          <ReportDetailPanel
            className="size-full rounded-none bg-transparent shadow-none ring-0 backdrop-blur-none"
            error={error}
            isPending={isPending}
            onReportResolved={onReportResolved}
            onSelectAgency={onSelectAgency}
            report={report}
            selectedAgencyId={selectedAgencyId}
          />
        </TabsContent>
        <TabsContent className="min-h-0 overflow-hidden" value="summary">
          <ReportCallSummaryPanel
            className="size-full rounded-none bg-transparent shadow-none ring-0 backdrop-blur-none"
            onEndCall={onEndCall}
            onStartCall={onStartCall}
            report={report}
            session={session}
          />
        </TabsContent>
      </Tabs>
    );
  }

  return (
    <div
      className={cn(
        "grid min-h-0 grid-rows-[minmax(0,3fr)_minmax(0,2fr)] gap-3",
        className
      )}
    >
      <ReportDetailPanel
        className="min-h-0"
        error={error}
        isPending={isPending}
        onReportResolved={onReportResolved}
        onSelectAgency={onSelectAgency}
        report={report}
        selectedAgencyId={selectedAgencyId}
      />
      <ReportCallSummaryPanel
        className="min-h-0"
        onEndCall={onEndCall}
        onStartCall={onStartCall}
        report={report}
        session={session}
      />
    </div>
  );
}
