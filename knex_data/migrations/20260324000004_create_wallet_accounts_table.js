export async function up(knex) {
  const hasTable = await knex.schema.hasTable("wallet_accounts");
  if (hasTable) return;

  await knex.schema.createTable("wallet_accounts", (table) => {
    table.uuid("id").primary();
    table.uuid("user_id").notNullable().unique().references("id").inTable("users").onDelete("CASCADE");

    table.decimal("wallet_balance", 18, 2).notNullable().defaultTo(0);
    table.decimal("escrow_balance", 18, 2).notNullable().defaultTo(0);
    table.decimal("total_earned", 18, 2).notNullable().defaultTo(0);

    table.timestamp("created_at").notNullable().defaultTo(knex.fn.now());
    table.timestamp("updated_at").notNullable().defaultTo(knex.fn.now());
  });
}

export async function down(knex) {
  const hasTable = await knex.schema.hasTable("wallet_accounts");
  if (!hasTable) return;

  await knex.schema.dropTable("wallet_accounts");
}

