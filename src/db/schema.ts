import {
  pgTable,
  uuid,
  text,
  numeric,
  integer,
  timestamp,
  date,
  pgEnum,
  unique,
  index,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

/* ── Enums ── */

export const liftEnum = pgEnum("lift", [
  "squat",
  "deadlift",
  "ohp",
  "pullup",
  "bench",
]);

export const runTypeEnum = pgEnum("run_type", [
  "easy",
  "long_easy",
  "intervals",
  "recovery",
]);

export const skillStatusEnum = pgEnum("skill_status", [
  "not_started",
  "working",
  "achieved",
]);

export const skillKeyEnum = pgEnum("skill_key", [
  "rolls_cartwheel",
  "handstand_2h",
  "handstand_pushup",
  "pistol_squat",
  "lsit_planche",
  "front_split",
  "middle_split",
  "windmill",
  "backflip",
  "front_flip",
  "one_arm_handstand",
]);

/* ── Tables ── */

export const users = pgTable("users", {
  id: uuid("id").defaultRandom().primaryKey(),
  email: text("email").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  displayName: text("display_name"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const userSettings = pgTable("user_settings", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id").notNull().unique(),
  goalWeightKg: numeric("goal_weight_kg", { precision: 5, scale: 2 }).default("80").notNull(),
  currentUnit: text("current_unit").default("kg").notNull(),
  timezone: text("timezone").default("Asia/Kolkata").notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

export const liftEntries = pgTable(
  "lift_entries",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id").notNull(),
    date: date("date").notNull(),
    lift: liftEnum("lift").notNull(),
    weightKg: numeric("weight_kg", { precision: 6, scale: 2 }).notNull(),
    reps: integer("reps").notNull(),
    rpe: numeric("rpe", { precision: 3, scale: 1 }),
    notes: text("notes"),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [
    index("lift_entries_user_date_idx").on(t.userId, t.date),
    index("lift_entries_user_lift_idx").on(t.userId, t.lift),
  ]
);

export const bodyStats = pgTable(
  "body_stats",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id").notNull(),
    date: date("date").notNull(),
    weightKg: numeric("weight_kg", { precision: 5, scale: 2 }).notNull(),
    waistCm: numeric("waist_cm", { precision: 5, scale: 2 }),
    notes: text("notes"),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [index("body_stats_user_date_idx").on(t.userId, t.date)]
);

export const runningSessions = pgTable(
  "running_sessions",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id").notNull(),
    date: date("date").notNull(),
    type: runTypeEnum("type").notNull(),
    distanceKm: numeric("distance_km", { precision: 6, scale: 2 }).notNull(),
    durationMin: numeric("duration_min", { precision: 6, scale: 1 }).notNull(),
    notes: text("notes"),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [index("running_sessions_user_date_idx").on(t.userId, t.date)]
);

export const mobilityStats = pgTable(
  "mobility_stats",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id").notNull(),
    date: date("date").notNull(),
    frontSplitGapCm: numeric("front_split_gap_cm", { precision: 5, scale: 1 }),
    middleSplitGapCm: numeric("middle_split_gap_cm", { precision: 5, scale: 1 }),
    wallHsHoldS: integer("wall_hs_hold_s"),
    freestandingHsHoldS: integer("freestanding_hs_hold_s"),
    lsitHoldS: integer("lsit_hold_s"),
    notes: text("notes"),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [index("mobility_stats_user_date_idx").on(t.userId, t.date)]
);

export const skillCheckpoints = pgTable(
  "skill_checkpoints",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id").notNull(),
    skillKey: skillKeyEnum("skill_key").notNull(),
    status: skillStatusEnum("status").default("not_started").notNull(),
    notes: text("notes"),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [
    unique("skill_checkpoints_user_skill_unique").on(t.userId, t.skillKey),
    index("skill_checkpoints_user_idx").on(t.userId),
  ]
);

/* Auth.js session table (encrypted JWT strategy, but adapter needs accounts/sessions for some flows) */
export const accounts = pgTable(
  "accounts",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id").notNull(),
    type: text("type").notNull(),
    provider: text("provider").notNull(),
    providerAccountId: text("provider_account_id").notNull(),
    refreshToken: text("refresh_token"),
    accessToken: text("access_token"),
    expiresAt: integer("expires_at"),
    tokenType: text("token_type"),
    scope: text("scope"),
    idToken: text("id_token"),
    sessionState: text("session_state"),
  },
  (t) => [unique().on(t.provider, t.providerAccountId)]
);

export const loginAttempts = pgTable("login_attempts", {
  id: uuid("id").defaultRandom().primaryKey(),
  identifier: text("identifier").notNull(),
  attempts: integer("attempts").default(0).notNull(),
  lockedUntil: timestamp("locked_until", { withTimezone: true }),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

/* ── Relations ── */

export const usersRelations = relations(users, ({ one, many }) => ({
  settings: one(userSettings, { fields: [users.id], references: [userSettings.userId] }),
  liftEntries: many(liftEntries),
  bodyStats: many(bodyStats),
  runningSessions: many(runningSessions),
  mobilityStats: many(mobilityStats),
  skillCheckpoints: many(skillCheckpoints),
}));

export const userSettingsRelations = relations(userSettings, ({ one }) => ({
  user: one(users, { fields: [userSettings.userId], references: [users.id] }),
}));

export const liftEntriesRelations = relations(liftEntries, ({ one }) => ({
  user: one(users, { fields: [liftEntries.userId], references: [users.id] }),
}));

export const bodyStatsRelations = relations(bodyStats, ({ one }) => ({
  user: one(users, { fields: [bodyStats.userId], references: [users.id] }),
}));

export const runningSessionsRelations = relations(runningSessions, ({ one }) => ({
  user: one(users, { fields: [runningSessions.userId], references: [users.id] }),
}));

export const mobilityStatsRelations = relations(mobilityStats, ({ one }) => ({
  user: one(users, { fields: [mobilityStats.userId], references: [users.id] }),
}));

export const skillCheckpointsRelations = relations(skillCheckpoints, ({ one }) => ({
  user: one(users, { fields: [skillCheckpoints.userId], references: [users.id] }),
}));
