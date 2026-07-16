import type {
  DashboardAgencyType,
  DashboardFlowPoint,
  DashboardIncidentBreakdownItem,
  DashboardOverview,
  DashboardPeriod,
  DashboardSnapshot,
  DashboardUnitReadinessItem,
} from "../domain/entities";

const HOUR_MS = 60 * 60 * 1000;
const DAY_MS = 24 * HOUR_MS;
const JAKARTA_OFFSET_MS = 7 * HOUR_MS;
const ATTENTION_QUEUE_LIMIT = 5;

const PERIOD_CONFIG: Record<
  DashboardPeriod,
  { bucketCount: number; bucketDurationMs: number }
> = {
  "7D": { bucketCount: 7, bucketDurationMs: DAY_MS },
  "24H": { bucketCount: 24, bucketDurationMs: HOUR_MS },
  "30D": { bucketCount: 30, bucketDurationMs: DAY_MS },
};

const CATEGORY_RANK = {
  CRITICAL: 5,
  HIGH: 4,
  LOW: 2,
  MEDIUM: 3,
  UNCATEGORIZED: 1,
} as const;

const AGENCY_TYPES: DashboardAgencyType[] = [
  "POLICE",
  "AMBULANCE",
  "FIRE_DEPARTMENT",
  "SAR",
  "OTHER",
];

export interface DashboardPeriodWindow {
  bucketCount: number;
  bucketDurationMs: number;
  currentPeriodStart: Date;
  previousPeriodStart: Date;
}

export const getDashboardPeriodWindow = (
  period: DashboardPeriod,
  now: Date
): DashboardPeriodWindow => {
  const { bucketCount, bucketDurationMs } = PERIOD_CONFIG[period];
  const shiftedNow = now.getTime() + JAKARTA_OFFSET_MS;
  const currentBucketStart =
    Math.floor(shiftedNow / bucketDurationMs) * bucketDurationMs -
    JAKARTA_OFFSET_MS;
  const currentPeriodStart =
    currentBucketStart - (bucketCount - 1) * bucketDurationMs;

  return {
    bucketCount,
    bucketDurationMs,
    currentPeriodStart: new Date(currentPeriodStart),
    previousPeriodStart: new Date(
      currentPeriodStart - bucketCount * bucketDurationMs
    ),
  };
};

export const calculateMedian = (values: number[]): number | null => {
  if (values.length === 0) {
    return null;
  }

  const sortedValues = [...values].sort((first, second) => first - second);
  const middleIndex = Math.floor(sortedValues.length / 2);
  if (sortedValues.length % 2 === 1) {
    return sortedValues[middleIndex] ?? null;
  }

  const lowerValue = sortedValues[middleIndex - 1] ?? 0;
  const upperValue = sortedValues[middleIndex] ?? 0;
  return Math.round((lowerValue + upperValue) / 2);
};

const calculateDeltaPercent = (
  currentValue: number | null,
  previousValue: number | null
): number | null => {
  if (currentValue === null || previousValue === null || previousValue === 0) {
    return null;
  }

  return Math.round(((currentValue - previousValue) / previousValue) * 100);
};

const isWithinPeriod = (
  value: Date,
  periodStart: Date,
  periodEnd: Date
): boolean => value >= periodStart && value <= periodEnd;

const getBucketStart = (value: Date, bucketDurationMs: number): number => {
  const shiftedValue = value.getTime() + JAKARTA_OFFSET_MS;
  return (
    Math.floor(shiftedValue / bucketDurationMs) * bucketDurationMs -
    JAKARTA_OFFSET_MS
  );
};

const buildFlow = ({
  bucketCount,
  bucketDurationMs,
  currentPeriodStart,
  reports,
}: DashboardPeriodWindow & {
  reports: DashboardSnapshot["reports"];
}): DashboardFlowPoint[] => {
  const buckets = Array.from({ length: bucketCount }, (_, index) => {
    const bucketStart = currentPeriodStart.getTime() + index * bucketDurationMs;
    return {
      bucketStart: new Date(bucketStart).toISOString(),
      incoming: 0,
      resolved: 0,
    };
  });
  const bucketByStart = new Map(
    buckets.map((bucket) => [new Date(bucket.bucketStart).getTime(), bucket])
  );

  for (const report of reports) {
    const incomingBucket = bucketByStart.get(
      getBucketStart(report.createdAt, bucketDurationMs)
    );
    if (incomingBucket) {
      incomingBucket.incoming += 1;
    }

    if (report.resolvedAt) {
      const resolvedBucket = bucketByStart.get(
        getBucketStart(report.resolvedAt, bucketDurationMs)
      );
      if (resolvedBucket) {
        resolvedBucket.resolved += 1;
      }
    }
  }

  return buckets;
};

const buildIncidentBreakdown = ({
  currentPeriodStart,
  now,
  reports,
}: {
  currentPeriodStart: Date;
  now: Date;
  reports: DashboardSnapshot["reports"];
}): DashboardIncidentBreakdownItem[] => {
  const counts = new Map<
    DashboardIncidentBreakdownItem["incidentType"],
    number
  >();

  for (const report of reports) {
    if (!isWithinPeriod(report.createdAt, currentPeriodStart, now)) {
      continue;
    }
    const incidentType = report.incidentType ?? "UNCLASSIFIED";
    counts.set(incidentType, (counts.get(incidentType) ?? 0) + 1);
  }

  return [...counts.entries()]
    .map(([incidentType, count]) => ({ count, incidentType }))
    .sort((first, second) => second.count - first.count);
};

