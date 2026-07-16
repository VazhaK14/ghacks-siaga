import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@siaga-app/ui/components/card";
import { ConstructionIcon } from "lucide-react";

export function ComingSoon({ title }: { title: string }) {
  return (
    <div className="pointer-events-none absolute inset-0">
      <Card className="pointer-events-auto absolute top-16 right-3 left-3 rounded-md bg-popover/95 shadow-xl backdrop-blur-sm md:top-4 md:right-auto md:left-[16rem] md:w-[22rem]">
        <CardHeader>
          <span className="mb-2 flex size-9 items-center justify-center rounded-md bg-primary-10 text-primary-300">
            <ConstructionIcon aria-hidden className="size-4" />
          </span>
          <CardTitle>{title}</CardTitle>
          <CardDescription>
            Fitur ini sedang disiapkan dan akan tersedia pada pembaruan
            berikutnya.
          </CardDescription>
        </CardHeader>
      </Card>
    </div>
  );
}
