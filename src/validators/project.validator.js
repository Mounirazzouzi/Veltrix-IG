import { z } from "zod";

export const projectSchema = z.object({
  full_name: z.string().trim().min(2).max(100),

  email: z.string().trim().email().max(150),

  phone: z.string().trim().min(6).max(30),

  subject_project: z.string().trim().min(2).max(100),

  descripton_pr: z.string().trim().min(30).max(6000),

  price_pr: z.string().trim().min(1).max(100),
});