import {
  mysqlTable,
  varchar,
  text,
  int,
  bigint,
  boolean,
  timestamp,
  decimal,
  json,
  mysqlEnum,
  index,
  uniqueIndex,
} from "drizzle-orm/mysql-core";
import { relations } from "drizzle-orm";

// ---------------------------------------------------------------------------
// monetura_members
// ---------------------------------------------------------------------------
export const moneturaMembers = mysqlTable(
  "monetura_members",
  {
    id: bigint("id", { mode: "number", unsigned: true })
      .primaryKey()
      .autoincrement(),
    email: varchar("email", { length: 255 }).notNull().unique(),
    name: varchar("name", { length: 255 }).notNull(),
    phone: varchar("phone", { length: 50 }),
    referenceCode: varchar("reference_code", { length: 10 }),
    referredBy: varchar("referred_by", { length: 10 }),
    membershipTier: mysqlEnum("membership_tier", [
      "free",
      "community",
      "software",
      "founder",
    ])
      .notNull()
      .default("free"),
    status: mysqlEnum("status", [
      "pending",
      "active",
      "suspended",
      "cancelled",
    ])
      .notNull()
      .default("pending"),
    country: varchar("country", { length: 100 }),
    city: varchar("city", { length: 100 }),
    bio: text("bio"),
    avatarUrl: varchar("avatar_url", { length: 500 }),
    stripeCustomerId: varchar("stripe_customer_id", { length: 255 }),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
  },
  (t) => ({
    emailIdx: uniqueIndex("idx_members_email").on(t.email),
    referenceCodeIdx: index("idx_members_reference_code").on(t.referenceCode),
  })
);

