export async function up(knex) {
  const hasInterests = await knex.schema.hasTable("interests");
  if (!hasInterests) return;

  const hasIconPath = await knex.schema.hasColumn("interests", "icon_path");
  if (hasIconPath) return;

  await knex.schema.alterTable("interests", (table) => {
    table.string("icon_path", 1024).nullable();
  });
}

export async function down(knex) {
  const hasInterests = await knex.schema.hasTable("interests");
  if (!hasInterests) return;

  const hasIconPath = await knex.schema.hasColumn("interests", "icon_path");
  if (!hasIconPath) return;

  await knex.schema.alterTable("interests", (table) => {
    table.dropColumn("icon_path");
  });
}
