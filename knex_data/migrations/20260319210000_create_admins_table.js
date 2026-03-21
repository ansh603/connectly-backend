export async function up(knex) {
  const exists = await knex.schema.hasTable("admins");
  if (exists) return;

  await knex.schema.createTable("admins", (table) => {
    table.uuid("id", 36).primary();
    table.string("name", 255).nullable();
    table.string("email_address", 255).nullable().unique();
    table.string("password", 255).nullable();
    table.timestamp("created_at").notNullable().defaultTo(knex.fn.now());
    table.timestamp("updated_at").notNullable().defaultTo(knex.fn.now());
  });
}

export async function down(knex) {
  const exists = await knex.schema.hasTable("admins");
  if (exists) {
    await knex.schema.dropTable("admins");
  }
}
