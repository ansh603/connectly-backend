import { randomUUID } from "crypto";

function parseDaysFromAvailability(raw) {
  if (!raw || typeof raw !== "string") return null;
  const s = raw.trim();
  if (!s.startsWith("{")) return null;
  try {
    const j = JSON.parse(s);
    if (j && j.days && typeof j.days === "object") return j.days;
  } catch {
    // ignore
  }
  return null;
}

export async function up(knex) {
  const usersHasAvailability = await knex.schema.hasColumn("users", "availability");

  const slotsExists = await knex.schema.hasTable("user_availability_slots");
  if (!slotsExists) {
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
  }

  if (!usersHasAvailability) return;

  // Backfill from legacy column into the slots table.
  const users = await knex("users").select(["id", "availability"]);
  for (const u of users) {
    const days = parseDaysFromAvailability(u.availability);
    if (!days) continue;

    await knex("user_availability_slots").delete().where({ user_id: u.id });

    const entries = Object.entries(days).map(([day, v]) => ({
      id: randomUUID(),
      user_id: u.id,
      day,
      on: Boolean(v?.on),
      slot: v?.slot ?? null,
    }));

    if (entries.length > 0) {
      await knex("user_availability_slots").insert(entries);
    }
  }

  // Drop legacy column (development phase).
  await knex.schema.alterTable("users", (table) => {
    table.dropColumn("availability");
  });
}

export async function down(knex) {
  const usersHasAvailability = await knex.schema.hasColumn("users", "availability");
  if (usersHasAvailability) return;

  const slotsExists = await knex.schema.hasTable("user_availability_slots");
  if (!slotsExists) return;

  await knex.schema.alterTable("users", (table) => {
    table.text("availability").nullable();
  });

  const users = await knex("users").select(["id"]);
  for (const u of users) {
    const rows = await knex("user_availability_slots")
      .select(["day", "on", "slot"])
      .where({ user_id: u.id });

    if (!rows || rows.length === 0) continue;

    const days = {};
    rows.forEach((r) => {
      if (!r.day) return;
      days[r.day] = {
        on: Boolean(r.on),
        ...(r.slot != null ? { slot: r.slot } : {}),
      };
    });

    await knex("users").where({ id: u.id }).update({
      availability: JSON.stringify({ days }),
    });
  }
}

