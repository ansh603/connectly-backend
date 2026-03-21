export async function up(knex) {
  const hasUsers = await knex.schema.hasTable("users");
  if (!hasUsers) return;

  const addCol = async (col, fn) => {
    const exists = await knex.schema.hasColumn("users", col);
    if (!exists) await knex.schema.alterTable("users", fn);
  };

  await addCol("availability", (table) => table.text("availability").nullable());
  await addCol("gallery_paths", (table) => table.text("gallery_paths").nullable());
  await addCol("selfie_path", (table) => table.string("selfie_path", 255).nullable());
}

export async function down(knex) {
  const hasUsers = await knex.schema.hasTable("users");
  if (!hasUsers) return;

  const dropCol = async (col) => {
    const exists = await knex.schema.hasColumn("users", col);
    if (exists) {
      await knex.schema.alterTable("users", (table) => table.dropColumn(col));
    }
  };

  await dropCol("availability");
  await dropCol("gallery_paths");
  await dropCol("selfie_path");
}