// ---------------------------------------------------------------------------
// monetura_founder_keys
// ---------------------------------------------------------------------------
export const moneturaFounderKeys = mysqlTable(
  "monetura_founder_keys",
  {
    id: bigint("id", { mode: "number", unsigned: true })
      .primaryKey()
      .autoincrement(),
    memberId: bigint("member_id", { mode: "number", unsigned: true }).notNull(),
    keyCode: varchar("key_code", { length: 64 }).notNull().unique(),
    founderTier: mysqlEnum("founder_tier", ["bronze", "silver", "gold"])
      .notNull()
      .default("bronze"),
    purchaseAmount: decimal("purchase_amount", { precision: 10, scale: 2 }),
    purchaseMethod: mysqlEnum("purchase_method", ["etransfer", "wire"]),
    activatedAt: timestamp("activated_at"),
    expiresAt: timestamp("expires_at"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (t) => ({
    memberIdx: index("idx_founder_keys_member").on(t.memberId),
    keyCodeIdx: uniqueIndex("idx_founder_keys_code").on(t.keyCode),
  })
);

// ---------------------------------------------------------------------------
// monetura_milestones
// ---------------------------------------------------------------------------
export const moneturaMilestones = mysqlTable(
  "monetura_milestones",
  {
    id: bigint("id", { mode: "number", unsigned: true })
      .primaryKey()
      .autoincrement(),
    memberId: bigint("member_id", { mode: "number", unsigned: true }).notNull(),
    title: varchar("title", { length: 255 }).notNull(),
    description: text("description"),
    category: varchar("category", { length: 100 }),
    achievedAt: timestamp("achieved_at"),
    proofUrl: varchar("proof_url", { length: 500 }),
    isPublic: boolean("is_public").notNull().default(false),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
  },
  (t) => ({
    memberIdx: index("idx_milestones_member").on(t.memberId),
  })
);

// ---------------------------------------------------------------------------
// monetura_content_posts
// ---------------------------------------------------------------------------
export const moneturaContentPosts = mysqlTable(
  "monetura_content_posts",
  {
    id: bigint("id", { mode: "number", unsigned: true })
      .primaryKey()
      .autoincrement(),
    authorId: bigint("author_id", { mode: "number", unsigned: true }).notNull(),
    title: varchar("title", { length: 500 }).notNull(),
    slug: varchar("slug", { length: 500 }).notNull().unique(),
    body: text("body"),
    excerpt: text("excerpt"),
    coverImageUrl: varchar("cover_image_url", { length: 500 }),
    status: mysqlEnum("status", ["draft", "published", "archived"])
      .notNull()
      .default("draft"),
    contentType: mysqlEnum("content_type", [
      "article",
      "update",
      "announcement",
      "lesson",
    ])
      .notNull()
      .default("article"),
    tags: json("tags").$type<string[]>(),
    publishedAt: timestamp("published_at"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
  },
  (t) => ({
    slugIdx: uniqueIndex("idx_content_posts_slug").on(t.slug),
    authorIdx: index("idx_content_posts_author").on(t.authorId),
    statusIdx: index("idx_content_posts_status").on(t.status),
  })
);

// ---------------------------------------------------------------------------
// monetura_media_uploads
// ---------------------------------------------------------------------------
export const moneturaMediaUploads = mysqlTable(
  "monetura_media_uploads",
  {
    id: bigint("id", { mode: "number", unsigned: true })
      .primaryKey()
      .autoincrement(),
    uploaderId: bigint("uploader_id", {
      mode: "number",
      unsigned: true,
    }).notNull(),
    s3Key: varchar("s3_key", { length: 500 }).notNull(),
    s3Bucket: varchar("s3_bucket", { length: 255 }).notNull(),
    fileName: varchar("file_name", { length: 500 }).notNull(),
    mimeType: varchar("mime_type", { length: 100 }).notNull(),
    fileSizeBytes: bigint("file_size_bytes", {
      mode: "number",
      unsigned: true,
    }),
    publicUrl: varchar("public_url", { length: 1000 }),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (t) => ({
    uploaderIdx: index("idx_media_uploads_uploader").on(t.uploaderId),
  })
);

// ---------------------------------------------------------------------------
// monetura_affiliate_links
// ---------------------------------------------------------------------------
export const moneturaAffiliateLinks = mysqlTable(
  "monetura_affiliate_links",
  {
    id: bigint("id", { mode: "number", unsigned: true })
      .primaryKey()
      .autoincrement(),
    memberId: bigint("member_id", { mode: "number", unsigned: true }).notNull(),
    code: varchar("code", { length: 50 }).notNull().unique(),
    label: varchar("label", { length: 255 }),
    destinationUrl: varchar("destination_url", { length: 1000 }).notNull(),
    commissionRate: decimal("commission_rate", { precision: 5, scale: 4 })
      .notNull()
      .default("0.1000"),
    isActive: boolean("is_active").notNull().default(true),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (t) => ({
    memberIdx: index("idx_affiliate_links_member").on(t.memberId),
    codeIdx: uniqueIndex("idx_affiliate_links_code").on(t.code),
  })
);

// ---------------------------------------------------------------------------
// monetura_affiliate_clicks
// ---------------------------------------------------------------------------
export const moneturaAffiliateClicks = mysqlTable(
  "monetura_affiliate_clicks",
  {
    id: bigint("id", { mode: "number", unsigned: true })
      .primaryKey()
      .autoincrement(),
    linkId: bigint("link_id", { mode: "number", unsigned: true }).notNull(),
    ipAddress: varchar("ip_address", { length: 45 }),
    userAgent: text("user_agent"),
    referrer: varchar("referrer", { length: 1000 }),
    clickedAt: timestamp("clicked_at").defaultNow().notNull(),
  },
  (t) => ({
    linkIdx: index("idx_affiliate_clicks_link").on(t.linkId),
    clickedAtIdx: index("idx_affiliate_clicks_at").on(t.clickedAt),
  })
);

// ---------------------------------------------------------------------------
// monetura_commissions
// ---------------------------------------------------------------------------
export const moneturaCommissions = mysqlTable(
  "monetura_commissions",
  {
    id: bigint("id", { mode: "number", unsigned: true })
      .primaryKey()
      .autoincrement(),
    affiliateMemberId: bigint("affiliate_member_id", {
      mode: "number",
      unsigned: true,
    }).notNull(),
    referredMemberId: bigint("referred_member_id", {
      mode: "number",
      unsigned: true,
    }),
    linkId: bigint("link_id", { mode: "number", unsigned: true }),
    amountCents: int("amount_cents").notNull().default(0),
    currency: varchar("currency", { length: 3 }).notNull().default("CAD"),
    status: mysqlEnum("status", ["pending", "approved", "paid", "cancelled"])
      .notNull()
      .default("pending"),
    paidAt: timestamp("paid_at"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (t) => ({
    affiliateIdx: index("idx_commissions_affiliate").on(t.affiliateMemberId),
    statusIdx: index("idx_commissions_status").on(t.status),
  })
);

// ---------------------------------------------------------------------------
// monetura_credit_packages
// ---------------------------------------------------------------------------
export const moneturaCreditPackages = mysqlTable(
  "monetura_credit_packages",
  {
    id: bigint("id", { mode: "number", unsigned: true })
      .primaryKey()
      .autoincrement(),
    name: varchar("name", { length: 255 }).notNull(),
    description: text("description"),
    credits: int("credits").notNull(),
    priceCents: int("price_cents").notNull(),
    currency: varchar("currency", { length: 3 }).notNull().default("CAD"),
    isActive: boolean("is_active").notNull().default(true),
    stripePriceId: varchar("stripe_price_id", { length: 255 }),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  }
);

// ---------------------------------------------------------------------------
// monetura_credit_usage
// ---------------------------------------------------------------------------
export const moneturaCreditUsage = mysqlTable(
  "monetura_credit_usage",
  {
    id: bigint("id", { mode: "number", unsigned: true })
      .primaryKey()
      .autoincrement(),
    memberId: bigint("member_id", { mode: "number", unsigned: true }).notNull(),
    credits: int("credits").notNull(),
    direction: mysqlEnum("direction", ["debit", "credit"]).notNull(),
    reason: varchar("reason", { length: 500 }),
    referenceId: varchar("reference_id", { length: 255 }),
    balanceAfter: int("balance_after").notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (t) => ({
    memberIdx: index("idx_credit_usage_member").on(t.memberId),
    createdAtIdx: index("idx_credit_usage_created").on(t.createdAt),
  })
);

// ---------------------------------------------------------------------------
// monetura_challenges
// ---------------------------------------------------------------------------
export const moneturaChallenges = mysqlTable(
  "monetura_challenges",
  {
    id: bigint("id", { mode: "number", unsigned: true })
      .primaryKey()
      .autoincrement(),
    title: varchar("title", { length: 255 }).notNull(),
    description: text("description"),
    category: varchar("category", { length: 100 }),
    startDate: timestamp("start_date"),
    endDate: timestamp("end_date"),
    creditReward: int("credit_reward").notNull().default(0),
    status: mysqlEnum("status", ["upcoming", "active", "completed"])
      .notNull()
      .default("upcoming"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  }
);

// ---------------------------------------------------------------------------
// monetura_challenge_entries
// ---------------------------------------------------------------------------
export const moneturaChallengeEntries = mysqlTable(
  "monetura_challenge_entries",
  {
    id: bigint("id", { mode: "number", unsigned: true })
      .primaryKey()
      .autoincrement(),
    challengeId: bigint("challenge_id", {
      mode: "number",
      unsigned: true,
    }).notNull(),
    memberId: bigint("member_id", { mode: "number", unsigned: true }).notNull(),
    submissionUrl: varchar("submission_url", { length: 1000 }),
    notes: text("notes"),
    status: mysqlEnum("status", ["submitted", "approved", "rejected"])
      .notNull()
      .default("submitted"),
    reviewedAt: timestamp("reviewed_at"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (t) => ({
    challengeIdx: index("idx_challenge_entries_challenge").on(t.challengeId),
    memberIdx: index("idx_challenge_entries_member").on(t.memberId),
  })
);

// ---------------------------------------------------------------------------
// monetura_travel_bookings
// ---------------------------------------------------------------------------
export const moneturaTravelBookings = mysqlTable(
  "monetura_travel_bookings",
  {
    id: bigint("id", { mode: "number", unsigned: true })
      .primaryKey()
      .autoincrement(),
    memberId: bigint("member_id", { mode: "number", unsigned: true }).notNull(),
    destination: varchar("destination", { length: 500 }).notNull(),
    departureDate: timestamp("departure_date"),
    returnDate: timestamp("return_date"),
    travelerCount: int("traveler_count").notNull().default(1),
    totalAmountCents: int("total_amount_cents"),
    currency: varchar("currency", { length: 3 }).notNull().default("CAD"),
    status: mysqlEnum("status", [
      "inquiry",
      "quoted",
      "confirmed",
      "completed",
      "cancelled",
    ])
      .notNull()
      .default("inquiry"),
    notes: text("notes"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
  },
  (t) => ({
    memberIdx: index("idx_travel_bookings_member").on(t.memberId),
    statusIdx: index("idx_travel_bookings_status").on(t.status),
  })
);

// ---------------------------------------------------------------------------
// monetura_social_accounts
// ---------------------------------------------------------------------------
export const moneturaSocialAccounts = mysqlTable(
  "monetura_social_accounts",
  {
    id: bigint("id", { mode: "number", unsigned: true })
      .primaryKey()
      .autoincrement(),
    memberId: bigint("member_id", { mode: "number", unsigned: true }).notNull(),
    platform: mysqlEnum("platform", [
      "instagram",
      "tiktok",
      "youtube",
      "twitter",
      "linkedin",
      "facebook",
    ]).notNull(),
    handle: varchar("handle", { length: 255 }).notNull(),
    profileUrl: varchar("profile_url", { length: 500 }),
    followerCount: int("follower_count"),
    isVerified: boolean("is_verified").notNull().default(false),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (t) => ({
    memberIdx: index("idx_social_accounts_member").on(t.memberId),
  })
);

// ---------------------------------------------------------------------------
// monetura_stripe_customers
// ---------------------------------------------------------------------------
export const moneturaStripeCustomers = mysqlTable(
  "monetura_stripe_customers",
  {
    id: bigint("id", { mode: "number", unsigned: true })
      .primaryKey()
      .autoincrement(),
    memberId: bigint("member_id", { mode: "number", unsigned: true })
      .notNull()
      .unique(),
    stripeCustomerId: varchar("stripe_customer_id", { length: 255 })
      .notNull()
      .unique(),
    stripeSubscriptionId: varchar("stripe_subscription_id", { length: 255 }),
    subscriptionStatus: mysqlEnum("subscription_status", [
      "active",
      "past_due",
      "cancelled",
      "trialing",
      "unpaid",
    ]),
    currentPeriodEnd: timestamp("current_period_end"),
    planId: varchar("plan_id", { length: 255 }),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
  },
  (t) => ({
    memberIdx: uniqueIndex("idx_stripe_customers_member").on(t.memberId),
    stripeIdIdx: uniqueIndex("idx_stripe_customers_stripe_id").on(
      t.stripeCustomerId
    ),
  })
);

// ---------------------------------------------------------------------------
// monetura_email_sequences
// ---------------------------------------------------------------------------
export const moneturaEmailSequences = mysqlTable(
  "monetura_email_sequences",
  {
    id: bigint("id", { mode: "number", unsigned: true })
      .primaryKey()
      .autoincrement(),
    memberId: bigint("member_id", { mode: "number", unsigned: true }).notNull(),
    sequenceName: varchar("sequence_name", { length: 255 }).notNull(),
    stepNumber: int("step_number").notNull().default(1),
    status: mysqlEnum("status", ["pending", "sent", "failed", "skipped"])
      .notNull()
      .default("pending"),
    scheduledAt: timestamp("scheduled_at"),
    sentAt: timestamp("sent_at"),
    resendEmailId: varchar("resend_email_id", { length: 255 }),
    metadata: json("metadata"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (t) => ({
    memberIdx: index("idx_email_sequences_member").on(t.memberId),
    statusIdx: index("idx_email_sequences_status").on(t.status),
    scheduledIdx: index("idx_email_sequences_scheduled").on(t.scheduledAt),
  })
);

// ---------------------------------------------------------------------------
// Relations
// ---------------------------------------------------------------------------
export const moneturaMembersRelations = relations(
  moneturaMembers,
  ({ many, one }) => ({
    founderKey: one(moneturaFounderKeys, {
      fields: [moneturaMembers.id],
      references: [moneturaFounderKeys.memberId],
    }),
    milestones: many(moneturaMilestones),
    contentPosts: many(moneturaContentPosts),
    affiliateLinks: many(moneturaAffiliateLinks),
    commissions: many(moneturaCommissions),
    creditUsage: many(moneturaCreditUsage),
    challengeEntries: many(moneturaChallengeEntries),
    travelBookings: many(moneturaTravelBookings),
    socialAccounts: many(moneturaSocialAccounts),
    stripeCustomer: one(moneturaStripeCustomers, {
      fields: [moneturaMembers.id],
      references: [moneturaStripeCustomers.memberId],
    }),
    emailSequences: many(moneturaEmailSequences),
  })
);

export const moneturaFounderKeysRelations = relations(
  moneturaFounderKeys,
  ({ one }) => ({
    member: one(moneturaMembers, {
      fields: [moneturaFounderKeys.memberId],
      references: [moneturaMembers.id],
    }),
  })
);

export const moneturaMilestonesRelations = relations(
  moneturaMilestones,
  ({ one }) => ({
    member: one(moneturaMembers, {
      fields: [moneturaMilestones.memberId],
      references: [moneturaMembers.id],
    }),
  })
);

export const moneturaContentPostsRelations = relations(
  moneturaContentPosts,
  ({ one }) => ({
    author: one(moneturaMembers, {
      fields: [moneturaContentPosts.authorId],
      references: [moneturaMembers.id],
    }),
  })
);

export const moneturaAffiliateLinksRelations = relations(
  moneturaAffiliateLinks,
  ({ one, many }) => ({
    member: one(moneturaMembers, {
      fields: [moneturaAffiliateLinks.memberId],
      references: [moneturaMembers.id],
    }),
    clicks: many(moneturaAffiliateClicks),
    commissions: many(moneturaCommissions),
  })
);

export const moneturaAffiliateClicksRelations = relations(
  moneturaAffiliateClicks,
  ({ one }) => ({
    link: one(moneturaAffiliateLinks, {
      fields: [moneturaAffiliateClicks.linkId],
      references: [moneturaAffiliateLinks.id],
    }),
  })
);

export const moneturaCommissionsRelations = relations(
  moneturaCommissions,
  ({ one }) => ({
    affiliate: one(moneturaMembers, {
      fields: [moneturaCommissions.affiliateMemberId],
      references: [moneturaMembers.id],
    }),
    link: one(moneturaAffiliateLinks, {
      fields: [moneturaCommissions.linkId],
      references: [moneturaAffiliateLinks.id],
    }),
  })
);

export const moneturaChallengesRelations = relations(
  moneturaChallenges,
  ({ many }) => ({
    entries: many(moneturaChallengeEntries),
  })
);

export const moneturaChallengeEntriesRelations = relations(
  moneturaChallengeEntries,
  ({ one }) => ({
    challenge: one(moneturaChallenges, {
      fields: [moneturaChallengeEntries.challengeId],
      references: [moneturaChallenges.id],
    }),
    member: one(moneturaMembers, {
      fields: [moneturaChallengeEntries.memberId],
      references: [moneturaMembers.id],
    }),
  })
);

export const moneturaTravelBookingsRelations = relations(
  moneturaTravelBookings,
  ({ one }) => ({
    member: one(moneturaMembers, {
      fields: [moneturaTravelBookings.memberId],
      references: [moneturaMembers.id],
    }),
  })
);

export const moneturaSocialAccountsRelations = relations(
  moneturaSocialAccounts,
  ({ one }) => ({
    member: one(moneturaMembers, {
      fields: [moneturaSocialAccounts.memberId],
      references: [moneturaMembers.id],
    }),
  })
);

export const moneturaStripeCustomersRelations = relations(
  moneturaStripeCustomers,
  ({ one }) => ({
    member: one(moneturaMembers, {
      fields: [moneturaStripeCustomers.memberId],
      references: [moneturaMembers.id],
    }),
  })
);

export const moneturaCreditUsageRelations = relations(
  moneturaCreditUsage,
  ({ one }) => ({
    member: one(moneturaMembers, {
      fields: [moneturaCreditUsage.memberId],
      references: [moneturaMembers.id],
    }),
  })
);

export const moneturaEmailSequencesRelations = relations(
  moneturaEmailSequences,
  ({ one }) => ({
    member: one(moneturaMembers, {
      fields: [moneturaEmailSequences.memberId],
      references: [moneturaMembers.id],
    }),
  })
);
