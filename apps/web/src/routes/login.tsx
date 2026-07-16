import { useEffect } from "react";
import { useSearchParams } from "react-router";
import { toast } from "sonner";

import { LoginForm } from "@/features/auth/components/login-form";
import { LoginShell } from "@/features/auth/components/login-shell";
import { redirectIfAuthenticated } from "@/features/auth/guards";

import type { Route } from "./+types/login";

export function loader({ request }: Route.LoaderArgs) {
  return redirectIfAuthenticated(request);
}

export default function Login() {
  const [searchParams] = useSearchParams();

  useEffect(() => {
    if (searchParams.get("error") === "not-operator") {
      toast.error("Akun ini bukan akun operator");
    }
  }, [searchParams]);

  return (
    <LoginShell>
      <LoginForm />
    </LoginShell>
  );
}
