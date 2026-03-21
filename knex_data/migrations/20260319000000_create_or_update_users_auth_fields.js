export async function up(knex) {
  const hasUsersTable = await knex.schema.hasTable("users");

  if (!hasUsersTable) {
    await knex.schema.createTable("users", (table) => {
      table.uuid("id", 36).primary();
      table.string("name", 255).nullable();
      table.string("profile_path", 255).nullable();
      table.string("country_code", 5).nullable();
      table.string("phone_number", 20).nullable();
      table.string("email_address", 255).notNullable().unique();
      table.string("password", 255).notNullable();
      table.string("user_type", 30).notNullable().defaultTo("individual");
      table.text("bio").nullable();
      table.decimal("rate", 10, 2).nullable();
      table.string("location", 255).nullable();
      table.integer("age").nullable();
      table.text("interests").nullable();
      table.enu("status", ["active", "inactive", "deleted"]).defaultTo("active");
      table.string("otp", 20).nullable();
      table.string("expiry_time", 255).nullable();
      table.boolean("is_completed").notNullable().defaultTo(false);
      table.timestamp("created_at").notNullable().defaultTo(knex.fn.now());
      table.timestamp("updated_at").notNullable().defaultTo(knex.fn.now());
    });
    return;
  }

  const hasPassword = await knex.schema.hasColumn("users", "password");
  const hasUserType = await knex.schema.hasColumn("users", "user_type");
  const hasBio = await knex.schema.hasColumn("users", "bio");
  const hasRate = await knex.schema.hasColumn("users", "rate");
  const hasLocation = await knex.schema.hasColumn("users", "location");
  const hasAge = await knex.schema.hasColumn("users", "age");
  const hasInterests = await knex.schema.hasColumn("users", "interests");

  await knex.schema.alterTable("users", (table) => {
    if (!hasPassword) table.string("password", 255).nullable();
    if (!hasUserType) table.string("user_type", 30).notNullable().defaultTo("individual");
    if (!hasBio) table.text("bio").nullable();
    if (!hasRate) table.decimal("rate", 10, 2).nullable();
    if (!hasLocation) table.string("location", 255).nullable();
    if (!hasAge) table.integer("age").nullable();
    if (!hasInterests) table.text("interests").nullable();
  });
}

export async function down(knex) {
  const hasUsersTable = await knex.schema.hasTable("users");
  if (!hasUsersTable) return;

  const hasPassword = await knex.schema.hasColumn("users", "password");
  const hasUserType = await knex.schema.hasColumn("users", "user_type");
  const hasBio = await knex.schema.hasColumn("users", "bio");
  const hasRate = await knex.schema.hasColumn("users", "rate");
  const hasLocation = await knex.schema.hasColumn("users", "location");
  const hasAge = await knex.schema.hasColumn("users", "age");
  const hasInterests = await knex.schema.hasColumn("users", "interests");

  await knex.schema.alterTable("users", (table) => {
    if (hasPassword) table.dropColumn("password");
    if (hasUserType) table.dropColumn("user_type");
    if (hasBio) table.dropColumn("bio");
    if (hasRate) table.dropColumn("rate");
    if (hasLocation) table.dropColumn("location");
    if (hasAge) table.dropColumn("age");
    if (hasInterests) table.dropColumn("interests");
  });
}
