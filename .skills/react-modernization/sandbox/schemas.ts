import { z } from 'zod';

// Pillar 2: Bulletproof Validations (Standardization)
// A unified Zod schema that powers BOTH real-time client validation (React Hook Form) 
// and secure server-side mutation checks (Server Actions).
export const DemoFormSchema = z.object({
  username: z.string().min(3, { message: "Username must be at least 3 characters." }),
  email: z.string().email({ message: "Invalid email address." }),
  notificationPreference: z.enum(["all", "mentions", "none"]),
});

export type DemoFormValues = z.infer<typeof DemoFormSchema>;
