export async function up(knex) {
  const hasTable = await knex.schema.hasTable("wallet_transactions");
  if (hasTable) return;

  await knex.schema.createTable("wallet_transactions", (table) => {
    table.uuid("id").primary();
    table
      .uuid("user_id")
      .notNullable()
      .references("id")
      .inTable("users")
      .onDelete("CASCADE");

    // credit/debit + escrow hold/release.
    table
      .enu("kind", [
        "credit",
        "debit",
        "escrow_hold",
        "escrow_release",
        "withdrawal",
      ])
      .notNullable();

    table.text("description").nullable();

    // amount shown in UI uses `delta_wallet` (signed)
    table.decimal("delta_wallet", 18, 2).notNullable();
    table.decimal("delta_escrow", 18, 2).notNullable();

    table.string("reference_type", 50).nullable();
    table.string("reference_id", 100).nullable();

    table.timestamp("created_at").notNullable().defaultTo(knex.fn.now());
    table.timestamp("updated_at").notNullable().defaultTo(knex.fn.now());
  });
}

export async function down(knex) {
  const hasTable = await knex.schema.hasTable("wallet_transactions");
  if (!hasTable) return;
  await knex.schema.dropTable("wallet_transactions");
}

