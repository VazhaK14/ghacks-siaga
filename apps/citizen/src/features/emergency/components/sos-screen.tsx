import { Button } from "@siaga-app/ui/components/button";
import {
  ToggleGroup,
  ToggleGroupItem,
} from "@siaga-app/ui/components/toggle-group";
import { cn } from "@siaga-app/ui/lib/utils";
import { LocateFixedIcon, RefreshCwIcon } from "lucide-react";
import { useNavigate } from "react-router";

import { MobilePage } from "@/components/mobile-page";
import {
  type LocationStatus,
  useCurrentLocation,
} from "@/lib/use-current-location";

import { EMERGENCY_CATEGORIES } from "../content";
import { useIncident } from "../context";
import type { EmergencyCategory } from "../types";

const LOCATION_COPY: Record<
  Exclude<LocationStatus, "ready">,
  { body: string; title: string }
> = {
  denied: {
    body: "Izinkan lokasi di pengaturan browser, lalu coba lagi.",
    title: "Izin lokasi dibutuhkan",
  },
  disabled: {
    body: "Aktifkan GPS perangkat, lalu coba kembali.",
    title: "GPS tidak aktif",
  },
  error: {
    body: "Lokasi belum ditemukan. Kamu tetap dapat membuat laporan.",
    title: "Lokasi belum tersedia",
  },
  locating: {
    body: "SIAGA sedang mencari posisi perangkat kamu.",
    title: "Mendeteksi lokasi...",
  },
};

const isEmergencyCategory = (value: string): value is EmergencyCategory =>
  EMERGENCY_CATEGORIES.some((category) => category === value);

export const SosScreen = () => {
  const navigate = useNavigate();
  const { beginIncident, category, setCategory, setLocation } = useIncident();
  const {
    location,
    refreshLocation,
    status: locationStatus,
  } = useCurrentLocation({ onLocationResolved: setLocation });
  const resolvedLocationCopy = location
    ? location.address
    : "Koordinat lokasi berhasil diperoleh.";
  const locationCopy =
    locationStatus === "ready"
      ? {
          body: resolvedLocationCopy,
          title: "Lokasi terdeteksi",
        }
      : LOCATION_COPY[locationStatus];
  const isLocationReady = locationStatus === "ready";
  const isLocating = locationStatus === "locating";

  const handleSos = () => {
    beginIncident();
    navigate("/report-mode");
  };
  const handleCategoryChange = (values: string[]) => {
    const [selected] = values;
    if (selected && isEmergencyCategory(selected)) {
      setCategory(selected);
    }
  };

  return (
    <MobilePage className="gap-5" title="Mulai SOS">
      <section className="citizen-sos-stage flex flex-col items-center px-5 pt-8 pb-7 text-center">
        <span className="mb-3 rounded-full border border-border bg-card px-3 py-1 font-semibold text-[0.625rem] text-muted-foreground tracking-[0.18em]">
          SIAGA 24 JAM
        </span>
        <h1 className="text-h2">Butuh bantuan?</h1>
        <p className="mt-2 max-w-xs text-muted-foreground text-sm">
          Tekan SOS untuk terhubung dengan bantuan darurat.
        </p>

        <div className="citizen-sos-control relative my-8 flex items-center justify-center">
          <span
            aria-hidden="true"
            className="citizen-sos-orbit absolute rounded-full"
          />
          <span
            aria-hidden="true"
            className="citizen-sos-pulse-ring absolute rounded-full"
          />
          <div className="citizen-sos-heartbeat relative flex items-center justify-center">
            <button
              aria-describedby="sos-button-hint"
              aria-label="Aktifkan SOS"
              className="citizen-sos-button flex size-full items-center justify-center rounded-full text-primary-foreground transition-transform duration-200 active:scale-95"
              onClick={handleSos}
              type="button"
            >
              <span className="citizen-sos-label flex flex-col items-center">
                <span className="font-medium text-[0.625rem] text-white/65 tracking-[0.22em]">
                  TEKAN
                </span>
                <span className="font-extrabold text-5xl tracking-[0.04em]">
                  SOS
                </span>
              </span>
            </button>
          </div>
        </div>

        <p
          className="flex items-center gap-2 font-medium text-xs"
          id="sos-button-hint"
        >
          <span
            aria-hidden="true"
            className="size-1.5 rounded-full bg-success shadow-[0_0_0_4px_color-mix(in_oklch,var(--success)_18%,transparent)]"
          />
          Sentuh sekali untuk memulai
        </p>
      </section>

      <section
        aria-live="polite"
        className="citizen-glass-surface flex items-center gap-3 p-4"
      >
        <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-muted">
          <LocateFixedIcon
            aria-hidden="true"
            className={cn(
              "size-5",
              isLocationReady ? "text-success" : "text-primary-300"
            )}
          />
        </div>
        <div className="min-w-0 flex-1">
          <h2 className="font-semibold text-sm">{locationCopy.title}</h2>
          <p className="line-clamp-2 text-muted-foreground text-xs">
            {locationCopy.body}
          </p>
        </div>
        <Button
          aria-label="Deteksi ulang lokasi"
          disabled={isLocating}
          onClick={refreshLocation}
          size="icon-sm"
          variant="ghost"
        >
          <RefreshCwIcon
            aria-hidden="true"
            className={cn(isLocating && "animate-spin")}
          />
        </Button>
      </section>

      <fieldset className="citizen-glass-surface flex flex-col gap-3 p-4">
        <legend className="px-2 font-semibold text-sm">
          Kategori <span className="text-muted-foreground">· opsional</span>
        </legend>
        <ToggleGroup
          aria-label="Kategori keadaan darurat"
          className="flex w-full flex-wrap justify-start gap-2"
          onValueChange={handleCategoryChange}
          value={category ? [category] : []}
        >
          {EMERGENCY_CATEGORIES.map((item) => (
            <ToggleGroupItem
              aria-label={item}
              className="rounded-full border border-border bg-muted/40 px-3 text-muted-foreground text-xs shadow-none data-[pressed]:border-primary-300 data-[pressed]:bg-primary/15 data-[pressed]:text-primary-300"
              key={item}
              value={item}
            >
              {item}
            </ToggleGroupItem>
          ))}
        </ToggleGroup>
      </fieldset>
    </MobilePage>
  );
};
