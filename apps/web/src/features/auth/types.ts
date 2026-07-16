import { z } from "zod";

export const loginSchema = z.object({
  email: z.email("Invalid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
});

export type LoginInput = z.infer<typeof loginSchema>;

export interface SessionUser {
  email: string;
  id: string;
  name: string;
  role: "REPORTER" | "OPERATOR";
}

export interface SessionCheckResult {
  session: { id: string } | null;
  user: SessionUser | null;
}
