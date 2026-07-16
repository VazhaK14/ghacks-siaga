import { Button } from "@siaga-app/ui/components/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@siaga-app/ui/components/sheet";
import { SirenIcon } from "lucide-react";
import { useCallback, useState } from "react";

import { useMapWorkspace } from "@/features/map/components/map-workspace";
import { AgencyBoardPanel } from "./agency-board-panel";

export function UnitResponseScreen() {
  const { onSelectAgency, selectedAgencyId } = useMapWorkspace();
  const [mobileOpen, setMobileOpen] = useState(false);
  const handleOpen = useCallback(() => {
    setMobileOpen(true);
  }, []);
  const handleOpenChange = useCallback((open: boolean) => {
    setMobileOpen(open);
  }, []);
  const handleMobileSelect = useCallback(
    (agencyId: string) => {
      onSelectAgency(agencyId);
      setMobileOpen(false);
    },
    [onSelectAgency]
  );

  return (
    <div className="relative size-full">
      <AgencyBoardPanel
        className="pointer-events-auto absolute inset-y-4 left-[16rem] hidden w-[22rem] xl:flex"
        onSelectAgency={onSelectAgency}
        selectedAgencyId={selectedAgencyId}
      />

      <Button
        className="pointer-events-auto absolute top-3 left-14 md:left-[16rem] xl:hidden"
        onClick={handleOpen}
        size="sm"
        type="button"
        variant="secondary"
      >
        <SirenIcon data-icon="inline-start" />
        Unit Respons
      </Button>

      <Sheet onOpenChange={handleOpenChange} open={mobileOpen}>
        <SheetContent className="h-[76svh]! max-h-[76svh] p-0" side="bottom">
          <SheetHeader className="sr-only">
            <SheetTitle>Unit Respons</SheetTitle>
            <SheetDescription>
              Daftar kantor dan unit respons yang tersedia.
            </SheetDescription>
          </SheetHeader>
          <AgencyBoardPanel
            className="size-full rounded-none bg-transparent shadow-none ring-0 backdrop-blur-none"
            onSelectAgency={handleMobileSelect}
            selectedAgencyId={selectedAgencyId}
          />
        </SheetContent>
      </Sheet>
    </div>
  );
}
