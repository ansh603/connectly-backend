import { randomUUID } from "crypto";

export async function up(knex) {
  const exists = await knex.schema.hasTable("user_availability_slots");
  if (exists) return;

  await knex.schema.createTable("user_availability_slots", (table) => {
    table.uuid("id", 36).primary();
    table.uuid("user_id", 36).notNullable();
    table.string("day", 20).notNullable();
    table.boolean("on").notNullable().defaultTo(false);
    table.string("slot", 255).nullable();

    table.unique(["user_id", "day"], {
      indexName: "uq_user_availability_slots_user_day",
    });

    table
      .foreign("user_id")
      .references("id")
      .inTable("users")
      .onDelete("CASCADE");

    table.timestamp("created_at").notNullable().defaultTo(knex.fn.now());
    table.timestamp("updated_at").notNullable().defaultTo(knex.fn.now());
  });

  // Backfill from legacy `users.availability` JSON column.
  const users = await knex("users").select(["id", "availability"]);
  for (const u of users) {
    const raw = u.availability;
    if (!raw || typeof raw !== "string") continue;
    const s = raw.trim();
    if (!s.startsWith("{")) continue;
    try {
      const j = JSON.parse(s);
      const days = j?.days;
      if (!days || typeof days !== "object") continue;
      const entries = Object.entries(days).map(([day, v]) => ({
        id: randomUUID(),
        user_id: u.id,
        day,
        on: Boolean(v?.on),
        slot: v?.slot || null,
      }));
      if (entries.length > 0) {
        await knex("user_availability_slots").insert(entries);
      }
    } catch {
      // ignore malformed availability JSON
    }
  }
}

export async function down(knex) {
  const exists = await knex.schema.hasTable("user_availability_slots");
  if (!exists) return;
  await knex.schema.dropTable("user_availability_slots");
}

