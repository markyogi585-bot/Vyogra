import { boolean, date, decimal, index, int, json, mysqlEnum, mysqlTable, text, timestamp, uniqueIndex, varchar } from "drizzle-orm/mysql-core";

export const accountRole = mysqlEnum("accountRole", ["user", "sub_admin", "admin", "super_admin"]);
export const packageStatus = mysqlEnum("packageStatus", ["draft", "published", "paused", "archived"]);
export const bookingStatus = mysqlEnum("bookingStatus", ["pending", "confirmed", "active", "completed", "cancelled", "refunded"]);
export const paymentStatus = mysqlEnum("paymentStatus", ["created", "authorized", "paid", "failed", "refunded"]);
export const reviewStatus = mysqlEnum("reviewStatus", ["pending", "published", "rejected", "removed"]);
export const ticketStatus = mysqlEnum("ticketStatus", ["open", "in_progress", "resolved", "closed"]);
export const travelerCategory = mysqlEnum("travelerCategory", ["adult", "child", "infant"]);
export const supportChannelType = mysqlEnum("supportChannelType", ["whatsapp", "email", "phone"]);
export const bookingChangeStatus = mysqlEnum("bookingChangeStatus", ["requested", "reviewing", "approved", "rejected", "cancelled"]);
export const refundRequestStatus = mysqlEnum("refundRequestStatus", ["requested", "reviewing", "approved", "rejected", "processed", "failed", "cancelled"]);
export const bookingAdjustmentStatus = mysqlEnum("bookingAdjustmentStatus", ["proposed", "issued", "paid", "void"]);
export const notificationDeliveryStatus = mysqlEnum("notificationDeliveryStatus", ["queued", "sent", "failed", "disabled"]);

export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: varchar("name", { length: 160 }),
  email: varchar("email", { length: 320 }),
  phone: varchar("phone", { length: 32 }),
  avatarUrl: text("avatarUrl"),
  loginMethod: varchar("loginMethod", { length: 64 }),
  preferredLocale: varchar("preferredLocale", { length: 8 }).default("en-IN").notNull(),
  role: accountRole.default("user").notNull(),
  loyaltyTier: varchar("loyaltyTier", { length: 24 }).default("explorer").notNull(),
  lifetimeSpend: decimal("lifetimeSpend", { precision: 12, scale: 2 }).default("0").notNull(),
  isSuspended: boolean("isSuspended").default(false).notNull(),
  suspendedUntil: timestamp("suspendedUntil"),
  isBanned: boolean("isBanned").default(false).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
}, (table) => [uniqueIndex("users_email_unique").on(table.email), uniqueIndex("users_phone_unique").on(table.phone), index("users_role_index").on(table.role)]);

