import bcrypt from "bcrypt";
import { randomUUID } from "node:crypto";

const DEFAULT_EMAIL = "admin@dostnow.local";
const DEFAULT_PASSWORD = "Admin@123";

/**
 * Seed a default admin (for dev). Safe to run multiple times.
 * @param { import("knex").Knex } knex
 */
export async function seed(knex) {
  const hasAdmins = await knex.schema.hasTable("admins");
  if (!hasAdmins) {
    console.warn(
      "[002_default_admin] Skipping seed because `admins` table does not exist."
    );
    return;
  }

  const existing = await knex("admins")
    .where({ email_address: DEFAULT_EMAIL })
    .first();
  if (existing) return;

  const hash = await bcrypt.hash(DEFAULT_PASSWORD, 10);

  await knex("admins").insert({
    id: randomUUID(),
    name: "Super Admin",
    email_address: DEFAULT_EMAIL,
    password: hash,
    created_at: knex.fn.now(),
    updated_at: knex.fn.now(),
  });
}

