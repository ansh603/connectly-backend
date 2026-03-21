export async function up(knex) {
  const exists = await knex.schema.hasTable("site_contents");
  if (exists) return;

  await knex.schema.createTable("site_contents", (table) => {
    table.uuid("id", 36).primary();
    table.string("key", 100).notNullable().unique();
    table.string("title", 255).nullable();
    table.text("html_content").notNullable();

    table.timestamp("created_at").notNullable().defaultTo(knex.fn.now());
    table.timestamp("updated_at").notNullable().defaultTo(knex.fn.now());
  });
}

export async function down(knex) {
  const exists = await knex.schema.hasTable("site_contents");
  if (!exists) return;
  await knex.schema.dropTable("site_contents");
}