const buildUnitReadiness = (
  agencies: DashboardSnapshot["agencies"]
): DashboardUnitReadinessItem[] => {
  const readinessByType = new Map(
    AGENCY_TYPES.map((type) => [
      type,
      {
        activeDispatches: 0,
        available: 0,
        busy: 0,
        offline: 0,
        total: 0,
        type,
      },
    ])
  );

  for (const agency of agencies) {
    const readiness = readinessByType.get(agency.type);
    if (!readiness) {
      continue;
    }
    readiness.total += 1;
    readiness.activeDispatches += agency.activeDispatches;
    if (agency.availability === "AVAILABLE") {
      readiness.available += 1;
    } else if (agency.availability === "BUSY") {
      readiness.busy += 1;
    } else {
      readiness.offline += 1;
    }
  }

  return [...readinessByType.values()].filter((item) => item.total > 0);
};

export const buildDashboardOverview = ({
  now,
  period,
  snapshot,
}: {
  now: Date;
  period: DashboardPeriod;
  snapshot: DashboardSnapshot;
}): DashboardOverview => {
  const window = getDashboardPeriodWindow(period, now);
  const previousPeriodEnd = new Date(window.currentPeriodStart.getTime() - 1);
  const currentReports = snapshot.reports.filter((report) =>
    isWithinPeriod(report.createdAt, window.currentPeriodStart, now)
  );
  const previousReports = snapshot.reports.filter((report) =>
    isWithinPeriod(
      report.createdAt,
      window.previousPeriodStart,
      previousPeriodEnd
    )
  );
  const currentResolved = snapshot.reports.filter(
    (report) =>
      report.resolvedAt &&
      isWithinPeriod(report.resolvedAt, window.currentPeriodStart, now)
  );
  const previousResolved = snapshot.reports.filter(
    (report) =>
      report.resolvedAt &&
      isWithinPeriod(
        report.resolvedAt,
        window.previousPeriodStart,
        previousPeriodEnd
      )
  );
  const currentResponseTimes = snapshot.dispatches
    .filter((dispatch) =>
      isWithinPeriod(dispatch.requestedAt, window.currentPeriodStart, now)
    )
    .map((dispatch) =>
      Math.max(
        0,
        Math.round(
          (dispatch.arrivedAt.getTime() - dispatch.requestedAt.getTime()) / 1000
        )
      )
    );
  const previousResponseTimes = snapshot.dispatches
    .filter((dispatch) =>
      isWithinPeriod(
        dispatch.requestedAt,
        window.previousPeriodStart,
        previousPeriodEnd
      )
    )
    .map((dispatch) =>
      Math.max(
        0,
        Math.round(
          (dispatch.arrivedAt.getTime() - dispatch.requestedAt.getTime()) / 1000
        )
      )
    );
  const medianResponseSeconds = calculateMedian(currentResponseTimes);
  const previousMedianResponseSeconds = calculateMedian(previousResponseTimes);
  const availableUnits = snapshot.agencies.filter(
    (agency) => agency.availability === "AVAILABLE"
  ).length;

  return {
    attentionQueue: [...snapshot.activeReports]
      .sort((first, second) => {
        const categoryDifference =
          CATEGORY_RANK[second.category] - CATEGORY_RANK[first.category];
        return categoryDifference === 0
          ? first.createdAt.getTime() - second.createdAt.getTime()
          : categoryDifference;
      })
      .slice(0, ATTENTION_QUEUE_LIMIT)
      .map((report) => ({
        ...report,
        ageMinutes: Math.max(
          0,
          Math.floor((now.getTime() - report.createdAt.getTime()) / 60_000)
        ),
        createdAt: report.createdAt.toISOString(),
      })),
    flow: buildFlow({
      ...window,
      reports: snapshot.reports,
    }),
    generatedAt: now.toISOString(),
    incidentBreakdown: buildIncidentBreakdown({
      currentPeriodStart: window.currentPeriodStart,
      now,
      reports: snapshot.reports,
    }),
    period,
    recentActivity: snapshot.statusEvents.map((event) => ({
      category: event.report.category,
      createdAt: event.createdAt.toISOString(),
      id: event.id,
      note: event.note,
      reportId: event.report.id,
      reportTitle: event.report.title,
      toStatus: event.toStatus,
    })),
    summary: {
      activeTotal: snapshot.activeReports.length,
      availableUnits,
      awaitingReview: snapshot.activeReports.filter(
        (report) => report.status === "READY_FOR_REVIEW"
      ).length,
      incomingDeltaPercent: calculateDeltaPercent(
        currentReports.length,
        previousReports.length
      ),
      incomingInPeriod: currentReports.length,
      medianResponseDeltaPercent: calculateDeltaPercent(
        medianResponseSeconds,
        previousMedianResponseSeconds
      ),
      medianResponseSeconds,
      resolvedDeltaPercent: calculateDeltaPercent(
        currentResolved.length,
        previousResolved.length
      ),
      resolvedInPeriod: currentResolved.length,
      totalUnits: snapshot.agencies.length,
      urgentActive: snapshot.activeReports.filter(
        (report) => report.category === "CRITICAL" || report.category === "HIGH"
      ).length,
    },
    unitReadiness: buildUnitReadiness(snapshot.agencies),
  };
};
