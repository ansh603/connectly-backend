export async function up(knex) {
  const hasUsersGroups = await knex.schema.hasTable("user_groups");
  if (hasUsersGroups) return;

  await knex.schema.createTable("user_groups", (table) => {
    table.uuid("id").primary();
    table
      .uuid("user_id")
      .notNullable()
      .unique()
      .references("id")
      .inTable("users")
      .onDelete("CASCADE");

    // Group specific fields captured during group registration
    table.string("group_name", 255).nullable();
    table.string("group_type", 255).nullable();
    table.integer("members").notNullable().defaultTo(1);

    table.string("contact_name", 255).nullable();
    table.string("contact_mobile", 20).nullable();
    table.string("contact_country_code", 8).nullable();

    table.timestamp("created_at").notNullable().defaultTo(knex.fn.now());
    table.timestamp("updated_at").notNullable().defaultTo(knex.fn.now());
  });
}

export async function down(knex) {
  const hasUsersGroups = await knex.schema.hasTable("user_groups");
  if (!hasUsersGroups) return;

  await knex.schema.dropTable("user_groups");
}

