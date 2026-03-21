export async function up(knex) {
  const hasTable = await knex.schema.hasTable("notifications");
  if (hasTable) return;

  await knex.schema.createTable("notifications", (table) => {
    table.uuid("id").primary();
    table.uuid("user_id").notNullable().references("id").inTable("users").onDelete("CASCADE");

    table.text("text").notNullable();
    table.string("type", 30).nullable().defaultTo("success"); // success | payment | booking
    table.boolean("read").notNullable().defaultTo(false);

    table.string("reference_type", 50).nullable();
    table.string("reference_id", 100).nullable();

    table.timestamp("created_at").notNullable().defaultTo(knex.fn.now());
  });

  await knex.schema.alterTable("notifications", (table) => {
    table.index(["user_id", "read"]);
  });
}

export async function down(knex) {
  const hasTable = await knex.schema.hasTable("notifications");
  if (!hasTable) return;
  await knex.schema.dropTable("notifications");
}
