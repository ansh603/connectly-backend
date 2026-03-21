export async function up(knex) {
  const exists = await knex.schema.hasTable("support_messages");
  if (exists) return;

  await knex.schema.createTable("support_messages", (table) => {
    table.uuid("id", 36).primary();
    table
      .enu("type", ["ticket", "support"])
      .notNullable();
    table.string("reason", 255).nullable();
    table.text("message").notNullable();
    table.string("name", 255).notNullable();
    table.string("email", 255).notNullable();

    table.timestamp("created_at").notNullable().defaultTo(knex.fn.now());
    table.timestamp("updated_at").notNullable().defaultTo(knex.fn.now());
  });
}

export async function down(knex) {
  const exists = await knex.schema.hasTable("support_messages");
  if (!exists) return;
  await knex.schema.dropTable("support_messages");
}

