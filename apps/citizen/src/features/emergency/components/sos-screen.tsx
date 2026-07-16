import {
  Alert,
  AlertDescription,
  AlertTitle,
} from "@siaga-app/ui/components/alert";
import { Button } from "@siaga-app/ui/components/button";
import {
  ToggleGroup,
  ToggleGroupItem,
} from "@siaga-app/ui/components/toggle-group";
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
    <MobilePage className="gap-6" title="Mulai SOS">
      <Alert>
        <LocateFixedIcon aria-hidden="true" />
        <AlertTitle>{locationCopy.title}</AlertTitle>
        <AlertDescription>{locationCopy.body}</AlertDescription>
      </Alert>
      <Button
        disabled={locationStatus === "locating"}
        onClick={refreshLocation}
        variant="ghost"
      >
        <RefreshCwIcon data-icon="inline-start" />
        Deteksi ulang lokasi
      </Button>

      <section className="flex flex-col items-center gap-3 text-center">
        <h1 className="text-h3">Tekan untuk SOS</h1>
        <p className="text-muted-foreground text-sm">
          Setelah ini kamu dapat memilih suara, teks, atau mode senyap.
        </p>
        <button
          aria-label="Aktifkan SOS"
          className="citizen-sos-button my-7 flex size-48 items-center justify-center rounded-full border-[12px] border-primary/20 bg-primary font-extrabold text-5xl text-primary-foreground transition-transform active:scale-95"
          onClick={handleSos}
          type="button"
        >
          SOS
        </button>
      </section>

      <fieldset className="citizen-glass-surface flex flex-col gap-3 p-5">
        <legend className="px-2 text-h5">Pilih kategori jika sempat</legend>
        <p className="text-muted-foreground text-xs">Opsional</p>
        <ToggleGroup
          aria-label="Kategori keadaan darurat"
          className="flex flex-wrap justify-start"
          onValueChange={handleCategoryChange}
          value={category ? [category] : []}
        >
          {EMERGENCY_CATEGORIES.map((item) => (
            <ToggleGroupItem aria-label={item} key={item} value={item}>
              {item}
            </ToggleGroupItem>
          ))}
        </ToggleGroup>
      </fieldset>
    </MobilePage>
  );
};
