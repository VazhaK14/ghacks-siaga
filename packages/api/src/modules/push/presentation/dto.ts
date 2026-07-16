import { z } from "zod";

export const savePushSubscriptionInputSchema = z.object({
  auth: z.string().min(1),
  endpoint: z.url(),
  expirationTime: z.iso.datetime().nullable(),
  p256dh: z.string().min(1),
  userAgent: z.string().max(1000).nullable(),
});

export const removePushSubscriptionInputSchema = z.object({
  endpoint: z.url(),
});

export const pushPublicKeySchema = z.object({
  publicKey: z.string().nullable(),
});
