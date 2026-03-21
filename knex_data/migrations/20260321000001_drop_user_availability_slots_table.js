export async function up(knex) {
  const exists = await knex.schema.hasTable("user_availability_slots");
  if (!exists) return;
  await knex.schema.dropTable("user_availability_slots");
}

export async function down(knex) {
  // No-op for dev cleanup.
}

