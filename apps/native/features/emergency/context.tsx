import type { PropsWithChildren } from "react";
import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
} from "react";

import type {
  ConnectionTarget,
  EmergencyCategory,
  IncidentContextValue,
  IncidentLocation,
  IncidentState,
  ReportMode,
} from "./types";

const INITIAL_INCIDENT: IncidentState = {
  category: null,
  connectionTarget: "ai",
  idempotencyKey: null,
  location: null,
  mode: null,
  reportId: null,
};

const IncidentContext = createContext<IncidentContextValue | null>(null);

export function IncidentProvider({ children }: PropsWithChildren) {
  const [incident, setIncident] = useState<IncidentState>(INITIAL_INCIDENT);

  const setCategory = useCallback((category: EmergencyCategory) => {
    setIncident((current) => ({ ...current, category }));
  }, []);

  const beginIncident = useCallback(() => {
    setIncident((current) => ({
      ...current,
      idempotencyKey: `report-${Date.now()}-${Math.random().toString(36).slice(2)}`,
    }));
  }, []);

  const setMode = useCallback((mode: ReportMode) => {
    setIncident((current) => ({ ...current, mode }));
  }, []);

  const setConnectionTarget = useCallback((target: ConnectionTarget) => {
    setIncident((current) => ({ ...current, connectionTarget: target }));
  }, []);

  const setLocation = useCallback((location: IncidentLocation) => {
    setIncident((current) => ({ ...current, location }));
  }, []);

  const setReportId = useCallback((reportId: string) => {
    setIncident((current) => ({ ...current, reportId }));
  }, []);

  const cancelIncident = useCallback(() => {
    setIncident(INITIAL_INCIDENT);
  }, []);

  const value = useMemo(
    () => ({
      ...incident,
      beginIncident,
      cancelIncident,
      setCategory,
      setConnectionTarget,
      setLocation,
      setMode,
      setReportId,
    }),
    [
      incident,
      beginIncident,
      cancelIncident,
      setCategory,
      setConnectionTarget,
      setLocation,
      setMode,
      setReportId,
    ]
  );

  return (
    <IncidentContext.Provider value={value}>
      {children}
    </IncidentContext.Provider>
  );
}

export function useIncident() {
  const context = useContext(IncidentContext);
  if (!context) {
    throw new Error("useIncident must be used within IncidentProvider");
  }
  return context;
}
