import { Button } from "@siaga-app/ui/components/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@siaga-app/ui/components/dropdown-menu";
import { Layers, Palette } from "lucide-react";
import { useTheme } from "next-themes";
import { useCallback } from "react";

export function ModeToggle() {
  const { setTheme } = useTheme();

  const handleSetLight = useCallback(() => setTheme("light"), [setTheme]);
  const handleSetDark = useCallback(() => setTheme("dark"), [setTheme]);
  const handleSetSemiTransparent = useCallback(
    () => setTheme("semi-transparent"),
    [setTheme]
  );
  const handleSetSystem = useCallback(() => setTheme("system"), [setTheme]);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <Button
            aria-label="Pilih tampilan"
            className="h-9 min-w-32 rounded-lg border border-border bg-transparent px-3 font-semibold text-foreground text-xs shadow-none backdrop-blur-md hover:bg-muted focus-visible:ring-1 focus-visible:ring-ring/40"
            size="sm"
            variant="ghost"
          />
        }
      >
        <Palette aria-hidden />
        <span>Pilih tampilan</span>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuGroup>
          <DropdownMenuItem onClick={handleSetLight}>Light</DropdownMenuItem>
          <DropdownMenuItem onClick={handleSetDark}>Dark</DropdownMenuItem>
          <DropdownMenuItem onClick={handleSetSemiTransparent}>
            <Layers aria-hidden />
            Semi transparan
          </DropdownMenuItem>
          <DropdownMenuItem onClick={handleSetSystem}>System</DropdownMenuItem>
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
