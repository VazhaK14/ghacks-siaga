import type { PropsWithChildren } from "react";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
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

const INCIDENT_STORAGE_KEY = "siaga:active-incident:v1";
const INITIAL_INCIDENT: IncidentState = {
  category: null,
  connectionTarget: "ai",
  idempotencyKey: null,
  location: null,
  mode: null,
  reportId: null,
};

const readStoredIncident = (): IncidentState => {
  try {
    const stored = window.sessionStorage.getItem(INCIDENT_STORAGE_KEY);
    return stored ? (JSON.parse(stored) as IncidentState) : INITIAL_INCIDENT;
  } catch {
    return INITIAL_INCIDENT;
  }
};

const IncidentContext = createContext<IncidentContextValue | null>(null);

export const IncidentProvider = ({ children }: PropsWithChildren) => {
  const [incident, setIncident] = useState<IncidentState>(readStoredIncident);

  useEffect(() => {
    window.sessionStorage.setItem(
      INCIDENT_STORAGE_KEY,
      JSON.stringify(incident)
    );
  }, [incident]);

  const setCategory = useCallback((category: EmergencyCategory) => {
    setIncident((current) => ({ ...current, category }));
  }, []);
  const beginIncident = useCallback(() => {
    setIncident((current) => ({
      ...current,
      idempotencyKey: `report-${crypto.randomUUID()}`,
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
};

export const useIncident = (): IncidentContextValue => {
  const context = useContext(IncidentContext);
  if (!context) {
    throw new Error("useIncident must be used within IncidentProvider");
  }
  return context;
};
