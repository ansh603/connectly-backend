export async function up(knex) {
  const hasUsers = await knex.schema.hasTable("users");
  if (!hasUsers) return;

  const hasCol = await knex.schema.hasColumn("users", "is_verified");
  if (!hasCol) {
    await knex.schema.alterTable("users", (table) => {
      table.boolean("is_verified").notNullable().defaultTo(false);
    });
  }

  // Existing accounts can log in without email re-verification
  await knex("users").update({ is_verified: true });
}

export async function down(knex) {
  const hasUsers = await knex.schema.hasTable("users");
  if (!hasUsers) return;
  const hasCol = await knex.schema.hasColumn("users", "is_verified");
  if (hasCol) {
    await knex.schema.alterTable("users", (table) => table.dropColumn("is_verified"));
  }
}
