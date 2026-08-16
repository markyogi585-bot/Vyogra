import { getIntegrationStatus } from "../config/integrationStatus";
import { firebaseAuthPolicy } from "../config/firebase";
import { publicProcedure, router } from "../_core/trpc";

export const integrationsRouter = router({
  status: publicProcedure.query(() => ({
    providers: getIntegrationStatus(),
    authPolicy: firebaseAuthPolicy,
    storageMode: "managed_secure_storage" as const,
    primaryOperationalDatabase: "mysql_drizzle" as const,
  })),
});
