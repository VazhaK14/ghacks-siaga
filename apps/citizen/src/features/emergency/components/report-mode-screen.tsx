import { Button } from "@siaga-app/ui/components/button";
import {
  ToggleGroup,
  ToggleGroupItem,
} from "@siaga-app/ui/components/toggle-group";
import { HeadphonesIcon } from "lucide-react";
import { useEffect } from "react";
import { useNavigate } from "react-router";

import { MobilePage } from "@/components/mobile-page";

import { REPORT_MODES } from "../content";
import { useIncident } from "../context";
import type { ReportMode } from "../types";

const REPORT_MODE_IDS = new Set<ReportMode>(["voice", "text", "silent"]);
const isReportMode = (value: string): value is ReportMode =>
  REPORT_MODE_IDS.has(value as ReportMode);

export const ReportModeScreen = () => {
  const navigate = useNavigate();
  const { idempotencyKey, setConnectionTarget, setMode } = useIncident();

  useEffect(() => {
    if (!idempotencyKey) {
      navigate("/sos", { replace: true });
    }
  }, [idempotencyKey, navigate]);

  const handleSelectMode = (mode: ReportMode) => {
    setConnectionTarget("ai");
    setMode(mode);
    navigate("/connecting");
  };
  const handleModeChange = (values: string[]) => {
    const [selected] = values;
    if (selected && isReportMode(selected)) {
      handleSelectMode(selected);
    }
  };
  const handleOperator = () => {
    setConnectionTarget("operator");
    setMode("voice");
    navigate("/connecting");
  };

  if (!idempotencyKey) {
    return null;
  }

  return (
    <MobilePage className="gap-6" title="Pilih cara melapor">
      <header className="flex flex-col gap-1">
        <h1 className="text-h3">Bagaimana kamu ingin melapor?</h1>
        <p className="text-muted-foreground text-sm">
          Pilih cara yang paling aman untuk situasimu.
        </p>
      </header>

      <ToggleGroup
        aria-label="Cara melapor"
        className="flex w-full flex-col gap-3"
        onValueChange={handleModeChange}
        value={[]}
      >
        {REPORT_MODES.map(({ body, icon: Icon, id, title }) => (
          <ToggleGroupItem
            aria-label={title}
            className="h-auto w-full min-w-0 justify-start gap-4 whitespace-normal px-5 py-5 text-left"
            key={id}
            value={id}
          >
            <Icon aria-hidden="true" className="size-7 shrink-0" />
            <span className="flex min-w-0 flex-col gap-1">
              <span className="font-semibold text-sm">{title}</span>
              <span className="font-normal text-muted-foreground text-xs leading-relaxed">
                {body}
              </span>
            </span>
          </ToggleGroupItem>
        ))}
      </ToggleGroup>

      <Button onClick={handleOperator} variant="ghost">
        <HeadphonesIcon data-icon="inline-start" />
        Hubungkan ke operator 112
      </Button>
    </MobilePage>
  );
};
