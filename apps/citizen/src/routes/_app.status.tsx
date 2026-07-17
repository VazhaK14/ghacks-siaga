import { Navigate, useSearchParams } from "react-router";
import { StatusScreen } from "@/features/emergency/components/status-screen";

export default function StatusRoute() {
  const [searchParams] = useSearchParams();
  if (!searchParams.get("reportId")) {
    return <Navigate replace to="/history" />;
  }
  return <StatusScreen />;
}
