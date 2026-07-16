import { cn } from "@siaga-app/ui/lib/utils";
import {
  type ComponentProps,
  type ComponentType,
  type CSSProperties,
  createContext,
  type ReactNode,
  useContext,
  useId,
  useMemo,
} from "react";
import {
  type DefaultTooltipContentProps,
  ResponsiveContainer,
  Tooltip,
  type TooltipValueType,
} from "recharts";

const INITIAL_DIMENSION = { height: 200, width: 320 } as const;
type TooltipNameType = number | string;

export type ChartConfig = Record<
  string,
  {
    color?: string;
    icon?: ComponentType;
    label?: ReactNode;
    theme?: {
      dark: string;
      light: string;
    };
  }
>;

interface ChartContextValue {
  config: ChartConfig;
}

type TooltipContentBaseProps = Omit<
  DefaultTooltipContentProps<TooltipValueType, TooltipNameType>,
  "accessibilityLayer"
>;

type TooltipPayloadItem = NonNullable<
  TooltipContentBaseProps["payload"]
>[number];

const ChartContext = createContext<ChartContextValue | null>(null);

const useChart = (): ChartContextValue => {
  const context = useContext(ChartContext);
  if (!context) {
    throw new Error("useChart must be used within a <ChartContainer />");
  }
  return context;
};

const getChartColorStyles = (
  config: ChartConfig,
  style: CSSProperties | undefined
): CSSProperties => {
  const colorStyles: Record<string, string | number> = {};
  for (const [key, itemConfig] of Object.entries(config)) {
    const color =
      itemConfig.color ?? itemConfig.theme?.dark ?? itemConfig.theme?.light;
    if (color) {
      colorStyles[`--color-${key}`] = color;
    }
  }
  return { ...colorStyles, ...style } as CSSProperties;
};

function ChartContainer({
  children,
  className,
  config,
  id,
  initialDimension = INITIAL_DIMENSION,
  style,
  ...props
}: ComponentProps<"div"> & {
  children: ComponentProps<typeof ResponsiveContainer>["children"];
  config: ChartConfig;
  initialDimension?: {
    height: number;
    width: number;
  };
}) {
  const uniqueId = useId();
  const chartId = `chart-${id ?? uniqueId.replaceAll(":", "")}`;
  const chartStyle = useMemo(
    () => getChartColorStyles(config, style),
    [config, style]
  );

  return (
    <ChartContext.Provider value={{ config }}>
      <div
        className={cn(
          "flex aspect-video justify-center text-xs [&_.recharts-cartesian-axis-tick_text]:fill-muted-foreground [&_.recharts-cartesian-grid_line[stroke='#ccc']]:stroke-border/50 [&_.recharts-curve.recharts-tooltip-cursor]:stroke-border [&_.recharts-dot[stroke='#fff']]:stroke-transparent [&_.recharts-layer]:outline-hidden [&_.recharts-rectangle.recharts-tooltip-cursor]:fill-muted [&_.recharts-surface]:outline-hidden",
          className
        )}
        data-chart={chartId}
        data-slot="chart"
        style={chartStyle}
        {...props}
      >
        <ResponsiveContainer initialDimension={initialDimension}>
          {children}
        </ResponsiveContainer>
      </div>
    </ChartContext.Provider>
  );
}

const ChartTooltip = Tooltip;

interface ChartTooltipRowProps {
  color?: string;
  formatter: TooltipContentBaseProps["formatter"];
  hideIndicator: boolean;
  index: number;
  indicator: "dashed" | "dot" | "line";
  item: TooltipPayloadItem;
  itemConfig:
    | {
        color?: string;
        icon?: ComponentType;
        label?: ReactNode;
        theme?: { dark: string; light: string };
      }
    | undefined;
}

function ChartTooltipRow({
  color,
  formatter,
  hideIndicator,
  index,
  indicator,
  item,
  itemConfig,
}: ChartTooltipRowProps) {
  const ItemIcon = itemConfig?.icon;
  const indicatorColor = color ?? item.payload?.fill ?? item.color;
  const hasValue = item.value !== null && item.value !== undefined;
  const canUseFormatter = formatter && hasValue && item.name;

  return (
    <div className="flex w-full items-center gap-2">
      {ItemIcon ? <ItemIcon /> : null}
      {ItemIcon || hideIndicator ? null : (
        <span
          className={cn(
            "shrink-0 rounded-[2px] border-(--color-border) bg-(--color-bg)",
            indicator === "dot" && "size-2.5",
            indicator === "line" && "h-3 w-1",
            indicator === "dashed" &&
              "h-3 w-0 border-[1.5px] border-dashed bg-transparent"
          )}
          style={
            {
              "--color-bg": indicatorColor,
              "--color-border": indicatorColor,
            } as CSSProperties
          }
        />
      )}
      {canUseFormatter ? (
        formatter(item.value, item.name, item, index, item.payload)
      ) : (
        <span className="flex min-w-0 flex-1 items-center justify-between gap-4">
          <span className="truncate text-muted-foreground">
            {itemConfig?.label ?? item.name}
          </span>
          {hasValue ? (
            <span className="font-medium font-mono text-foreground tabular-nums">
              {typeof item.value === "number"
                ? item.value.toLocaleString("id-ID")
                : String(item.value)}
            </span>
          ) : null}
        </span>
      )}
    </div>
  );
}

function getPayloadConfig(
  config: ChartConfig,
  item: TooltipPayloadItem,
  nameKey: string | undefined
) {
  const configKey = `${nameKey ?? item.name ?? item.dataKey ?? "value"}`;
  return config[configKey];
}

function ChartTooltipContent({
  active,
  className,
  color,
  formatter,
  hideIndicator = false,
  hideLabel = false,
  indicator = "dot",
  label,
  labelClassName,
  labelFormatter,
  nameKey,
  payload,
}: ComponentProps<typeof Tooltip> &
  ComponentProps<"div"> & {
    hideIndicator?: boolean;
    hideLabel?: boolean;
    indicator?: "dashed" | "dot" | "line";
    nameKey?: string;
  } & TooltipContentBaseProps) {
  const { config } = useChart();
  if (!(active && payload?.length)) {
    return null;
  }

  const visiblePayload = payload.filter((item) => item.type !== "none");
  const formattedLabel = labelFormatter
    ? labelFormatter(label, payload)
    : label;

  return (
    <div
      className={cn(
        "grid min-w-36 gap-2 rounded-md border border-border/50 bg-background px-3 py-2 text-xs shadow-xl",
        className
      )}
    >
      {hideLabel || !formattedLabel ? null : (
        <div className={cn("font-medium text-foreground", labelClassName)}>
          {formattedLabel}
        </div>
      )}
      <div className="grid gap-1.5">
        {visiblePayload.map((item, index) => {
          const stableKey = `${String(item.dataKey ?? item.name ?? "value")}-${String(item.value ?? "")}`;
          return (
            <ChartTooltipRow
              color={color}
              formatter={formatter}
              hideIndicator={hideIndicator}
              index={index}
              indicator={indicator}
              item={item}
              itemConfig={getPayloadConfig(config, item, nameKey)}
              key={stableKey}
            />
          );
        })}
      </div>
    </div>
  );
}

export { ChartContainer, ChartTooltip, ChartTooltipContent };
