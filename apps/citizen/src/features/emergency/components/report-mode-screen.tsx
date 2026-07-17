import { ChevronRightIcon, HeadphonesIcon } from "lucide-react";
import { type MouseEvent, useEffect } from "react";
import { useNavigate } from "react-router";

import { MobilePage } from "@/components/mobile-page";

import { REPORT_MODES } from "../content";
import { useIncident } from "../context";
import type { ReportMode } from "../types";

const isReportMode = (value: string): value is ReportMode =>
  REPORT_MODES.some(({ id }) => id === value);

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
  const handleModeClick = ({
    currentTarget,
  }: MouseEvent<HTMLButtonElement>) => {
    if (isReportMode(currentTarget.value)) {
      handleSelectMode(currentTarget.value);
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
    <MobilePage className="gap-5" title="Pilih cara melapor">
      <header className="pt-2">
        <div className="mb-4 flex items-center gap-2">
          <span
            aria-hidden="true"
            className="size-1.5 rounded-full bg-primary-200 shadow-[0_0_0_4px_color-mix(in_oklch,var(--primary)_18%,transparent)]"
          />
          <span className="font-semibold text-[0.625rem] text-primary-100 tracking-[0.18em]">
            LAPORAN AKTIF
          </span>
        </div>
        <h1 className="max-w-xs text-h2">Pilih cara paling aman</h1>
        <p className="mt-2 max-w-sm text-muted-foreground text-sm leading-relaxed">
          Gunakan suara, teks, atau mode senyap sesuai kondisimu.
        </p>
      </header>

      <section
        aria-label="Cara melapor dengan SIAGA"
        className="citizen-report-modes"
      >
        {REPORT_MODES.map(({ body, icon: Icon, id, title }) => (
          <button
            aria-label={title}
            className="citizen-report-mode group flex w-full items-center gap-4 px-4 py-4 text-left"
            key={id}
            onClick={handleModeClick}
            type="button"
            value={id}
          >
            <span className="flex size-11 shrink-0 items-center justify-center rounded-2xl border border-border bg-muted text-muted-foreground">
              <Icon aria-hidden="true" className="size-5" />
            </span>
            <span className="min-w-0 flex-1">
              <span className="font-semibold text-sm">{title}</span>
              <span className="mt-1 block text-muted-foreground text-xs leading-relaxed">
                {body}
              </span>
            </span>
            <ChevronRightIcon
              aria-hidden="true"
              className="size-4 shrink-0 text-muted-foreground transition-transform duration-200 group-active:translate-x-1"
            />
          </button>
        ))}
      </section>

      <section aria-labelledby="operator-title" className="mt-1">
        <p className="mb-2 px-1 font-medium text-muted-foreground text-xs">
          Ingin langsung bicara dengan petugas?
        </p>
        <button
          className="citizen-operator-option group flex w-full items-center gap-4 px-4 py-4 text-left"
          onClick={handleOperator}
          type="button"
        >
          <span className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-[inset_0_1px_0_oklch(1_0_0/18%)]">
            <HeadphonesIcon aria-hidden="true" className="size-5" />
          </span>
          <span className="min-w-0 flex-1">
            <span className="block font-semibold text-sm" id="operator-title">
              Operator 112
            </span>
            <span className="mt-1 block text-muted-foreground text-xs">
              Terhubung langsung dengan operator manusia.
            </span>
          </span>
          <ChevronRightIcon
            aria-hidden="true"
            className="size-4 shrink-0 text-primary-100 transition-transform duration-200 group-active:translate-x-1"
          />
        </button>
      </section>
    </MobilePage>
  );
};
