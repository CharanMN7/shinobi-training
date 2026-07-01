import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import * as schema from "./schema";
import { eq } from "drizzle-orm";
import * as argon2 from "argon2";
import { SKILL_ORDER } from "../lib/engines";

const DATABASE_URL = process.env.DATABASE_URL;
const SEED_EMAIL = process.env.SEED_USER_EMAIL;
const SEED_PASS = process.env.SEED_USER_PASSWORD;

if (!DATABASE_URL || !SEED_EMAIL || !SEED_PASS) {
  console.error("Missing DATABASE_URL, SEED_USER_EMAIL, or SEED_USER_PASSWORD");
  process.exit(1);
}

const sql = neon(DATABASE_URL);
const db = drizzle(sql, { schema });

async function seed() {
  console.log("Seeding database...");

  // Upsert user
  const lowerEmail = SEED_EMAIL!.toLowerCase();
  let user = await db.query.users.findFirst({
    where: eq(schema.users.email, lowerEmail),
  });

  if (!user) {
    const passwordHash = await argon2.hash(SEED_PASS!, {
      type: argon2.argon2id,
      memoryCost: 65536,
      timeCost: 3,
      parallelism: 4,
    });
    [user] = await db
      .insert(schema.users)
      .values({ email: lowerEmail, passwordHash, displayName: "Shinobi" })
      .returning();
    console.log(`Created user: ${lowerEmail}`);
  } else {
    console.log(`User already exists: ${lowerEmail}`);
  }

  // Upsert settings
  const existing = await db.query.userSettings.findFirst({
    where: eq(schema.userSettings.userId, user.id),
  });
  if (!existing) {
    await db.insert(schema.userSettings).values({
      userId: user.id,
      goalWeightKg: "80",
      timezone: "Asia/Kolkata",
    });
    console.log("Created user settings");
  }

  // Baseline body stat (69 kg starting)
  const hasBody = await db.query.bodyStats.findFirst({
    where: eq(schema.bodyStats.userId, user.id),
  });
  if (!hasBody) {
    await db.insert(schema.bodyStats).values({
      userId: user.id,
      date: "2026-01-01",
      weightKg: "69",
      notes: "Starting baseline",
    });
    console.log("Created baseline body stat");
  }

  // Skill checkpoints
  const existingSkills = await db.query.skillCheckpoints.findMany({
    where: eq(schema.skillCheckpoints.userId, user.id),
  });
  const existingKeys = new Set(existingSkills.map((s) => s.skillKey));
  const missing = SKILL_ORDER.filter((k) => !existingKeys.has(k as (typeof schema.skillKeyEnum.enumValues)[number]));

  if (missing.length > 0) {
    await db.insert(schema.skillCheckpoints).values(
      missing.map((skillKey) => ({
        userId: user.id,
        skillKey: skillKey as (typeof schema.skillKeyEnum.enumValues)[number],
        status: "not_started" as const,
      }))
    );
    console.log(`Seeded ${missing.length} skill checkpoints`);
  }

  console.log("Seed complete!");
  process.exit(0);
}

seed().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
