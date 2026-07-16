import { Button as ButtonPrimitive } from "@base-ui/react/button";
import { cn } from "@siaga-app/ui/lib/utils";
import { cva, type VariantProps } from "class-variance-authority";

const buttonVariants = cva(
  "inline-flex shrink-0 cursor-pointer select-none items-center justify-center gap-2 whitespace-nowrap rounded-xl py-2 font-medium text-m3 shadow-lg outline-none transition-all focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 disabled:pointer-events-none disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 [&_svg:not([class*='size-'])]:size-4 [&_svg]:pointer-events-none [&_svg]:shrink-0",
  {
    defaultVariants: {
      size: "default",
      variant: "primary",
    },
    variants: {
      size: {
        default: "px-4 py-2 has-[>svg]:px-3",
        icon: "size-9",
        "icon-lg": "size-10",
        "icon-sm": "size-8",
        "icon-xs": "size-7 rounded-md",
        lg: "rounded-md px-8 has-[>svg]:px-4",
        md: "gap-1.5 rounded-md px-4 py-1 has-[>svg]:px-2.5",
        sm: "gap-1.5 rounded-md px-3 has-[>svg]:px-2.5",
        xl: "rounded-md px-4 has-[>svg]:px-4",
      },
      variant: {
        destructive:
          "border-2 border-red-200 bg-gradient-to-r from-red-100 to-red-200 text-neutral-100 hover:brightness-110 active:brightness-90",
        ghost:
          "border-2 border-primary-400 bg-transparent text-primary-400 hover:bg-neutral-500/30 active:bg-neutral-500/70",
        link: "text-primary underline-offset-4 hover:underline",
        primary:
          "border-2 border-primary-300 bg-gradient-to-r from-primary-200 to-primary-400 text-primary-foreground hover:brightness-110 active:brightness-90",
        secondary:
          "border-2 border-primary-400 bg-primary-400 text-primary-foreground hover:bg-primary-300 active:bg-primary-500",
        stroke:
          "border-2 border-neutral-100 bg-transparent text-primary-foreground hover:border-neutral-100/70",
      },
    },
  }
);

function Button({
  className,
  variant = "primary",
  size = "default",
  ...props
}: ButtonPrimitive.Props & VariantProps<typeof buttonVariants>) {
  return (
    <ButtonPrimitive
      className={cn(buttonVariants({ className, size, variant }))}
      data-slot="button"
      {...props}
    />
  );
}

export { Button, buttonVariants };
