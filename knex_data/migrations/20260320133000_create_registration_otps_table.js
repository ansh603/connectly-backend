export async function up(knex) {
  const exists = await knex.schema.hasTable("registration_otps");
  if (exists) return;

  await knex.schema.createTable("registration_otps", (table) => {
    table.uuid("id", 36).primary();
    table.string("email", 255).notNullable().unique();
    table.string("otp_code", 6).notNullable();
    table.timestamp("expires_at").notNullable();
    table.timestamp("verified_at").nullable();
    table.timestamp("created_at").notNullable().defaultTo(knex.fn.now());
    table.timestamp("updated_at").notNullable().defaultTo(knex.fn.now());
  });
}

export async function down(knex) {
  const exists = await knex.schema.hasTable("registration_otps");
  if (exists) await knex.schema.dropTable("registration_otps");
}

