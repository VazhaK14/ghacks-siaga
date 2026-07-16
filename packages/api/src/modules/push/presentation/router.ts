import { env } from "@siaga-app/env/server";

import { reporterProcedure, router } from "../../../index";
import {
  RemovePushSubscription,
  SavePushSubscription,
} from "../application/manage-push-subscription";
import { PrismaPushSubscriptionRepository } from "../infrastructure/prisma-push-subscription-repository";
import {
  pushPublicKeySchema,
  removePushSubscriptionInputSchema,
  savePushSubscriptionInputSchema,
} from "./dto";

const repository = new PrismaPushSubscriptionRepository();
const savePushSubscription = new SavePushSubscription(repository);
const removePushSubscription = new RemovePushSubscription(repository);

export const pushRouter = router({
  getPublicKey: reporterProcedure
    .output(pushPublicKeySchema)
    .query(() => ({ publicKey: env.VAPID_PUBLIC_KEY ?? null })),
  remove: reporterProcedure
    .input(removePushSubscriptionInputSchema)
    .mutation(({ ctx, input }) =>
      removePushSubscription.execute(ctx.session.user.id, input.endpoint)
    ),
  save: reporterProcedure
    .input(savePushSubscriptionInputSchema)
    .mutation(({ ctx, input }) =>
      savePushSubscription.execute(ctx.session.user.id, input)
    ),
});
