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
  IncidentPhase,
  IncidentState,
  ReportMode,
} from "./types";

const INITIAL_INCIDENT: IncidentState = {
  category: "Kriminal",
  connectionTarget: "ai",
  location: null,
  mode: null,
  phase: "idle",
};

const IncidentContext = createContext<IncidentContextValue | null>(null);

export function IncidentProvider({ children }: PropsWithChildren) {
  const [incident, setIncident] = useState<IncidentState>(INITIAL_INCIDENT);

  const setCategory = useCallback((category: EmergencyCategory) => {
    setIncident((current) => ({ ...current, category }));
  }, []);

  const beginIncident = useCallback(() => {
    setIncident((current) => ({ ...current, phase: "choosing-mode" }));
  }, []);

  const setMode = useCallback((mode: ReportMode) => {
    setIncident((current) => ({ ...current, mode, phase: "connecting" }));
  }, []);

  const setConnectionTarget = useCallback((target: ConnectionTarget) => {
    setIncident((current) => ({ ...current, connectionTarget: target }));
  }, []);

  const setLocation = useCallback((location: IncidentLocation) => {
    setIncident((current) => ({ ...current, location }));
  }, []);

  const setPhase = useCallback((phase: IncidentPhase) => {
    setIncident((current) => ({ ...current, phase }));
  }, []);

  const cancelIncident = useCallback(() => {
    setIncident(INITIAL_INCIDENT);
  }, []);

  const completeIncident = useCallback(() => {
    setIncident((current) => ({ ...current, phase: "completed" }));
  }, []);

  const value = useMemo(
    () => ({
      ...incident,
      beginIncident,
      cancelIncident,
      completeIncident,
      setCategory,
      setConnectionTarget,
      setLocation,
      setMode,
      setPhase,
    }),
    [
      incident,
      beginIncident,
      cancelIncident,
      completeIncident,
      setCategory,
      setConnectionTarget,
      setLocation,
      setMode,
      setPhase,
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