export const externalIdentities = mysqlTable("externalIdentities", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  provider: varchar("provider", { length: 48 }).notNull(),
  providerSubject: varchar("providerSubject", { length: 255 }).notNull(),
  email: varchar("email", { length: 320 }),
  phone: varchar("phone", { length: 32 }),
  claims: json("claims").$type<Record<string, unknown>>(),
  verifiedAt: timestamp("verifiedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (table) => [uniqueIndex("external_identity_provider_subject_unique").on(table.provider, table.providerSubject), index("external_identity_user_index").on(table.userId)]);

export const packages = mysqlTable("packages", {
  id: int("id").autoincrement().primaryKey(),
  slug: varchar("slug", { length: 160 }).notNull().unique(),
  name: varchar("name", { length: 220 }).notNull(),
  summary: text("summary").notNull(),
  destination: varchar("destination", { length: 220 }).notNull(),
  category: varchar("category", { length: 64 }).notNull(),
  durationDays: int("durationDays").notNull(),
  durationNights: int("durationNights").notNull(),
  groupMin: int("groupMin").default(1).notNull(),
  groupMax: int("groupMax").default(12).notNull(),
  basePrice: decimal("basePrice", { precision: 12, scale: 2 }).notNull(),
  coverImageUrl: text("coverImageUrl"),
  tags: json("tags").$type<string[]>(),
  inclusions: json("inclusions").$type<string[]>(),
  exclusions: json("exclusions").$type<string[]>(),
  status: packageStatus.default("draft").notNull(),
  createdByUserId: int("createdByUserId").notNull(),
  publishedAt: timestamp("publishedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (table) => [index("packages_status_index").on(table.status), index("packages_category_index").on(table.category), index("packages_creator_index").on(table.createdByUserId)]);

export const packageTranslations = mysqlTable("packageTranslations", {
  id: int("id").autoincrement().primaryKey(),
  packageId: int("packageId").notNull(),
  locale: varchar("locale", { length: 8 }).notNull(),
  name: varchar("name", { length: 220 }).notNull(),
  summary: text("summary").notNull(),
  destination: varchar("destination", { length: 220 }).notNull(),
  inclusions: json("inclusions").$type<string[]>(),
  exclusions: json("exclusions").$type<string[]>(),
  updatedByUserId: int("updatedByUserId").notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (table) => [uniqueIndex("package_translation_locale_unique").on(table.packageId, table.locale)]);

export const packageDays = mysqlTable("packageDays", {
  id: int("id").autoincrement().primaryKey(),
  packageId: int("packageId").notNull(),
  dayNumber: int("dayNumber").notNull(),
  title: varchar("title", { length: 220 }).notNull(),
  description: text("description"),
  location: varchar("location", { length: 220 }),
  latitude: decimal("latitude", { precision: 10, scale: 7 }),
  longitude: decimal("longitude", { precision: 10, scale: 7 }),
  activities: json("activities").$type<string[]>(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, (table) => [uniqueIndex("package_day_unique").on(table.packageId, table.dayNumber)]);

export const packageMedia = mysqlTable("packageMedia", {
  id: int("id").autoincrement().primaryKey(),
  packageId: int("packageId").notNull(),
  storageKey: text("storageKey").notNull(),
  url: text("url").notNull(),
  alt: varchar("alt", { length: 220 }),
  sortOrder: int("sortOrder").default(0).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, (table) => [index("package_media_package_index").on(table.packageId)]);

export const packageDraftRevisions = mysqlTable("packageDraftRevisions", {
  id: int("id").autoincrement().primaryKey(),
  packageId: int("packageId").notNull(),
  revision: int("revision").notNull(),
  payload: json("payload").$type<Record<string, unknown>>().notNull(),
  createdByUserId: int("createdByUserId").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, (table) => [uniqueIndex("package_draft_revision_unique").on(table.packageId, table.revision), index("package_draft_revision_package_index").on(table.packageId, table.createdAt)]);

export const departures = mysqlTable("departures", {
  id: int("id").autoincrement().primaryKey(),
  packageId: int("packageId").notNull(),
  startsAt: timestamp("startsAt").notNull(),
  endsAt: timestamp("endsAt").notNull(),
  capacity: int("capacity").notNull(),
  bookedCount: int("bookedCount").default(0).notNull(),
  price: decimal("price", { precision: 12, scale: 2 }).notNull(),
  isOpen: boolean("isOpen").default(true).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, (table) => [index("departures_package_date_index").on(table.packageId, table.startsAt)]);

export const bookings = mysqlTable("bookings", {
  id: int("id").autoincrement().primaryKey(),
  bookingCode: varchar("bookingCode", { length: 32 }).notNull().unique(),
  userId: int("userId").notNull(),
  packageId: int("packageId").notNull(),
  departureId: int("departureId"),
  status: bookingStatus.default("pending").notNull(),
  travelerCount: int("travelerCount").notNull(),
  subtotal: decimal("subtotal", { precision: 12, scale: 2 }).notNull(),
  addOnTotal: decimal("addOnTotal", { precision: 12, scale: 2 }).default("0").notNull(),
  walletApplied: decimal("walletApplied", { precision: 12, scale: 2 }).default("0").notNull(),
  grandTotal: decimal("grandTotal", { precision: 12, scale: 2 }).notNull(),
  notes: text("notes"),
  confirmedAt: timestamp("confirmedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (table) => [index("bookings_user_status_index").on(table.userId, table.status), index("bookings_package_index").on(table.packageId)]);

export const bookingTravelers = mysqlTable("bookingTravelers", {
  id: int("id").autoincrement().primaryKey(),
  bookingId: int("bookingId").notNull(),
  fullName: varchar("fullName", { length: 160 }).notNull(),
  phone: varchar("phone", { length: 32 }),
  email: varchar("email", { length: 320 }),
  emergencyPhone: varchar("emergencyPhone", { length: 32 }),
  dietaryNotes: text("dietaryNotes"),
  travelerCategory: travelerCategory.default("adult").notNull(),
  dateOfBirth: date("dateOfBirth"),
  guardianName: varchar("guardianName", { length: 160 }),
  guardianPhone: varchar("guardianPhone", { length: 32 }),
  guardianConsentAt: timestamp("guardianConsentAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, (table) => [index("booking_travelers_booking_index").on(table.bookingId)]);

export const payments = mysqlTable("payments", {
  id: int("id").autoincrement().primaryKey(),
  bookingId: int("bookingId").notNull(),
  provider: varchar("provider", { length: 48 }).notNull(),
  providerOrderId: varchar("providerOrderId", { length: 160 }),
  providerPaymentId: varchar("providerPaymentId", { length: 160 }),
  status: paymentStatus.default("created").notNull(),
  amount: decimal("amount", { precision: 12, scale: 2 }).notNull(),
  currency: varchar("currency", { length: 8 }).default("INR").notNull(),
  verifiedAt: timestamp("verifiedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, (table) => [index("payments_booking_index").on(table.bookingId), uniqueIndex("payments_provider_payment_unique").on(table.providerPaymentId)]);

export const wallets = mysqlTable("wallets", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull().unique(),
  balance: decimal("balance", { precision: 12, scale: 2 }).default("0").notNull(),
  currency: varchar("currency", { length: 8 }).default("INR").notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export const walletTransactions = mysqlTable("walletTransactions", {
  id: int("id").autoincrement().primaryKey(),
  walletId: int("walletId").notNull(),
  type: varchar("type", { length: 32 }).notNull(),
  amount: decimal("amount", { precision: 12, scale: 2 }).notNull(),
  referenceType: varchar("referenceType", { length: 48 }),
  referenceId: varchar("referenceId", { length: 96 }),
  description: varchar("description", { length: 240 }).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, (table) => [index("wallet_transactions_wallet_index").on(table.walletId, table.createdAt)]);

export const wishlists = mysqlTable("wishlists", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  name: varchar("name", { length: 120 }).notNull(),
  shareToken: varchar("shareToken", { length: 96 }).unique(),
  isPublic: boolean("isPublic").default(false).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, (table) => [index("wishlists_user_index").on(table.userId)]);

export const wishlistItems = mysqlTable("wishlistItems", {
  id: int("id").autoincrement().primaryKey(),
  wishlistId: int("wishlistId").notNull(),
  packageId: int("packageId").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, (table) => [uniqueIndex("wishlist_item_unique").on(table.wishlistId, table.packageId)]);

export const documents = mysqlTable("documents", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  bookingId: int("bookingId"),
  uploadedByUserId: int("uploadedByUserId").notNull(),
  fileName: varchar("fileName", { length: 255 }).notNull(),
  mimeType: varchar("mimeType", { length: 120 }).notNull(),
  storageKey: text("storageKey").notNull(),
  url: text("url").notNull(),
  category: varchar("category", { length: 48 }).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, (table) => [index("documents_user_index").on(table.userId), index("documents_booking_index").on(table.bookingId)]);

export const reviews = mysqlTable("reviews", {
  id: int("id").autoincrement().primaryKey(),
  bookingId: int("bookingId").notNull().unique(),
  userId: int("userId").notNull(),
  packageId: int("packageId").notNull(),
  rating: int("rating").notNull(),
  body: text("body").notNull(),
  tags: json("tags").$type<string[]>(),
  status: reviewStatus.default("pending").notNull(),
  moderatedByUserId: int("moderatedByUserId"),
  moderatedAt: timestamp("moderatedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, (table) => [index("reviews_package_status_index").on(table.packageId, table.status), index("reviews_user_index").on(table.userId)]);

export const reviewMedia = mysqlTable("reviewMedia", {
  id: int("id").autoincrement().primaryKey(),
  reviewId: int("reviewId").notNull(),
  storageKey: text("storageKey").notNull(),
  url: text("url").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, (table) => [index("review_media_review_index").on(table.reviewId)]);

export const broadcasts = mysqlTable("broadcasts", {
  id: int("id").autoincrement().primaryKey(),
  title: varchar("title", { length: 180 }).notNull(),
  body: text("body").notNull(),
  audience: varchar("audience", { length: 80 }).notNull(),
  deepLink: varchar("deepLink", { length: 255 }),
  imageUrl: text("imageUrl"),
  status: varchar("status", { length: 24 }).default("draft").notNull(),
  scheduledAt: timestamp("scheduledAt"),
  sentAt: timestamp("sentAt"),
  createdByUserId: int("createdByUserId").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, (table) => [index("broadcasts_status_scheduled_index").on(table.status, table.scheduledAt)]);

export const announcements = mysqlTable("announcements", {
  id: int("id").autoincrement().primaryKey(),
  title: varchar("title", { length: 180 }).notNull(),
  body: text("body").notNull(),
  imageUrl: text("imageUrl"),
  startsAt: timestamp("startsAt"),
  endsAt: timestamp("endsAt"),
  isActive: boolean("isActive").default(false).notNull(),
  createdByUserId: int("createdByUserId").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export const budgetLines = mysqlTable("budgetLines", {
  id: int("id").autoincrement().primaryKey(),
  packageId: int("packageId").notNull(),
  name: varchar("name", { length: 120 }).notNull(),
  category: varchar("category", { length: 64 }).notNull(),
  costPerTraveler: decimal("costPerTraveler", { precision: 12, scale: 2 }).notNull(),
  notes: text("notes"),
  createdByUserId: int("createdByUserId").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (table) => [index("budget_lines_package_index").on(table.packageId)]);

export const supportTickets = mysqlTable("supportTickets", {
  id: int("id").autoincrement().primaryKey(),
  ticketCode: varchar("ticketCode", { length: 32 }).notNull().unique(),
  userId: int("userId").notNull(),
  bookingId: int("bookingId"),
  subject: varchar("subject", { length: 220 }).notNull(),
  body: text("body").notNull(),
  status: ticketStatus.default("open").notNull(),
  assignedToUserId: int("assignedToUserId"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (table) => [index("support_tickets_user_index").on(table.userId), index("support_tickets_status_index").on(table.status)]);

export const supportTicketReplies = mysqlTable("supportTicketReplies", {
  id: int("id").autoincrement().primaryKey(),
  ticketId: int("ticketId").notNull(),
  authorUserId: int("authorUserId").notNull(),
  body: text("body").notNull(),
  visibleToTraveler: boolean("visibleToTraveler").default(true).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, (table) => [index("support_replies_ticket_index").on(table.ticketId, table.createdAt)]);

export const supportChannels = mysqlTable("supportChannels", {
  id: int("id").autoincrement().primaryKey(),
  channel: supportChannelType.notNull().unique(),
  label: varchar("label", { length: 80 }).notNull(),
  destination: varchar("destination", { length: 255 }).notNull(),
  isActive: boolean("isActive").default(false).notNull(),
  updatedByUserId: int("updatedByUserId").notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export const auditEvents = mysqlTable("auditEvents", {
  id: int("id").autoincrement().primaryKey(),
  actorUserId: int("actorUserId"),
  eventType: varchar("eventType", { length: 96 }).notNull(),
  entityType: varchar("entityType", { length: 96 }).notNull(),
  entityId: varchar("entityId", { length: 96 }),
  metadata: json("metadata").$type<Record<string, unknown>>(),
  requestId: varchar("requestId", { length: 96 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, (table) => [index("audit_events_entity_index").on(table.entityType, table.entityId), index("audit_events_actor_index").on(table.actorUserId, table.createdAt)]);

export const otpAttempts = mysqlTable("otpAttempts", {
  id: int("id").autoincrement().primaryKey(),
  phone: varchar("phone", { length: 32 }).notNull(),
  attempts: int("attempts").default(0).notNull(),
  lockedUntil: timestamp("lockedUntil"),
  expiresAt: timestamp("expiresAt").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, (table) => [index("otp_attempts_phone_index").on(table.phone, table.createdAt)]);

export const packageTerms = mysqlTable("packageTerms", {
  id: int("id").autoincrement().primaryKey(),
  packageId: int("packageId").notNull(),
  revision: varchar("revision", { length: 32 }).notNull(),
  title: varchar("title", { length: 220 }).notNull(),
  body: text("body").notNull(),
  isActive: boolean("isActive").default(true).notNull(),
  createdByUserId: int("createdByUserId").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, (table) => [uniqueIndex("package_terms_revision_unique").on(table.packageId, table.revision), index("package_terms_active_index").on(table.packageId, table.isActive)]);

export const bookingTermsAcceptances = mysqlTable("bookingTermsAcceptances", {
  id: int("id").autoincrement().primaryKey(),
  bookingId: int("bookingId").notNull(),
  packageTermsId: int("packageTermsId").notNull(),
  acceptedByUserId: int("acceptedByUserId"),
  acceptedByName: varchar("acceptedByName", { length: 160 }),
  acceptanceSource: varchar("acceptanceSource", { length: 48 }).notNull(),
  acceptedAt: timestamp("acceptedAt").defaultNow().notNull(),
  ipHash: varchar("ipHash", { length: 128 }),
}, (table) => [index("booking_terms_booking_index").on(table.bookingId)]);

export const coupons = mysqlTable("coupons", {
  id: int("id").autoincrement().primaryKey(),
  code: varchar("code", { length: 64 }).notNull().unique(),
  title: varchar("title", { length: 160 }).notNull(),
  description: text("description"),
  discountType: mysqlEnum("discountType", ["flat", "percent"]).notNull(),
  discountValue: decimal("discountValue", { precision: 12, scale: 2 }).notNull(),
  minimumSubtotal: decimal("minimumSubtotal", { precision: 12, scale: 2 }).default("0").notNull(),
  maximumDiscount: decimal("maximumDiscount", { precision: 12, scale: 2 }),
  startsAt: timestamp("startsAt"),
  endsAt: timestamp("endsAt"),
  maxRedemptions: int("maxRedemptions"),
  redeemedCount: int("redeemedCount").default(0).notNull(),
  isActive: boolean("isActive").default(true).notNull(),
  createdByUserId: int("createdByUserId").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, (table) => [index("coupons_active_window_index").on(table.isActive, table.endsAt)]);

export const couponRedemptions = mysqlTable("couponRedemptions", {
  id: int("id").autoincrement().primaryKey(),
  couponId: int("couponId").notNull(),
  bookingId: int("bookingId").notNull(),
  userId: int("userId"),
  discountAmount: decimal("discountAmount", { precision: 12, scale: 2 }).notNull(),
  redeemedAt: timestamp("redeemedAt").defaultNow().notNull(),
}, (table) => [uniqueIndex("coupon_redemption_booking_unique").on(table.couponId, table.bookingId), index("coupon_redemption_coupon_index").on(table.couponId)]);

export const invoices = mysqlTable("invoices", {
  id: int("id").autoincrement().primaryKey(),
  invoiceNumber: varchar("invoiceNumber", { length: 64 }).notNull().unique(),
  bookingId: int("bookingId").notNull().unique(),
  userId: int("userId").notNull(),
  status: mysqlEnum("invoiceStatus", ["draft", "issued", "paid", "void", "refunded"]).default("draft").notNull(),
  subtotal: decimal("subtotal", { precision: 12, scale: 2 }).notNull(),
  taxTotal: decimal("taxTotal", { precision: 12, scale: 2 }).default("0").notNull(),
  discountTotal: decimal("discountTotal", { precision: 12, scale: 2 }).default("0").notNull(),
  grandTotal: decimal("grandTotal", { precision: 12, scale: 2 }).notNull(),
  currency: varchar("currency", { length: 8 }).default("INR").notNull(),
  billingSnapshot: json("billingSnapshot").$type<Record<string, unknown>>(),
  issuedByUserId: int("issuedByUserId"),
  issuedAt: timestamp("issuedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, (table) => [index("invoices_user_status_index").on(table.userId, table.status)]);

export const invoiceLineItems = mysqlTable("invoiceLineItems", {
  id: int("id").autoincrement().primaryKey(),
  invoiceId: int("invoiceId").notNull(),
  description: varchar("description", { length: 240 }).notNull(),
  quantity: int("quantity").default(1).notNull(),
  unitAmount: decimal("unitAmount", { precision: 12, scale: 2 }).notNull(),
  taxRate: decimal("taxRate", { precision: 5, scale: 2 }).default("0").notNull(),
  lineTotal: decimal("lineTotal", { precision: 12, scale: 2 }).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, (table) => [index("invoice_lines_invoice_index").on(table.invoiceId)]);

export const bookingAccessGrants = mysqlTable("bookingAccessGrants", {
  id: int("id").autoincrement().primaryKey(),
  bookingId: int("bookingId").notNull(),
  tokenHash: varchar("tokenHash", { length: 128 }).notNull().unique(),
  verifiedContactHash: varchar("verifiedContactHash", { length: 128 }).notNull(),
  accessScope: json("accessScope").$type<string[]>(),
  expiresAt: timestamp("expiresAt").notNull(),
  revokedAt: timestamp("revokedAt"),
  lastUsedAt: timestamp("lastUsedAt"),
  createdByUserId: int("createdByUserId").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, (table) => [index("booking_access_grants_booking_index").on(table.bookingId, table.expiresAt)]);

export const bookingExtensionRequests = mysqlTable("bookingExtensionRequests", {
  id: int("id").autoincrement().primaryKey(),
  bookingId: int("bookingId").notNull(),
  requestedByUserId: int("requestedByUserId"),
  requestedStartAt: timestamp("requestedStartAt"),
  requestedEndAt: timestamp("requestedEndAt"),
  additionalDays: int("additionalDays").default(0).notNull(),
  reason: text("reason").notNull(),
  status: bookingChangeStatus.default("requested").notNull(),
  operatorNote: text("operatorNote"),
  reviewedByUserId: int("reviewedByUserId"),
  reviewedAt: timestamp("reviewedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (table) => [index("booking_extension_booking_status_index").on(table.bookingId, table.status), index("booking_extension_requested_index").on(table.requestedByUserId, table.createdAt)]);

export const bookingTripSchedules = mysqlTable("bookingTripSchedules", {
  id: int("id").autoincrement().primaryKey(),
  bookingId: int("bookingId").notNull().unique(),
  startsAt: timestamp("startsAt").notNull(),
  endsAt: timestamp("endsAt").notNull(),
  source: varchar("source", { length: 48 }).default("operator_override").notNull(),
  updatedByUserId: int("updatedByUserId").notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (table) => [index("booking_trip_schedule_window_index").on(table.startsAt, table.endsAt)]);

export const bookingCancellationRequests = mysqlTable("bookingCancellationRequests", {
  id: int("id").autoincrement().primaryKey(),
  bookingId: int("bookingId").notNull(),
  requestedByUserId: int("requestedByUserId"),
  reason: text("reason").notNull(),
  requestedRefundAmount: decimal("requestedRefundAmount", { precision: 12, scale: 2 }),
  status: bookingChangeStatus.default("requested").notNull(),
  operatorNote: text("operatorNote"),
  reviewedByUserId: int("reviewedByUserId"),
  reviewedAt: timestamp("reviewedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (table) => [index("booking_cancellation_booking_status_index").on(table.bookingId, table.status), index("booking_cancellation_requested_index").on(table.requestedByUserId, table.createdAt)]);

export const bookingAdjustments = mysqlTable("bookingAdjustments", {
  id: int("id").autoincrement().primaryKey(),
  bookingId: int("bookingId").notNull(),
  invoiceId: int("invoiceId"),
  kind: mysqlEnum("bookingAdjustmentKind", ["additional_charge", "credit"]).notNull(),
  description: varchar("description", { length: 240 }).notNull(),
  amount: decimal("amount", { precision: 12, scale: 2 }).notNull(),
  taxRate: decimal("taxRate", { precision: 5, scale: 2 }).default("0").notNull(),
  status: bookingAdjustmentStatus.default("proposed").notNull(),
  issuedByUserId: int("issuedByUserId").notNull(),
  voidedByUserId: int("voidedByUserId"),
  voidReason: text("voidReason"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (table) => [index("booking_adjustment_booking_index").on(table.bookingId, table.status), index("booking_adjustment_invoice_index").on(table.invoiceId)]);

export const refundRequests = mysqlTable("refundRequests", {
  id: int("id").autoincrement().primaryKey(),
  bookingId: int("bookingId").notNull(),
  paymentId: int("paymentId"),
  cancellationRequestId: int("cancellationRequestId"),
  requestedByUserId: int("requestedByUserId"),
  amount: decimal("amount", { precision: 12, scale: 2 }).notNull(),
  currency: varchar("currency", { length: 8 }).default("INR").notNull(),
  reason: text("reason").notNull(),
  status: refundRequestStatus.default("requested").notNull(),
  providerRefundId: varchar("providerRefundId", { length: 160 }),
  operatorNote: text("operatorNote"),
  reviewedByUserId: int("reviewedByUserId"),
  reviewedAt: timestamp("reviewedAt"),
  processedAt: timestamp("processedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (table) => [index("refund_request_booking_status_index").on(table.bookingId, table.status), index("refund_request_payment_index").on(table.paymentId)]);

export const tripShareLinks = mysqlTable("tripShareLinks", {
  id: int("id").autoincrement().primaryKey(),
  bookingId: int("bookingId").notNull(),
  tokenHash: varchar("tokenHash", { length: 128 }).notNull().unique(),
  title: varchar("title", { length: 180 }).notNull(),
  message: varchar("message", { length: 320 }),
  imageUrl: text("imageUrl"),
  expiresAt: timestamp("expiresAt"),
  revokedAt: timestamp("revokedAt"),
  createdByUserId: int("createdByUserId").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, (table) => [index("trip_share_booking_index").on(table.bookingId, table.expiresAt)]);

export const pushDevices = mysqlTable("pushDevices", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  token: text("token").notNull(),
  tokenHash: varchar("tokenHash", { length: 128 }).notNull().unique(),
  platform: varchar("platform", { length: 32 }).notNull(),
  isEnabled: boolean("isEnabled").default(true).notNull(),
  lastSeenAt: timestamp("lastSeenAt").defaultNow().notNull(),
  disabledAt: timestamp("disabledAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (table) => [index("push_devices_user_enabled_index").on(table.userId, table.isEnabled)]);

export const notificationDeliveries = mysqlTable("notificationDeliveries", {
  id: int("id").autoincrement().primaryKey(),
  broadcastId: int("broadcastId"),
  bookingId: int("bookingId"),
  recipientUserId: int("recipientUserId"),
  channel: mysqlEnum("notificationChannel", ["in_app", "push"]).notNull(),
  status: notificationDeliveryStatus.default("queued").notNull(),
  payload: json("payload").$type<Record<string, unknown>>().notNull(),
  providerMessageId: varchar("providerMessageId", { length: 255 }),
  errorCode: varchar("errorCode", { length: 160 }),
  sentAt: timestamp("sentAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, (table) => [index("notification_delivery_recipient_index").on(table.recipientUserId, table.createdAt), index("notification_delivery_broadcast_index").on(table.broadcastId, table.status)]);

export const tripUpdates = mysqlTable("tripUpdates", {
  id: int("id").autoincrement().primaryKey(),
  bookingId: int("bookingId").notNull(),
  type: mysqlEnum("tripUpdateType", ["update", "milestone", "notice", "safety", "media"]).default("update").notNull(),
  title: varchar("title", { length: 220 }).notNull(),
  body: text("body").notNull(),
  latitude: decimal("latitude", { precision: 10, scale: 7 }),
  longitude: decimal("longitude", { precision: 10, scale: 7 }),
  visibility: mysqlEnum("tripUpdateVisibility", ["booking", "departure", "all_active"]).default("booking").notNull(),
  publishedByUserId: int("publishedByUserId").notNull(),
  publishedAt: timestamp("publishedAt").defaultNow().notNull(),
}, (table) => [index("trip_updates_booking_time_index").on(table.bookingId, table.publishedAt)]);

export const tripLocationCheckins = mysqlTable("tripLocationCheckins", {
  id: int("id").autoincrement().primaryKey(),
  bookingId: int("bookingId").notNull(),
  latitude: decimal("latitude", { precision: 10, scale: 7 }).notNull(),
  longitude: decimal("longitude", { precision: 10, scale: 7 }).notNull(),
  accuracyMeters: int("accuracyMeters"),
  label: varchar("label", { length: 220 }),
  note: text("note"),
  visibility: mysqlEnum("tripLocationVisibility", ["booking", "departure", "all_active"]).default("booking").notNull(),
  source: varchar("source", { length: 48 }).default("host_manual").notNull(),
  capturedAt: timestamp("capturedAt").defaultNow().notNull(),
  createdByUserId: int("createdByUserId").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, (table) => [index("trip_location_booking_time_index").on(table.bookingId, table.capturedAt)]);

export const tripUpdateMedia = mysqlTable("tripUpdateMedia", {
  id: int("id").autoincrement().primaryKey(),
  tripUpdateId: int("tripUpdateId").notNull(),
  storageKey: text("storageKey").notNull(),
  url: text("url").notNull(),
  mimeType: varchar("mimeType", { length: 120 }).notNull(),
  caption: varchar("caption", { length: 240 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, (table) => [index("trip_update_media_update_index").on(table.tripUpdateId)]);

export const mediaAssets = mysqlTable("mediaAssets", {
  id: int("id").autoincrement().primaryKey(),
  storageKey: varchar("storageKey", { length: 512 }).notNull().unique(),
  url: text("url").notNull(),
  originalFileName: varchar("originalFileName", { length: 255 }).notNull(),
  mimeType: varchar("mimeType", { length: 120 }).notNull(),
  byteSize: int("byteSize").notNull(),
  folder: varchar("folder", { length: 64 }).notNull(),
  tags: json("tags").$type<string[]>(),
  uploadedByUserId: int("uploadedByUserId").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, (table) => [index("media_assets_folder_index").on(table.folder, table.createdAt)]);

export const featuredWidgets = mysqlTable("featuredWidgets", {
  id: int("id").autoincrement().primaryKey(),
  title: varchar("title", { length: 180 }).notNull(),
  body: text("body").notNull(),
  kind: mysqlEnum("featuredWidgetKind", ["daily_deal", "flash_sale", "offer", "announcement"]).notNull(),
  packageId: int("packageId"),
  couponId: int("couponId"),
  imageUrl: text("imageUrl"),
  deepLink: varchar("deepLink", { length: 255 }),
  startsAt: timestamp("startsAt"),
  endsAt: timestamp("endsAt"),
  isActive: boolean("isActive").default(false).notNull(),
  createdByUserId: int("createdByUserId").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, (table) => [index("featured_widgets_active_window_index").on(table.isActive, table.startsAt, table.endsAt)]);

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;
