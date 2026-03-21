export async function up(knex) {
  const hasCities = await knex.schema.hasTable("cities");
  if (!hasCities) {
    await knex.schema.createTable("cities", (table) => {
      table.uuid("id").primary();
      table.string("name", 255).notNullable().unique();
      table.enu("status", ["active", "inactive"]).notNullable().defaultTo("active");
      table.timestamp("created_at").notNullable().defaultTo(knex.fn.now());
      table.timestamp("updated_at").notNullable().defaultTo(knex.fn.now());
    });
  }

  const hasInterests = await knex.schema.hasTable("interests");
  if (!hasInterests) {
    await knex.schema.createTable("interests", (table) => {
      table.uuid("id").primary();
      table.string("name", 255).notNullable().unique();
      table.enu("status", ["active", "inactive"]).notNullable().defaultTo("active");
      table.timestamp("created_at").notNullable().defaultTo(knex.fn.now());
      table.timestamp("updated_at").notNullable().defaultTo(knex.fn.now());
    });
  }

  const hasUserInterests = await knex.schema.hasTable("user_interests");
  if (!hasUserInterests) {
    await knex.schema.createTable("user_interests", (table) => {
      table.uuid("id").primary();
      table.uuid("user_id").notNullable();
      table.uuid("interest_id").notNullable();
      table.timestamp("created_at").notNullable().defaultTo(knex.fn.now());
      table.timestamp("updated_at").notNullable().defaultTo(knex.fn.now());
      table.unique(["user_id", "interest_id"]);
      table
        .foreign("user_id")
        .references("id")
        .inTable("users")
        .onDelete("CASCADE");
      table
        .foreign("interest_id")
        .references("id")
        .inTable("interests")
        .onDelete("CASCADE");
    });
  }

  const hasUsers = await knex.schema.hasTable("users");
  if (hasUsers) {
    const hasCityId = await knex.schema.hasColumn("users", "city_id");
    if (!hasCityId) {
      await knex.schema.alterTable("users", (table) => {
        table.uuid("city_id").nullable();
        table
          .foreign("city_id")
          .references("id")
          .inTable("cities")
          .onDelete("SET NULL");
      });
    }
  }
}

export async function down(knex) {
  const hasUsers = await knex.schema.hasTable("users");
  if (hasUsers) {
    const hasCityId = await knex.schema.hasColumn("users", "city_id");
    if (hasCityId) {
      await knex.schema.alterTable("users", (table) => {
        table.dropColumn("city_id");
      });
    }
  }

  const hasUserInterests = await knex.schema.hasTable("user_interests");
  if (hasUserInterests) {
    await knex.schema.dropTable("user_interests");
  }

  const hasInterests = await knex.schema.hasTable("interests");
  if (hasInterests) {
    await knex.schema.dropTable("interests");
  }

  const hasCities = await knex.schema.hasTable("cities");
  if (hasCities) {
    await knex.schema.dropTable("cities");
  }
}
