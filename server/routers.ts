import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, router } from "./_core/trpc";
import { catalogRouter } from "./routers/catalog";
import { bookingRouter } from "./routers/booking";
import { walletRouter } from "./routers/wallet";
import { reviewRouter } from "./routers/reviews";
import { supportRouter } from "./routers/support";
import { adminPackagesRouter } from "./routers/admin/packages";
import { adminTravelersRouter } from "./routers/admin/travelers";
import { adminOperationsRouter } from "./routers/admin/operations";
import { adminEngagementRouter } from "./routers/admin/engagement";
import { bookingAccessRouter } from "./routers/bookingAccess";
import { commerceRouter } from "./routers/commerce";
import { tripOpsRouter } from "./routers/tripOps";
import { campaignsRouter } from "./routers/campaigns";
import { integrationsRouter } from "./routers/integrations";
import { travelerRouter } from "./routers/traveler";
import { mediaRouter } from "./routers/media";
import { identityRouter } from "./routers/identity";
import { bookingLifecycleRouter } from "./routers/bookingLifecycle";
import { notificationsRouter } from "./routers/notifications";
import { tripShareRouter } from "./routers/tripShare";

export const appRouter = router({
    // if you need to use socket.io, read and register route in server/_core/index.ts, all api should start with '/api/' so that the gateway can route correctly
  system: systemRouter,
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return {
        success: true,
      } as const;
    }),
  }),
  catalog: catalogRouter,
  bookings: bookingRouter,
  wallet: walletRouter,
  reviews: reviewRouter,
  support: supportRouter,
  bookingAccess: bookingAccessRouter,
  commerce: commerceRouter,
  tripOps: tripOpsRouter,
  campaigns: campaignsRouter,
  integrations: integrationsRouter,
  traveler: travelerRouter,
  media: mediaRouter,
  identity: identityRouter,
  bookingLifecycle: bookingLifecycleRouter,
  notifications: notificationsRouter,
  tripShare: tripShareRouter,
  admin: router({ packages: adminPackagesRouter, travelers: adminTravelersRouter, operations: adminOperationsRouter, engagement: adminEngagementRouter }),

  // TODO: add feature routers here, e.g.
  // todo: router({
  //   list: protectedProcedure.query(({ ctx }) =>
  //     db.getUserTodos(ctx.user.id)
  //   ),
  // }),
});

export type AppRouter = typeof appRouter;
