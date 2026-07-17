import { cn } from "@siaga-app/ui/lib/utils";

interface AgaisMascotProps {
  className?: string;
  mood: "happy" | "sad";
}

export const AgaisMascot = ({ className, mood }: AgaisMascotProps) => (
  <img
    alt=""
    aria-hidden="true"
    className={cn("object-contain", className)}
    decoding="async"
    height={609}
    src={`agais-${mood}.png`}
    width={609}
  />
);
