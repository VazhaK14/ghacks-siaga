import { StrictMode, startTransition } from "react";
import { hydrateRoot } from "react-dom/client";
import { HydratedRouter } from "react-router/dom";

import { registerCitizenServiceWorker } from "./features/notifications/service-worker-registration";

registerCitizenServiceWorker().catch(() => undefined);

startTransition(() => {
  hydrateRoot(
    document,
    <StrictMode>
      <HydratedRouter />
    </StrictMode>
  );
});
