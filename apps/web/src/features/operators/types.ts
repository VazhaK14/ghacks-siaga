import { z } from "zod";

export const createOperatorSchema = z.object({
  email: z.email("Invalid email address"),
  name: z.string().min(2, "Name must be at least 2 characters"),
  password: z.string().min(8, "Password must be at least 8 characters"),
});

export type CreateOperatorInput = z.infer<typeof createOperatorSchema>;

export interface Operator {
  banned: boolean | null;
  createdAt: Date;
  email: string;
  id: string;
  name: string;
  role: string;
}

export interface OperatorPage {
  items: Operator[];
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}
