import { Badge } from "@siaga-app/ui/components/badge";
import { Button } from "@siaga-app/ui/components/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@siaga-app/ui/components/card";
import {
  AlertTriangleIcon,
  ArrowRightIcon,
  UserRoundPlusIcon,
} from "lucide-react";
import { useMemo } from "react";
import { useNavigate } from "react-router";

import { MobilePage } from "@/components/mobile-page";
import { useReporterProfileQuery } from "@/features/profile/api";
import { authClient } from "@/lib/auth-client";

import { useReporterReportsQuery } from "../api";
import { ACTIVE_REPORT_STATUSES } from "../derive-phase";
import { REPORT_STATUS_LABELS } from "../status-content";

const MORNING_END = 11;
const AFTERNOON_END = 15;
const EVENING_END = 19;

const getGreeting = (): string => {
  const hour = new Date().getHours();
  if (hour < MORNING_END) {
    return "Selamat pagi";
  }
  if (hour < AFTERNOON_END) {
    return "Selamat siang";
  }
  if (hour < EVENING_END) {
    return "Selamat sore";
  }
  return "Selamat malam";
};

export const HomeScreen = () => {
  const navigate = useNavigate();
  const session = authClient.useSession();
  const reportsQuery = useReporterReportsQuery();
  const profileQuery = useReporterProfileQuery();
  const activeReport = useMemo(
    () =>
      reportsQuery.data?.find((report) =>
        ACTIVE_REPORT_STATUSES.has(report.status)
      ) ?? null,
    [reportsQuery.data]
  );
  const hasCompleteProfile = Boolean(
    profileQuery.data?.fullName &&
      profileQuery.data.age &&
      profileQuery.data.address &&
      profileQuery.data.contactName &&
      profileQuery.data.contactPhone
  );
  const firstName = session.data?.user.name?.split(" ")[0];

  const handleViewStatus = () => {
    if (!activeReport) {
      return;
    }
    navigate(`/status?reportId=${encodeURIComponent(activeReport.id)}`);
  };
  const handleStartSos = () => navigate("/sos");
  const handleOpenProfile = () => navigate("/profile");

  return (
    <MobilePage className="gap-5" title="Beranda SIAGA">
      <header className="flex flex-col gap-1">
        <p className="text-muted-foreground text-sm">
          {getGreeting()}
          {firstName ? `, ${firstName}` : ""}
        </p>
        <h1 className="text-h3">Siaga saat kamu membutuhkan</h1>
      </header>

      {activeReport ? (
        <Card>
          <CardHeader>
            <CardTitle>
              {activeReport.title ??
                `Laporan ${activeReport.id.slice(0, 8).toUpperCase()}`}
            </CardTitle>
            <CardDescription>
              Laporan sedang aktif dan terus diperbarui.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            <Badge>{REPORT_STATUS_LABELS[activeReport.status]}</Badge>
            <p className="text-muted-foreground text-sm">
              {activeReport.summary ??
                "Petugas sedang memproses laporan darurat kamu."}
            </p>
          </CardContent>
          <CardFooter>
            <Button onClick={handleViewStatus}>
              Lihat status
              <ArrowRightIcon data-icon="inline-end" />
            </Button>
          </CardFooter>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Butuh bantuan sekarang?</CardTitle>
            <CardDescription>
              Lokasi akan dideteksi dan kamu dapat memilih cara melapor yang
              paling aman.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex justify-center py-3">
            <button
              aria-label="Mulai laporan SOS"
              className="citizen-sos-button flex size-40 items-center justify-center rounded-full border-8 border-primary/20 bg-primary text-h1 text-primary-foreground transition-transform active:scale-95"
              onClick={handleStartSos}
              type="button"
            >
              SOS
            </button>
          </CardContent>
        </Card>
      )}

      {profileQuery.isPending || hasCompleteProfile ? null : (
        <Card>
          <CardHeader>
            <CardTitle>Lengkapi profil darurat</CardTitle>
            <CardDescription>
              Data medis dan kontak membantu petugas bertindak lebih cepat.
            </CardDescription>
          </CardHeader>
          <CardFooter>
            <Button onClick={handleOpenProfile} variant="ghost">
              <UserRoundPlusIcon data-icon="inline-start" />
              Lengkapi sekarang
            </Button>
          </CardFooter>
        </Card>
      )}

      <section aria-labelledby="tips-title" className="flex flex-col gap-3">
        <h2 className="text-h5" id="tips-title">
          Saat melapor
        </h2>
        <div className="citizen-glass-surface flex gap-3 p-4">
          <AlertTriangleIcon
            aria-hidden="true"
            className="size-5 shrink-0 text-primary"
          />
          <p className="text-muted-foreground text-sm">
            Utamakan keselamatan. Gunakan mode senyap bila suara dapat
            membahayakanmu.
          </p>
        </div>
      </section>
    </MobilePage>
  );
};
